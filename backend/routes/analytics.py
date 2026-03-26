"""
routes/analytics.py — Analytics & Dashboard Routes
All data from DB (no extra API calls)
"""

from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from bson import ObjectId

from config import get_db
from middleware.auth_middleware import get_current_user
from services.pattern_service import get_error_summary, get_badges
from models.schemas import UpdateSettingsRequest

router = APIRouter()


# ─── Dashboard Stats ─────────────────────────────────────────
@router.get("/dashboard")
async def get_dashboard(user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]
    profile = user.get("profile", {})
    
    # Current lesson (first incomplete)
    current_lesson = await db.learning_progress.find_one({
        "user_id": user_id,
        "status": "in_progress"
    })
    
    current_lesson_info = None
    if current_lesson:
        current_lesson_info = {
            "level": current_lesson["level_number"],
            "topic": current_lesson.get("topic", ""),
            "status": "in_progress"
        }
    
    # Recent activity (last 5 items)
    recent_learning = await db.learning_progress.find(
        {"user_id": user_id}
    ).sort("started_at", -1).limit(3).to_list(length=3)
    
    recent_practice = await db.practice_records.find(
        {"user_id": user_id}
    ).sort("submitted_at", -1).limit(3).to_list(length=3)
    
    activity = []
    for l in recent_learning:
        activity.append({
            "type": "learning",
            "title": f"Level {l['level_number']}: {l.get('topic', '')}",
            "status": l.get("status", "in_progress"),
            "date": l.get("started_at", datetime.utcnow()).isoformat()
        })
    for p in recent_practice:
        activity.append({
            "type": "practice",
            "title": f"{p.get('task_type', 'Practice')}: Score {p.get('overall_score', 0)}/10",
            "status": "completed",
            "date": p.get("submitted_at", datetime.utcnow()).isoformat()
        })
    
    # Sort by date
    activity.sort(key=lambda x: x["date"], reverse=True)
    
    # This week stats
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    lessons_this_week = await db.learning_progress.count_documents({
        "user_id": user_id,
        "started_at": {"$gte": week_ago}
    })
    
    practice_this_week = await db.practice_records.count_documents({
        "user_id": user_id,
        "submitted_at": {"$gte": week_ago}
    })
    
    return {
        "user_stats": {
            "level": profile.get("current_level", 1),
            "total_credits": profile.get("total_credits", 0),
            "accuracy": await _calculate_accuracy(user_id),
            "current_streak": profile.get("current_streak", 0),
            "rank": profile.get("rank", "Beginner Writer")
        },
        "current_lesson": current_lesson_info,
        "recent_activity": activity[:5],
        "weekly_stats": {
            "lessons": lessons_this_week,
            "practice_tasks": practice_this_week
        }
    }


# ─── Analytics Overview ──────────────────────────────────────
@router.get("/overview")
async def get_analytics(period: str = "weekly", user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]
    profile = user.get("profile", {})
    
    # Date range
    if period == "daily":
        start_date = datetime.utcnow() - timedelta(days=1)
    elif period == "monthly":
        start_date = datetime.utcnow() - timedelta(days=30)
    else:  # weekly
        start_date = datetime.utcnow() - timedelta(days=7)
    
    # Error patterns
    error_summary = await get_error_summary(user_id)
    error_patterns = [
        {"error_type": k, "count": v["count"], "accuracy": 0}
        for k, v in error_summary.items()
    ]
    
    # Accuracy graph (practice scores over time)
    practice_records = await db.practice_records.find(
        {"user_id": user_id}
    ).sort("submitted_at", 1).to_list(length=100)
    
    accuracy_graph = []
    for p in practice_records:
        accuracy_graph.append({
            "date": p.get("submitted_at", datetime.utcnow()).isoformat(),
            "score": p.get("overall_score", 0),
            "type": p.get("task_type", "general")
        })
    
    # Performance metrics
    lessons_done = await db.learning_progress.count_documents(
        {"user_id": user_id, "status": "completed"}
    )
    
    practice_done = await db.practice_records.count_documents(
        {"user_id": user_id}
    )
    
    # Average practice score
    avg_score = 0
    best_score = 0
    if practice_records:
        scores = [p.get("overall_score", 0) for p in practice_records]
        avg_score = round(sum(scores) / len(scores), 1)
        best_score = max(scores)
    
    # Badges
    badges = await get_badges(user_id)
    
    return {
        "stats": {
            "level": profile.get("current_level", 1),
            "total_levels": 30,
            "accuracy": await _calculate_accuracy(user_id),
            "current_streak": profile.get("current_streak", 0),
            "best_streak": profile.get("best_streak", 0),
            "total_credits": profile.get("total_credits", 0),
            "rank": profile.get("rank", "Beginner Writer")
        },
        "accuracy_graph": accuracy_graph,
        "error_patterns": error_patterns,
        "performance": {
            "lessons_completed": lessons_done,
            "quizzes_passed": 0,  # TODO: count from learning_progress
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
    
    # Serialize ObjectIds
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


# ─── Helper ──────────────────────────────────────────────────
async def _calculate_accuracy(user_id: str) -> float:
    """Calculate overall accuracy from quiz scores and practice scores."""
    db = get_db()
    
    scores = []
    
    # From quizzes
    learning = await db.learning_progress.find(
        {"user_id": user_id}
    ).to_list(length=100)
    
    for l in learning:
        for q in l.get("quiz_scores", []):
            if q.get("total", 0) > 0:
                scores.append(q["score"] / q["total"] * 100)
    
    # From practice
    practice = await db.practice_records.find(
        {"user_id": user_id}
    ).to_list(length=100)
    
    for p in practice:
        score = p.get("overall_score", 0)
        scores.append(score * 10)  # Convert 0-10 to 0-100
    
    if not scores:
        return 0.0
    
    return round(sum(scores) / len(scores), 1)
