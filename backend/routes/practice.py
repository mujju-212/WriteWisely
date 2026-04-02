"""
routes/practice.py — Practice Mode Routes
Templates, Live Check, Submissions, History
"""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
import json

from config import get_db
from middleware.auth_middleware import get_current_user
from services.checker_service import check_text
from services.pattern_service import (
    add_credits, save_errors, get_badges, update_streak,
    CREDIT_VALUES, calculate_practice_credits, check_practice_badges
)
from services import analytics_service
from models.schemas import SubmitPracticeRequest

router = APIRouter()


# ─── Helper ────────────────────────────────────────────────────

def _level_name(level_num: int) -> str:
    if level_num <= 10:
        return "beginner"
    elif level_num <= 20:
        return "intermediate"
    return "advanced"


def _get_templates() -> list:
    """Load practice templates from JSON file."""
    try:
        with open("data/practice_templates.json", "r") as f:
            data = json.load(f)
        return data.get("templates", [])
    except FileNotFoundError:
        return []


def _type_icon(task_type: str) -> str:
    icons = {
        "email": "📧",
        "letter": "📄",
        "report": "📊",
        "conversation": "💬",
        "article": "📰",
        "essay": "📝",
    }
    return icons.get(task_type, "📝")


# ─── GET /api/practice/templates ──────────────────────────────
@router.get("/templates")
async def get_templates(user=Depends(get_current_user)):
    """Return task templates filtered/tagged by user level."""
    db = get_db()
    user_level_num = user.get("profile", {}).get("current_level", 1)
    level_cat = _level_name(user_level_num)

    # Level visibility rules
    level_order = {"beginner": 0, "intermediate": 1, "advanced": 2}
    user_level_order = level_order.get(level_cat, 0)

    templates = _get_templates()

    # Enrich templates with per-user data
    enriched = []
    for t in templates:
        t_level = t.get("level", "beginner")
        t_level_order = level_order.get(t_level, 0)

        # Synthesize a short description if not present
        if not t.get("description"):
            prompt_first_line = t.get("prompt", "").split("\n")[0]
            t = dict(t)  # don't mutate original
            t["description"] = prompt_first_line[:100] + ("..." if len(prompt_first_line) > 100 else "")

        # Only show current level + one above (locked)
        if t_level_order > user_level_order + 1:
            continue

        locked = t_level_order > user_level_order

        # Fetch user's practice records for this task
        records = await db.practice_records.find(
            {"user_id": user["id"], "task_id": t["task_id"]}
        ).sort("submitted_at", -1).to_list(length=5)

        times_done = len(records)
        last_score = records[0].get("overall_score") if records else None

        enriched.append({
            **t,
            "locked": locked,
            "times_done": times_done,
            "last_score": last_score,
            "icon": _type_icon(t.get("type", "")),
        })

    # Sort: unlocked first, then locked; within each group by difficulty
    enriched.sort(key=lambda x: (x["locked"], x.get("difficulty", 1)))

    return {"templates": enriched, "user_level": level_cat}


# ─── GET /api/practice/templates/:taskId ──────────────────────
@router.get("/templates/{task_id}")
async def get_template(task_id: str, user=Depends(get_current_user)):
    """Get single template details with user history."""
    db = get_db()
    templates = _get_templates()
    task = next((t for t in templates if t["task_id"] == task_id), None)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Fetch user records for this task
    records = await db.practice_records.find(
        {"user_id": user["id"], "task_id": task_id}
    ).sort("submitted_at", -1).to_list(length=10)

    return {
        **task,
        "icon": _type_icon(task.get("type", "")),
        "times_done": len(records),
        "last_score": records[0].get("overall_score") if records else None,
        "history": [
            {
                "practice_id": str(r["_id"]),
                "overall_score": r.get("overall_score"),
                "credits_earned": r.get("credits_earned", 0),
                "submitted_at": r.get("submitted_at"),
                "mode": r.get("mode"),
            }
            for r in records[:5]
        ],
    }


# ─── POST /api/practice/check (live mode) ─────────────────────

class CheckLiveRequest(BaseModel):
    text: str
    task_type: str = "general"


