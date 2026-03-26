"""
routes/analytics.py — Analytics & Dashboard Routes
Expanded /dashboard endpoint returns ALL 8 sections in one call.
"""

from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from bson import ObjectId
from collections import defaultdict

from config import get_db
from middleware.auth_middleware import get_current_user
from services.pattern_service import get_error_summary, get_badges
from models.schemas import UpdateSettingsRequest

router = APIRouter()


# ─── Helper ──────────────────────────────────────────────────
async def _calculate_accuracy(user_id: str) -> float:
    db = get_db()
    scores = []

    learning = await db.learning_progress.find(
        {"user_id": user_id}
    ).to_list(length=200)

    for l in learning:
        for q in l.get("quiz_scores", []):
            if q.get("total", 0) > 0:
                scores.append(q["score"] / q["total"] * 100)

    practice = await db.practice_records.find(
        {"user_id": user_id}
    ).to_list(length=200)

    for p in practice:
        score = p.get("overall_score", 0)
        scores.append(score * 10)

    if not scores:
        return 0.0
    return round(sum(scores) / len(scores), 1)


def _time_label(dt: datetime) -> str:
    """Format datetime as readable time string."""
    if not dt:
        return ""
    return dt.strftime("%I:%M %p").lstrip("0")


def _day_label(dt: datetime) -> str:
    return dt.strftime("%a") if dt else ""


