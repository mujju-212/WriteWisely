"""
services/analytics_service.py — Analytics Aggregation Service
Handles daily/weekly/monthly stats aggregation triggered after user actions.
"""

from datetime import datetime, timedelta, date
from bson import ObjectId
import calendar


async def get_or_create_daily_stats(user_id: str, target_date: str, db) -> dict:
    """Get or create today's daily_stats document."""
    existing = await db.daily_stats.find_one({
        "user_id": user_id, "date": target_date
    })
    if existing:
        return existing

    doc = {
        "user_id": user_id,
        "date": target_date,
        "learning": {
            "lessons_completed": 0, "quizzes_taken": 0,
            "quiz_correct": 0, "quiz_total": 0,
            "assignments_completed": 0, "assignment_score": 0,
            "assignment_total": 0, "time_spent_minutes": 0, "credits_earned": 0
        },
        "practice": {
            "tasks_completed": 0, "task_types": [], "scores": [],
            "average_score": 0, "words_written": 0,
            "time_spent_minutes": 0, "credits_earned": 0
        },
        "errors": {
            "total_made": 0, "total_fixed": 0,
            "by_type": {"spelling": 0, "grammar": 0, "punctuation": 0, "word_confusion": 0}
        },
        "totals": {
            "total_time_minutes": 0, "total_credits": 0,
            "total_words": 0, "accuracy_percentage": 0, "login": True
        },
        "created_at": datetime.utcnow(),
        "last_updated": datetime.utcnow()
    }
    try:
        await db.daily_stats.insert_one(doc)
    except Exception:
        # Race condition — another request already created it
        existing = await db.daily_stats.find_one({"user_id": user_id, "date": target_date})
        if existing:
            return existing
    return doc


async def update_daily_stats_after_activity(
    user_id: str, activity_type: str, data: dict, db
):
    """Called after every user action to update daily_stats."""
    today = date.today().isoformat()

    if activity_type == "lesson":
        await db.daily_stats.update_one(
            {"user_id": user_id, "date": today},
            {
                "$inc": {
                    "learning.lessons_completed": 1,
                    "learning.credits_earned": data.get("credits", 0),
                    "totals.total_credits": data.get("credits", 0)
                },
                "$set": {"last_updated": datetime.utcnow(), "totals.login": True}
            },
            upsert=True
        )

    elif activity_type == "quiz":
        await db.daily_stats.update_one(
            {"user_id": user_id, "date": today},
            {
                "$inc": {
                    "learning.quizzes_taken": 1,
                    "learning.quiz_correct": data.get("score", 0),
                    "learning.quiz_total": data.get("total", 0),
                    "learning.credits_earned": data.get("credits", 0),
                    "totals.total_credits": data.get("credits", 0)
                },
                "$set": {"last_updated": datetime.utcnow(), "totals.login": True}
            },
            upsert=True
        )

    elif activity_type == "assignment":
        error_counts = data.get("error_counts", {})
        await db.daily_stats.update_one(
            {"user_id": user_id, "date": today},
            {
                "$inc": {
                    "learning.assignments_completed": 1,
                    "learning.credits_earned": data.get("credits", 0),
                    "totals.total_credits": data.get("credits", 0),
                    "errors.total_made": data.get("total_errors", 0),
                    "errors.by_type.spelling": error_counts.get("spelling", 0),
                    "errors.by_type.grammar": error_counts.get("grammar", 0),
                    "errors.by_type.punctuation": error_counts.get("punctuation", 0),
                    "errors.by_type.word_confusion": error_counts.get("word_confusion", 0)
                },
                "$set": {"last_updated": datetime.utcnow(), "totals.login": True}
            },
            upsert=True
        )

    elif activity_type == "practice":
        score = data.get("score", 0)
        words = data.get("words", 0)
        credits = data.get("credits", 0)
        error_counts = data.get("error_counts", {})

        await db.daily_stats.update_one(
            {"user_id": user_id, "date": today},
            {
                "$inc": {
                    "practice.tasks_completed": 1,
                    "practice.words_written": words,
                    "practice.credits_earned": credits,
                    "totals.total_credits": credits,
                    "totals.total_words": words,
                    "errors.total_made": data.get("total_errors", 0),
                    "errors.by_type.spelling": error_counts.get("spelling", 0),
                    "errors.by_type.grammar": error_counts.get("grammar", 0),
                    "errors.by_type.punctuation": error_counts.get("punctuation", 0),
                    "errors.by_type.word_confusion": error_counts.get("word_confusion", 0)
                },
                "$push": {
                    "practice.scores": score,
                    "practice.task_types": data.get("task_type", "")
                },
                "$set": {"last_updated": datetime.utcnow(), "totals.login": True}
            },
            upsert=True
        )

        # Recalculate average score
        doc = await db.daily_stats.find_one({"user_id": user_id, "date": today})
        if doc and doc["practice"]["scores"]:
            avg = sum(doc["practice"]["scores"]) / len(doc["practice"]["scores"])
            await db.daily_stats.update_one(
                {"user_id": user_id, "date": today},
                {"$set": {"practice.average_score": round(avg, 2)}}
            )

    await _recalculate_daily_accuracy(user_id, today, db)