@router.post("/check")
async def check_live(data: CheckLiveRequest, user=Depends(get_current_user)):
    """Live mode check — returns hints only (no corrections shown)."""
    trimmed = data.text.strip()
    if not trimmed or not any(ch.isalpha() for ch in trimmed):
        return {"errors": [], "error_count": {"spelling": 0, "grammar": 0}}

    user_level_num = user.get("profile", {}).get("current_level", 1)
    level_cat = _level_name(user_level_num)

    try:
        result = await check_text(
            text=data.text,
            mode="practice_live",
            context=data.task_type,
            user_level=level_cat,
            user_id=user["id"],
        )
    except Exception as e:
        print(f"⚠️ Live check failed: {e}")
        return {"errors": [], "error_count": {"spelling": 0, "grammar": 0}}

    errors = result.get("errors", [])

    # Strip corrections — live mode shows hints only
    cleaned_errors = []
    for err in errors:
        raw_type = str(err.get("type", "grammar")).strip().lower().replace(" ", "_")
        raw_color = str(err.get("color", "")).strip().lower()
        is_spelling = raw_type == "spelling" or raw_color == "red"
        err_type = "spelling" if is_spelling else "grammar"
        color = "red" if is_spelling else "yellow"

        position = err.get("position", {}) or {}
        start = position.get("start")
        end = position.get("end")

        word = (err.get("word") or err.get("original") or "").strip()
        if not word and isinstance(start, int) and isinstance(end, int) and 0 <= start < end <= len(data.text):
            word = data.text[start:end]

        cleaned_errors.append({
            "type": err_type,
            "word": word,
            "hint": err.get("hint", "Check this word"),
            "suggestion": err.get("correction") or err.get("suggestion") or "",
            "position": position,
            "severity": err.get("severity", "minor"),
            "color": color,
        })

    # Count by type
    error_count = {"spelling": 0, "grammar": 0}
    for err in cleaned_errors:
        t = err["type"]
        if t == "spelling":
            error_count["spelling"] += 1
        else:
            error_count["grammar"] += 1

    return {"errors": cleaned_errors, "error_count": error_count}