# ─── FULL DASHBOARD (one call, 8 sections) ───────────────────
@router.get("/dashboard")
async def get_dashboard(user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]
    profile = user.get("profile", {})
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    # ── 1. Greeting ─────────────────────────────────────────
    greeting = {
        "name": user.get("name", "Student"),
        "streak": profile.get("current_streak", 0),
        "best_streak": profile.get("best_streak", 0),
    }

    # ── 2. Stat Cards ────────────────────────────────────────
    accuracy = await _calculate_accuracy(user_id)

    # Words written (sum word_count from practice_records + projects)
    practice_words_agg = await db.practice_records.aggregate([
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": None, "total": {"$sum": "$word_count"}}}
    ]).to_list(length=1)
    practice_words = practice_words_agg[0]["total"] if practice_words_agg else 0

    project_words_agg = await db.projects.aggregate([
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": None, "total": {"$sum": "$word_count"}}}
    ]).to_list(length=1)
    project_words = project_words_agg[0]["total"] if project_words_agg else 0
    total_words = practice_words + project_words

    # Time today (minutes) — approximate from learning + practice today
    lessons_today = await db.learning_progress.count_documents({
        "user_id": user_id,
        "started_at": {"$gte": today_start}
    })
    practice_today_docs = await db.practice_records.find({
        "user_id": user_id,
        "submitted_at": {"$gte": today_start}
    }).to_list(length=50)

    minutes_learning = lessons_today * 8   # ~8 min per lesson
    minutes_practice = len(practice_today_docs) * 10  # ~10 min per practice
    minutes_project = 0  # not tracked yet
    minutes_total = minutes_learning + minutes_practice + minutes_project

    # Credits earned this week
    practice_week = await db.practice_records.find({
        "user_id": user_id,
        "submitted_at": {"$gte": week_ago}
    }).to_list(length=100)
    credits_this_week = sum(p.get("credits_earned", 0) for p in practice_week)

    stats = {
        "level": {
            "current": profile.get("current_level", 1),
            "total": 30,
            "change": "+1 this week" if credits_this_week > 0 else "No change"
        },
        "credits": {
            "total": profile.get("total_credits", 0),
            "rank": profile.get("rank", "Beginner Writer"),
            "change": f"+{credits_this_week} this week"
        },
        "accuracy": {
            "percentage": accuracy,
        },
        "streak": {
            "current": profile.get("current_streak", 0),
            "best": profile.get("best_streak", 0),
        },
        "words": {
            "total": total_words,
        },
        "time_today": {
            "total": minutes_total,
            "learning": minutes_learning,
            "practice": minutes_practice,
            "project": minutes_project,
        }
    }

    # ── 3. Continue Learning ─────────────────────────────────
    in_progress = await db.learning_progress.find_one({
        "user_id": user_id,
        "status": "in_progress"
    }, sort=[("started_at", -1)])

    continue_learning = None
    if in_progress:
        lesson_doc = await db.lessons.find_one({"level_id": in_progress.get("level_number")})
        # Calculate progress within lesson
        total_sections = len(in_progress.get("read_sections", [])) + 3  # approx
        read = len([s for s in in_progress.get("read_sections", []) if s])
        progress_pct = min(int((read / max(total_sections, 1)) * 100), 95)

        continue_learning = {
            "level": in_progress.get("level_number", 1),
            "topic": in_progress.get("topic", lesson_doc.get("title", "Current Lesson") if lesson_doc else "Current Lesson"),
            "next_up": "Quiz on " + in_progress.get("topic", "this topic"),
            "progress": progress_pct
        }

    # ── 4. Today's Activity Feed ───────────────────────────
    activity = []

    # Lessons today
    learning_today = await db.learning_progress.find({
        "user_id": user_id,
        "started_at": {"$gte": today_start}
    }).sort("started_at", -1).limit(3).to_list(length=3)

    for l in learning_today:
        status = l.get("status", "in_progress")
        activity.append({
            "text": f"{'Completed' if status == 'completed' else 'Started'} Level {l.get('level_number', '?')}: {l.get('topic', 'Lesson')}",
            "time": _time_label(l.get("started_at")),
            "type": "success" if status == "completed" else "practice",
            "sort_key": l.get("started_at", now)
        })

    # Practice today
    for p in practice_today_docs[:3]:
        score = p.get("overall_score", 0)
        activity.append({
            "text": f"{p.get('task_type', 'Practice').title()} Practice · Score {score}/10",
            "time": _time_label(p.get("submitted_at")),
            "type": "practice",
            "sort_key": p.get("submitted_at", now)
        })

    # Badges today
    badges_today = await db.badges.find({
        "user_id": user_id,
        "earned_at": {"$gte": today_start}
    }).to_list(length=3)
    for b in badges_today:
        activity.append({
            "text": f"Badge Unlocked: {b.get('badge_name', 'Badge')}!",
            "time": _time_label(b.get("earned_at")),
            "type": "badge",
            "sort_key": b.get("earned_at", now)
        })

    activity.sort(key=lambda x: x.get("sort_key", now), reverse=True)
    # Remove sort_key before sending
    for a in activity:
        a.pop("sort_key", None)

    if not activity:
        activity = [{"text": "No activity yet today — start learning!", "time": "", "type": "info"}]

    # ── 5. This Week Stats ────────────────────────────────
    lessons_week = await db.learning_progress.count_documents({
        "user_id": user_id, "started_at": {"$gte": week_ago}
    })
    lessons_completed_week = await db.learning_progress.count_documents({
        "user_id": user_id, "status": "completed", "completed_at": {"$gte": week_ago}
    })

    # Quizzes passed (from learning_progress quiz_scores this week)
    learning_week_docs = await db.learning_progress.find({
        "user_id": user_id,
        "started_at": {"$gte": week_ago}
    }).to_list(length=50)
    quizzes_passed = sum(
        1 for l in learning_week_docs
        for q in l.get("quiz_scores", [])
        if q.get("score", 0) / max(q.get("total", 1), 1) >= 0.7
    )

    practice_count_week = len(practice_week)
    words_week = sum(p.get("word_count", 0) for p in practice_week)

    # Errors fixed (frequency sum from error_patterns updated this week)
    errors_week_agg = await db.error_patterns.aggregate([
        {"$match": {"user_id": user_id, "last_occurred": {"$gte": week_ago}}},
        {"$group": {"_id": None, "total": {"$sum": "$frequency"}}}
    ]).to_list(length=1)
    errors_fixed = errors_week_agg[0]["total"] if errors_week_agg else 0

    this_week = {
        "lessons": lessons_week,
        "quizzes": quizzes_passed,
        "practice": practice_count_week,
        "errors_fixed": errors_fixed,
        "words": words_week,
        "credits": credits_this_week,
    }

    # ── 6. Weak Areas ─────────────────────────────────────
    top_errors = await db.error_patterns.find(
        {"user_id": user_id}
    ).sort("frequency", -1).limit(3).to_list(length=3)

    SUGGESTIONS = {
        "spelling":     "Try the Spelling practice tasks",
        "grammar":      "Review grammar lessons in Learning Hub",
        "punctuation":  "Check punctuation exercises",
        "homophone":    "Try the Homophones practice task",
        "word_choice":  "Review vocabulary in Learning Hub",
    }
    EXAMPLES = {
        "spelling":    "recieve → receive",
        "grammar":     "subject-verb agreement",
        "punctuation": "comma usage",
        "homophone":   "their / there / they're",
        "word_choice": "affect / effect",
    }

    weak_areas = []
    for e in top_errors:
        err_type = e.get("error_type", "spelling")
        freq = e.get("frequency", 1)
        weak_areas.append({
            "type": err_type.replace("_", " ").title(),
            "count": freq,
            "severity": "high" if freq >= 5 else "medium",
            "example": EXAMPLES.get(err_type, e.get("original_word", "")),
            "suggestion": SUGGESTIONS.get(err_type, "Keep practicing!")
        })

    # ── 7. Accuracy Chart (last 7 days) ────────────────────
    # Group practice scores by day
    all_practice = await db.practice_records.find({
        "user_id": user_id,
        "submitted_at": {"$gte": week_ago}
    }).sort("submitted_at", 1).to_list(length=200)

    day_scores = defaultdict(list)
    for p in all_practice:
        submitted = p.get("submitted_at")
        if submitted:
            day_key = submitted.strftime("%a")
            day_scores[day_key].append(p.get("overall_score", 0) * 10)

    # Build chart for last 7 days in order
    chart = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        label = day.strftime("%a")
        scores_on_day = day_scores.get(label, [])
        avg = round(sum(scores_on_day) / len(scores_on_day)) if scores_on_day else 0
        chart.append({"day": label, "accuracy": avg})

    # ── 8. Badges ─────────────────────────────────────────
    all_badges = await get_badges(user_id)
    earned = [b for b in all_badges if b["earned"]]
    unearned = [b for b in all_badges if not b["earned"]]

    # Next badge progress (use streak-based for "on_fire" or first unearned)
    next_badge = None
    streak_now = profile.get("current_streak", 0)
    for b in unearned:
        if b["badge_id"] == "on_fire":
            next_badge = {
                "name": b["badge_name"],
                "description": b["description"],
                "current": streak_now,
                "required": 7,
                "percentage": min(int(streak_now / 7 * 100), 99)
            }
            break
    if not next_badge and unearned:
        b = unearned[0]
        next_badge = {"name": b["badge_name"], "description": b["description"],
                      "current": 0, "required": 1, "percentage": 0}

    badges_section = {
        "recent": [
            {"name": b["badge_name"], "earned": b.get("earned_at", ""), "badge_id": b["badge_id"]}
            for b in sorted(earned, key=lambda x: x.get("earned_at") or datetime.min, reverse=True)[:3]
        ],
        "next": next_badge
    }

    return {
        "greeting": greeting,
        "stats": stats,
        "continue_learning": continue_learning,
        "todays_activity": activity[:8],
        "this_week": this_week,
        "weak_areas": weak_areas,
        "accuracy_chart": chart,
        "badges": badges_section,
    }


