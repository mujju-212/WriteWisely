"""
routes/practice.py — Practice Mode Routes
Templates, Submissions, Analysis
"""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import json

from config import get_db
from middleware.auth_middleware import get_current_user
from services.checker_service import check_text
from services.pattern_service import add_credits, save_errors, get_badges, update_streak, CREDIT_VALUES
from models.schemas import SubmitPracticeRequest

router = APIRouter()


def _level_name(level_num: int) -> str:
    if level_num <= 10:
        return "beginner"
    elif level_num <= 20:
        return "intermediate"
    return "advanced"


def _calc_credits(base_credits: int, score: float, attempt: int) -> int:
    """
    Calculate credits earned based on score and attempt number.
    Attempt 1 → full scale.  Attempt 2 → 50%.  Attempt 3+ → 0.
    Score brackets (applied to adjusted base):
      1–4  → 0%
      5–6  → 50%
      7–8  → full
      9–10 → full + bonus (20 extra)
    """
    if attempt >= 3:
        return 0

    # Score-based fraction
    if score < 5:
        fraction = 0.0
    elif score < 7:
        fraction = 0.5
    else:
        fraction = 1.0

    credits = int(base_credits * fraction)

    # Attempt penalty
    if attempt == 2:
        credits = credits // 2

    # Bonus for near-perfect
    if score >= 9 and attempt == 1:
        credits += CREDIT_VALUES.get("practice_bonus_9_10", 20)

    return credits


# ─── Get Practice Templates ──────────────────────────────────
@router.get("/templates")
async def get_templates(user=Depends(get_current_user)):
    user_level = user.get("profile", {}).get("current_level", 1)
    level_cat = _level_name(user_level)

    try:
        with open("data/practice_templates.json", "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        return {"templates": []}

    templates = data.get("templates", [])
    # Return all templates (frontend filters visually by level)
    return {"templates": templates, "user_level": level_cat}


# ─── Submit Practice ─────────────────────────────────────────
@router.post("/submit")
async def submit_practice(data: SubmitPracticeRequest, user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]
    user_level = user.get("profile", {}).get("current_level", 1)
    level_name = _level_name(user_level)

    # ── Load task template ──────────────────────────────────
    try:
        with open("data/practice_templates.json", "r") as f:
            templates_data = json.load(f)
        templates = {t["task_id"]: t for t in templates_data.get("templates", [])}
        task = templates.get(data.task_id, {})
    except Exception:
        task = {}

    task_prompt = task.get("prompt", "Free writing practice")
    task_type = task.get("type", "general")
    task_credits = task.get("credits", 30)      # base credits from template
    context_type = task.get("context", task_type)

    # ── Minimum word check ─────────────────────────────────
    word_count = len(data.text.split())
    min_words = task.get("min_words", 20)
    if word_count < min_words:
        raise HTTPException(
            status_code=400,
            detail=f"Please write at least {min_words} words (you wrote {word_count})."
        )

    # ── Run 2-tier analysis ────────────────────────────────
    # check_text uses Tier1 (edit distance) + Tier2 (AI) + merge
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
        # Hard fallback — basic structure
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

    # ── check_text / practice_analysis needs task_prompt injected ──
    # If analysis came back without improved_version (AI structured response),
    # that's fine — it's already been merged by checker_service.
    score = float(analysis.get("overall_score", 5.0))

    # ── Calculate credits with retry penalty ───────────────
    credits = _calc_credits(task_credits, score, data.attempt_number)

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
        "errors_found": len(analysis.get("errors", [])),
        "credits_earned": credits,
        "fallback_used": analysis.get("fallback_used", False)
    }

    await db.practice_records.insert_one(record)

    # ── Award credits + update streak ─────────────────────
    new_credit_total = 0
    if credits > 0:
        new_credit_total = await add_credits(user_id, credits, f"Practice: {task_type} (attempt {data.attempt_number})")

    await update_streak(user_id)

    # ── Fetch updated badges ───────────────────────────────
    try:
        badges = await get_badges(user_id)
        newly_earned = [b for b in badges if b["earned"]]
    except Exception:
        badges = []
        newly_earned = []

    # ── Build response ────────────────────────────────────
    analysis["credits_earned"] = credits
    analysis["new_credit_total"] = new_credit_total
    analysis["attempt_number"] = data.attempt_number
    analysis["badges_earned"] = newly_earned

    return analysis