# ─── POST /api/practice/submit ───────────────────────────────
@router.post("/submit")
async def submit_practice(data: SubmitPracticeRequest, user=Depends(get_current_user)):
    """Full submission — LLM analysis — save record — award credits."""
    db = get_db()
    user_id = user["id"]
    user_level_num = user.get("profile", {}).get("current_level", 1)
    level_name = _level_name(user_level_num)

    # ── Load task template ──────────────────────────────────
    templates = {t["task_id"]: t for t in _get_templates()}
    task = templates.get(data.task_id, {})

    task_prompt = task.get("prompt", "Free writing practice")
    task_type = task.get("type", "general")
    task_credits = task.get("credits", 30)
    context_type = task.get("context", task_type)

    # ── Input check ────────────────────────────────────────
    stripped_text = data.text.strip()
    word_count = len(stripped_text.split()) if stripped_text else 0
    if word_count == 0:
        raise HTTPException(
            status_code=400,
            detail="Please write something before submitting."
        )

    # ── Full analysis via LLM ─────────────────────────────
    try:
        analysis = await check_text(
            text=data.text,
            mode="practice_analysis",
            context=context_type,
            user_level=level_name,
            user_id=user_id,
            task_prompt=task_prompt
        )
    except Exception as e:
        print(f"⚠️ Analysis failed: {e}")
        analysis = {
            "overall_score": 5.0,
            "category_scores": {
                "spelling": 5, "grammar": 5,
                "sentence_structure": 5, "tone": 5, "completeness": 5
            },
            "errors": [],
            "improved_version": data.text,
            "strengths": ["Good effort! Keep practicing."],
            "areas_to_improve": ["Continue to practice regularly."],
            "fallback_used": True
        }

    score = float(analysis.get("overall_score", 5.0))
    total_errors = len(analysis.get("errors", []))

    # ── Check if first time this task type ─────────────────
    existing_type_count = await db.practice_records.count_documents({
        "user_id": user_id,
        "task_type": task_type
    })
    is_first_time_type = existing_type_count == 0

    # ── Calculate credits ──────────────────────────────────
    credits_breakdown = calculate_practice_credits(
        base_credits=task_credits,
        score=score,
        is_first_time_type=is_first_time_type,
        total_errors=total_errors
    )
    credits = credits_breakdown["total"]

    # ── Save practice record ───────────────────────────────
    record = {
        "user_id": user_id,
        "task_id": data.task_id,
        "task_type": task_type,
        "task_prompt": task_prompt,
        "submitted_text": data.text,
        "word_count": word_count,
        "mode": data.mode,
        "attempt_number": data.attempt_number,
        "submitted_at": datetime.utcnow(),
        "analysis": analysis,
        "overall_score": score,
        "errors_found": total_errors,
        "credits_earned": credits,
        "fallback_used": analysis.get("fallback_used", False)
    }

    insert_result = await db.practice_records.insert_one(record)
    practice_id = str(insert_result.inserted_id)

    # ── Award credits + update streak ──────────────────────
    new_credit_total = 0
    if credits > 0:
        new_credit_total = await add_credits(
            user_id, credits,
            f"Practice: {task_type} (score {score})"
        )

    await update_streak(user_id)

    # ── Update total words written ─────────────────────────
    await db.users.update_one(
        {"_id": __import__("bson").ObjectId(user_id)},
        {"$inc": {"profile.total_words_written": word_count}}
    )

    # ── Save error patterns ────────────────────────────────
    if analysis.get("errors"):
        try:
            await save_errors(user_id, analysis["errors"], "practice")
        except Exception:
            pass

    # ── Check badges ───────────────────────────────────────
    try:
        newly_earned_badges = await check_practice_badges(user_id, db)
    except Exception:
        newly_earned_badges = []

    # Get current user for streak info
    updated_user = await db.users.find_one(
        {"_id": __import__("bson").ObjectId(user_id)}
    )
    current_streak = updated_user.get("profile", {}).get("current_streak", 0) if updated_user else 0

    # ─── Analytics Tracking ────────────────────────────────
    try:
        from datetime import date
        error_counts = analytics_service.count_errors_by_type(analysis.get("errors", []))
        week_start = (date.today() - __import__('datetime').timedelta(days=date.today().weekday())).isoformat()
        await analytics_service.update_daily_stats_after_activity(
            user_id=user_id,
            activity_type="practice",
            data={
                "score": score,
                "words": word_count,
                "credits": credits,
                "task_type": task_type,
                "total_errors": total_errors,
                "error_counts": error_counts
            },
            db=db
        )
        await analytics_service.aggregate_weekly_stats(user_id, week_start, db)
        today = date.today()
        await analytics_service.aggregate_monthly_stats(user_id, today.month, today.year, db)
    except Exception as _ae:
        print(f"⚠️ Analytics update failed (non-fatal): {_ae}")

    # ── Build response ─────────────────────────────────────
    return {
        "practice_id": practice_id,
        "overall_score": score,
        "category_scores": analysis.get("category_scores", {}),
        "errors": analysis.get("errors", []),
        "total_errors": total_errors,
        "improved_version": analysis.get("improved_version", data.text),
        "strengths": analysis.get("strengths", []),
        "areas_to_improve": analysis.get("areas_to_improve", []),
        "credits_earned": credits,
        "credits_breakdown": credits_breakdown,
        "total_credits": new_credit_total,
        "badges_earned": newly_earned_badges,
        "streak_updated": True,
        "current_streak": current_streak,
        "fallback_used": analysis.get("fallback_used", False),
        "attempt_number": data.attempt_number,
    }


# ─── GET /api/practice/history ───────────────────────────────
@router.get("/history")
async def get_history(user=Depends(get_current_user)):
    """Get user's last 10 practice records for the home page."""
    db = get_db()

    records = await db.practice_records.find(
        {"user_id": user["id"]}
    ).sort("submitted_at", -1).limit(10).to_list(length=10)

    # Load templates for titles
    templates_list = _get_templates()
    templates_map = {t["task_id"]: t for t in templates_list}

    history = []
    for r in records:
        task_info = templates_map.get(r.get("task_id", ""), {})
        history.append({
            "practice_id": str(r["_id"]),
            "task_id": r.get("task_id", ""),
            "task_type": r.get("task_type", ""),
            "task_title": task_info.get("title", r.get("task_type", "Practice")),
            "overall_score": r.get("overall_score", 0),
            "credits_earned": r.get("credits_earned", 0),
            "submitted_at": r.get("submitted_at"),
            "mode": r.get("mode", ""),
            "icon": _type_icon(r.get("task_type", "")),
        })

    # Aggregate stats
    total_count = await db.practice_records.count_documents({"user_id": user["id"]})
    pipeline = [
        {"$match": {"user_id": user["id"]}},
        {"$group": {
            "_id": None,
            "avg_score": {"$avg": "$overall_score"},
            "total_credits": {"$sum": "$credits_earned"},
        }}
    ]
    agg = await db.practice_records.aggregate(pipeline).to_list(length=1)
    avg_score = round(agg[0]["avg_score"], 1) if agg else 0

    return {
        "history": history,
        "stats": {
            "total_done": total_count,
            "avg_score": avg_score,
        }
    }