# ─── Analytics Overview ──────────────────────────────────────
@router.get("/overview")
async def get_analytics(period: str = "weekly", user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]
    profile = user.get("profile", {})

    if period == "daily":
        start_date = datetime.utcnow() - timedelta(days=1)
    elif period == "monthly":
        start_date = datetime.utcnow() - timedelta(days=30)
    else:
        start_date = datetime.utcnow() - timedelta(days=7)

    error_summary = await get_error_summary(user_id)
    error_patterns = [
        {"error_type": k, "count": v["count"], "accuracy": 0}
        for k, v in error_summary.items()
    ]

    practice_records = await db.practice_records.find(
        {"user_id": user_id}
    ).sort("submitted_at", 1).to_list(length=200)

    accuracy_graph = []
    for p in practice_records:
        accuracy_graph.append({
            "date": p.get("submitted_at", datetime.utcnow()).isoformat(),
            "score": p.get("overall_score", 0),
            "type": p.get("task_type", "general")
        })

    lessons_done = await db.learning_progress.count_documents(
        {"user_id": user_id, "status": "completed"}
    )
    practice_done = await db.practice_records.count_documents({"user_id": user_id})

    avg_score = 0
    best_score = 0
    if practice_records:
        scores = [p.get("overall_score", 0) for p in practice_records]
        avg_score = round(sum(scores) / len(scores), 1)
        best_score = max(scores)

    badges = await get_badges(user_id)
    accuracy = await _calculate_accuracy(user_id)

    return {
        "stats": {
            "level": profile.get("current_level", 1),
            "total_levels": 30,
            "accuracy": accuracy,
            "current_streak": profile.get("current_streak", 0),
            "best_streak": profile.get("best_streak", 0),
            "total_credits": profile.get("total_credits", 0),
            "rank": profile.get("rank", "Beginner Writer")
        },
        "accuracy_graph": accuracy_graph,
        "error_patterns": error_patterns,
        "performance": {
            "lessons_completed": lessons_done,
            "quizzes_passed": 0,
            "assignments_done": lessons_done,
            "practice_tasks_done": practice_done,
            "avg_practice_score": avg_score,
            "best_practice_score": best_score
        },
        "badges": badges
    }