async def _recalculate_daily_accuracy(user_id: str, target_date: str, db):
    doc = await db.daily_stats.find_one({"user_id": user_id, "date": target_date})
    if not doc:
        return
    scores = []
    if doc["learning"]["quiz_total"] > 0:
        scores.append(doc["learning"]["quiz_correct"] / doc["learning"]["quiz_total"] * 100)
    for s in doc["practice"]["scores"]:
        scores.append(s * 10)
    if scores:
        await db.daily_stats.update_one(
            {"user_id": user_id, "date": target_date},
            {"$set": {"totals.accuracy_percentage": round(sum(scores) / len(scores), 1)}}
        )


async def aggregate_weekly_stats(user_id: str, week_start_date: str, db):
    """Aggregate 7 daily docs into weekly_stats. Upserts."""
    start = datetime.strptime(week_start_date, "%Y-%m-%d").date()
    dates = [(start + timedelta(days=i)).isoformat() for i in range(7)]
    daily_docs = await db.daily_stats.find(
        {"user_id": user_id, "date": {"$in": dates}}
    ).to_list(7)
    if not daily_docs:
        return None

    def _sum(key_path):
        keys = key_path.split(".")
        total = 0
        for d in daily_docs:
            val = d
            for k in keys:
                val = val.get(k, 0) if isinstance(val, dict) else 0
            total += val
        return total

    all_scores = []
    for d in daily_docs:
        all_scores.extend(d["practice"]["scores"])

    error_by_type = {
        t: _sum(f"errors.by_type.{t}")
        for t in ["spelling", "grammar", "punctuation", "word_confusion"]
    }
    most_common = max(error_by_type, key=error_by_type.get) if any(error_by_type.values()) else "none"
    total_quiz_total = _sum("learning.quiz_total")
    all_accuracy = [d["totals"]["accuracy_percentage"] for d in daily_docs if d["totals"]["accuracy_percentage"] > 0]
    end_date = (start + timedelta(days=6)).isoformat()

    week_doc = {
        "user_id": user_id,
        "week_start": week_start_date,
        "week_end": end_date,
        "week_number": start.isocalendar()[1],
        "year": start.year,
        "learning": {
            "lessons_completed": _sum("learning.lessons_completed"),
            "quizzes_taken": _sum("learning.quizzes_taken"),
            "quiz_accuracy": round(_sum("learning.quiz_correct") / total_quiz_total * 100, 1) if total_quiz_total > 0 else 0,
            "assignments_completed": _sum("learning.assignments_completed"),
            "avg_assignment_score": 0,
            "time_spent_minutes": _sum("learning.time_spent_minutes")
        },
        "practice": {
            "tasks_completed": _sum("practice.tasks_completed"),
            "avg_score": round(sum(all_scores) / len(all_scores), 2) if all_scores else 0,
            "best_score": max(all_scores) if all_scores else 0,
            "worst_score": min(all_scores) if all_scores else 0,
            "words_written": _sum("practice.words_written"),
            "time_spent_minutes": _sum("practice.time_spent_minutes"),
            "improvement_from_last_week": 0
        },
        "errors": {
            "total_made": _sum("errors.total_made"),
            "total_fixed": _sum("errors.total_fixed"),
            "fix_rate": 0,
            "most_common": most_common,
            "by_type": error_by_type,
            "improvement_from_last_week": {}
        },
        "totals": {
            "active_days": len([d for d in daily_docs if d["totals"].get("login")]),
            "total_time_minutes": _sum("totals.total_time_minutes"),
            "total_credits": _sum("totals.total_credits"),
            "total_words": _sum("totals.total_words"),
            "avg_daily_accuracy": round(sum(all_accuracy) / len(all_accuracy), 1) if all_accuracy else 0
        },
        "generated_at": datetime.utcnow()
    }

    total_made = week_doc["errors"]["total_made"]
    total_fixed = week_doc["errors"]["total_fixed"]
    if total_made > 0:
        week_doc["errors"]["fix_rate"] = round(total_fixed / total_made * 100, 1)

    # Compare with previous week
    prev_start = (start - timedelta(days=7)).isoformat()
    prev_week = await db.weekly_stats.find_one({"user_id": user_id, "week_start": prev_start})
    if prev_week:
        week_doc["practice"]["improvement_from_last_week"] = round(
            week_doc["practice"]["avg_score"] - prev_week["practice"]["avg_score"], 2
        )
        for etype in error_by_type:
            prev_count = prev_week["errors"]["by_type"].get(etype, 0)
            week_doc["errors"]["improvement_from_last_week"][etype] = error_by_type[etype] - prev_count

    await db.weekly_stats.update_one(
        {"user_id": user_id, "week_start": week_start_date},
        {"$set": week_doc},
        upsert=True
    )
    return week_doc