# ─── Settings Update ─────────────────────────────────────────
@router.put("/settings")
async def update_settings(data: UpdateSettingsRequest, user=Depends(get_current_user)):
    db = get_db()

    update_fields = {}
    if data.theme is not None:
        update_fields["settings.theme"] = data.theme
    if data.font_size is not None:
        update_fields["settings.font_size"] = data.font_size
    if data.notifications_enabled is not None:
        update_fields["settings.notifications_enabled"] = data.notifications_enabled
    if data.email_notifications is not None:
        update_fields["settings.email_notifications"] = data.email_notifications
    if data.reminder_time is not None:
        update_fields["settings.reminder_time"] = data.reminder_time

    if update_fields:
        await db.users.update_one(
            {"_id": ObjectId(user["id"])},
            {"$set": update_fields}
        )

    return {"message": "Settings updated!"}


# ─── Export Data ──────────────────────────────────────────────
@router.get("/export")
async def export_data(user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]

    learning = await db.learning_progress.find({"user_id": user_id}).to_list(length=100)
    practice = await db.practice_records.find({"user_id": user_id}).to_list(length=100)
    errors = await db.error_patterns.find({"user_id": user_id}).to_list(length=200)
    badges = await db.badges.find({"user_id": user_id}).to_list(length=50)

    def serialize(docs):
        for doc in docs:
            doc["_id"] = str(doc["_id"])
            for k, v in doc.items():
                if isinstance(v, datetime):
                    doc[k] = v.isoformat()
        return docs

    return {
        "user": user,
        "learning_progress": serialize(learning),
        "practice_records": serialize(practice),
        "error_patterns": serialize(errors),
        "badges": serialize(badges),
        "exported_at": datetime.utcnow().isoformat()
    }