async def aggregate_monthly_stats(user_id: str, month: int, year: int, db):
    """Aggregate weekly docs into monthly_stats. Upserts."""
    weekly_docs = await db.weekly_stats.find(
        {"user_id": user_id, "year": year}
    ).to_list(6)

    weekly_docs = [
        w for w in weekly_docs
        if (datetime.strptime(w["week_start"], "%Y-%m-%d").month == month
            or datetime.strptime(w["week_end"], "%Y-%m-%d").month == month)
    ]
    if not weekly_docs:
        return None

    all_scores = [w["practice"]["avg_score"] for w in weekly_docs if w["practice"]["avg_score"] > 0]
    error_trend = {f"week{i+1}": w["errors"]["total_made"] for i, w in enumerate(weekly_docs)}
    by_type_trend = {"spelling": [], "grammar": [], "punctuation": [], "word_confusion": []}
    for w in weekly_docs:
        for etype in by_type_trend:
            by_type_trend[etype].append(w["errors"]["by_type"].get(etype, 0))

    type_totals = {t: sum(by_type_trend[t]) for t in by_type_trend}
    needs_work = max(type_totals, key=type_totals.get) if any(type_totals.values()) else "spelling"

    # Badges this month
    month_start = datetime(year, month, 1)
    month_end = datetime(year, month, calendar.monthrange(year, month)[1], 23, 59, 59)
    badges_this_month = await db.badges.find({
        "user_id": user_id,
        "earned_at": {"$gte": month_start, "$lte": month_end}
    }).to_list(20)

    all_accuracies = [w["totals"]["avg_daily_accuracy"] for w in weekly_docs if w["totals"]["avg_daily_accuracy"] > 0]
    all_quiz_acc = [w["learning"]["quiz_accuracy"] for w in weekly_docs if w["learning"]["quiz_accuracy"] > 0]

    month_doc = {
        "user_id": user_id,
        "month": month,
        "year": year,
        "learning": {
            "lessons_completed": sum(w["learning"]["lessons_completed"] for w in weekly_docs),
            "levels_gained": 0,
            "quiz_accuracy": round(sum(all_quiz_acc) / len(all_quiz_acc), 1) if all_quiz_acc else 0,
            "assignments_completed": sum(w["learning"]["assignments_completed"] for w in weekly_docs),
            "avg_assignment_score": 0
        },
        "practice": {
            "tasks_completed": sum(w["practice"]["tasks_completed"] for w in weekly_docs),
            "avg_score": round(sum(all_scores) / len(all_scores), 2) if all_scores else 0,
            "score_trend": all_scores,
            "best_score": max((w["practice"]["best_score"] for w in weekly_docs), default=0),
            "words_written": sum(w["practice"]["words_written"] for w in weekly_docs),
            "favorite_task_type": "general"
        },
        "errors": {
            "total_made": sum(w["errors"]["total_made"] for w in weekly_docs),
            "total_fixed": sum(w["errors"]["total_fixed"] for w in weekly_docs),
            "fix_rate": 0,
            "trend": error_trend,
            "most_improved": "spelling",
            "needs_work": needs_work,
            "by_type_trend": by_type_trend
        },
        "totals": {
            "active_days": sum(w["totals"]["active_days"] for w in weekly_docs),
            "total_time_minutes": sum(w["totals"]["total_time_minutes"] for w in weekly_docs),
            "total_credits": sum(w["totals"]["total_credits"] for w in weekly_docs),
            "total_words": sum(w["totals"]["total_words"] for w in weekly_docs),
            "avg_accuracy": round(sum(all_accuracies) / len(all_accuracies), 1) if all_accuracies else 0
        },
        "achievements": {
            "badges_earned": len(badges_this_month),
            "badge_names": [b.get("badge_name", "") for b in badges_this_month],
            "credits_milestone": 0
        },
        "generated_at": datetime.utcnow()
    }

    total_made = month_doc["errors"]["total_made"]
    total_fixed = month_doc["errors"]["total_fixed"]
    if total_made > 0:
        month_doc["errors"]["fix_rate"] = round(total_fixed / total_made * 100, 1)

    await db.monthly_stats.update_one(
        {"user_id": user_id, "month": month, "year": year},
        {"$set": month_doc},
        upsert=True
    )
    return month_doc


def count_errors_by_type(errors: list) -> dict:
    """Helper: count errors by type from a list of error objects."""
    counts = {"spelling": 0, "grammar": 0, "punctuation": 0, "word_confusion": 0}
    for e in errors:
        etype = e.get("type", "grammar").lower()
        if etype == "spelling":
            counts["spelling"] += 1
        elif etype in ("grammar", "sentence"):
            counts["grammar"] += 1
        elif etype == "punctuation":
            counts["punctuation"] += 1
        else:
            counts["word_confusion"] += 1
    return counts
