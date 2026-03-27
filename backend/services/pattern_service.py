"""
services/pattern_service.py — Error Pattern Tracking + Credits + Badges
The "intelligence" that powers Analytics and AI Chat personalization
"""

from datetime import datetime, timedelta
from bson import ObjectId
from config import get_db


# ─── Credit Values ────────────────────────────────────────────
CREDIT_VALUES = {
    "lesson_complete": 10,    # alias used by learning.py
    "complete_lesson": 10,
    "quiz_pass": 15,          # >70%
    "quiz_perfect": 25,       # 100%
    "submit_assignment": 15,
    "perfect_assignment": 30,
    "practice_easy": 20,
    "practice_medium": 35,
    "practice_hard": 50,
    "practice_bonus_9_10": 20,
    "daily_login": 5,
    "streak_7_day": 50,
    "streak_30_day": 200,
    "doc_500_words": 30,
    "fix_all_errors": 15,
}

# ─── Rank Thresholds ─────────────────────────────────────────
RANKS = [
    (0, "Beginner Writer"),
    (100, "Grammar Learner"),
    (300, "Grammar Enthusiast"),
    (500, "Skilled Writer"),
    (1000, "Grammar Expert"),
    (2000, "Language Master"),
]

# ─── Badge Definitions ────────────────────────────────────────
BADGES = {
    "first_steps":    {"name": "🏅 First Steps",      "description": "Complete first lesson",           "condition": "lessons >= 1"},
    "bookworm":       {"name": "📖 Bookworm",         "description": "Complete 10 lessons",             "condition": "lessons >= 10"},
    "writer":         {"name": "✍️ Writer",            "description": "Complete 10 practice tasks",      "condition": "practice >= 10"},
    "on_fire":        {"name": "🔥 On Fire",           "description": "7-day streak",                   "condition": "streak >= 7"},
    "sharpshooter":   {"name": "🎯 Sharpshooter",     "description": "5 perfect quiz scores",          "condition": "perfect_quizzes >= 5"},
    "scholar":        {"name": "📚 Scholar",           "description": "Reach Level 15",                 "condition": "level >= 15"},
    "perfectionist":  {"name": "✨ Perfectionist",     "description": "3 practice scores of 10/10",    "condition": "perfect_practice >= 3"},
    "champion":       {"name": "🏆 Champion",          "description": "Reach Level 25",                 "condition": "level >= 25"},
    "master":         {"name": "🎓 Master",            "description": "Complete all 30 levels",         "condition": "level >= 30"},
    "legend":         {"name": "👑 Legend",             "description": "All badges + 90% accuracy",     "condition": "all_badges_and_accuracy"},
}


# ─── Error Pattern Functions ──────────────────────────────────

async def save_errors(user_id: str, errors: list, source: str):
    """
    Save or update error patterns for a user.
    If error already exists → increment frequency.
    If new → insert with frequency=1.
    """
    db = get_db()
    
    for error in errors:
        error_type = error.get("type", "unknown")
        original = error.get("original", error.get("word", ""))
        correction = error.get("correction", "")
        subtype = error.get("subtype", "")
        
        if not original:
            continue
        
        # Upsert: increment frequency if exists, insert if new
        await db.error_patterns.update_one(
            {
                "user_id": user_id,
                "original_word": original.lower(),
                "error_type": error_type
            },
            {
                "$inc": {"frequency": 1},
                "$set": {
                    "correct_word": correction,
                    "error_subtype": subtype,
                    "last_occurred": datetime.utcnow(),
                    "source": source,
                    "resolved": False
                },
                "$setOnInsert": {
                    "user_id": user_id,
                    "original_word": original.lower(),
                    "error_type": error_type,
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )


async def get_error_summary(user_id: str) -> dict:
    """Get error pattern summary for a user (for analytics)."""
    db = get_db()
    
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": "$error_type",
            "count": {"$sum": "$frequency"},
            "unique_errors": {"$sum": 1}
        }},
        {"$sort": {"count": -1}}
    ]
    
    results = await db.error_patterns.aggregate(pipeline).to_list(length=20)
    
    summary = {}
    for r in results:
        summary[r["_id"]] = {
            "count": r["count"],
            "unique_errors": r["unique_errors"]
        }
    
    return summary


async def get_top_errors(user_id: str, limit: int = 5) -> list:
    """Get top N most frequent errors for a user (for AI chat context)."""
    db = get_db()
    
    errors = await db.error_patterns.find(
        {"user_id": user_id}
    ).sort("frequency", -1).limit(limit).to_list(length=limit)
    
    return [
        {
            "error_type": e["error_type"],
            "word": e["original_word"],
            "correct": e.get("correct_word", ""),
            "frequency": e["frequency"]
        }
        for e in errors
    ]


# ─── Credit Functions ─────────────────────────────────────────

async def add_credits(user_id: str, amount: int, reason: str) -> int:
    """Add credits to a user and update rank. Returns new total."""
    db = get_db()
    
    result = await db.users.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$inc": {"profile.total_credits": amount}},
        return_document=True
    )
    
    new_total = result["profile"]["total_credits"]
    
    # Update rank
    new_rank = "Beginner Writer"
    for threshold, rank_name in RANKS:
        if new_total >= threshold:
            new_rank = rank_name
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"profile.rank": new_rank}}
    )
    
    # Check for new badges
    await _check_badges(user_id)
    
    return new_total


# ─── Streak Functions ─────────────────────────────────────────

async def update_streak(user_id: str):
    """Update user's daily streak."""
    db = get_db()
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return
    
    last_active = user.get("profile", {}).get("last_active")
    now = datetime.utcnow()
    today = now.date()
    
    current_streak = user.get("profile", {}).get("current_streak", 0)
    best_streak = user.get("profile", {}).get("best_streak", 0)
    
    if last_active:
        last_date = last_active.date()
        diff = (today - last_date).days
        
        if diff == 0:
            # Already active today, no change
            return
        elif diff == 1:
            # Consecutive day — increment streak
            current_streak += 1
        else:
            # Streak broken — reset to 1
            current_streak = 1
    else:
        current_streak = 1
    
    # Update best streak
    if current_streak > best_streak:
        best_streak = current_streak
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "profile.current_streak": current_streak,
            "profile.best_streak": best_streak,
            "profile.last_active": now
        }}
    )
    
    # Award streak bonuses
    if current_streak == 7:
        await add_credits(user_id, CREDIT_VALUES["streak_7_day"], "7-day streak bonus")
    elif current_streak == 30:
        await add_credits(user_id, CREDIT_VALUES["streak_30_day"], "30-day streak bonus")


# ─── Badge Functions ──────────────────────────────────────────

async def _check_badges(user_id: str):
    """Check and award any newly earned badges."""
    db = get_db()
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return
    
    profile = user.get("profile", {})
    
    # Get existing badges
    existing = await db.badges.find(
        {"user_id": user_id}
    ).to_list(length=50)
    earned_ids = {b["badge_id"] for b in existing}
    
    # Get counts
    lessons_done = await db.learning_progress.count_documents(
        {"user_id": user_id, "status": "completed"}
    )
    practice_done = await db.practice_records.count_documents(
        {"user_id": user_id}
    )
    
    level = profile.get("current_level", 1)
    streak = profile.get("current_streak", 0)
    
    # Check each badge
    checks = {
        "first_steps": lessons_done >= 1,
        "bookworm": lessons_done >= 10,
        "writer": practice_done >= 10,
        "on_fire": streak >= 7,
        "scholar": level >= 15,
        "champion": level >= 25,
        "master": level >= 30,
    }
    
    for badge_id, condition_met in checks.items():
        if condition_met and badge_id not in earned_ids:
            badge_def = BADGES[badge_id]
            await db.badges.insert_one({
                "user_id": user_id,
                "badge_id": badge_id,
                "badge_name": badge_def["name"],
                "description": badge_def["description"],
                "earned_at": datetime.utcnow(),
                "credits_at_earn": profile.get("total_credits", 0)
            })


async def get_badges(user_id: str) -> list:
    """Get all badges (earned and unearned) for a user."""
    db = get_db()
    
    earned = await db.badges.find(
        {"user_id": user_id}
    ).to_list(length=50)
    earned_map = {b["badge_id"]: b for b in earned}
    
    all_badges = []
    for badge_id, badge_def in BADGES.items():
        earned_badge = earned_map.get(badge_id)
        all_badges.append({
            "badge_id": badge_id,
            "badge_name": badge_def["name"],
            "description": badge_def["description"],
            "earned": earned_badge is not None,
            "earned_at": earned_badge["earned_at"] if earned_badge else None
        })
    
    return all_badges


# ─── Practice Credit Calculation ──────────────────────────────

def calculate_practice_credits(
    base_credits: int,
    score: float,
    is_first_time_type: bool,
    total_errors: int
) -> dict:
    """
    Calculate credits earned for a practice submission.
    Score brackets:
      1-3   → 30% of base
      4-5   → 50% of base
      6-7   → 70% of base
      8-8.9 → 90% of base
      9+    → 100% of base + bonuses
    """
    if score <= 3:
        multiplier = 0.30
    elif score <= 5:
        multiplier = 0.50
    elif score <= 7:
        multiplier = 0.70
    elif score < 9:
        multiplier = 0.90
    else:
        multiplier = 1.0

    base_earned = round(base_credits * multiplier)

    first_time_bonus = 10 if is_first_time_type else 0
    high_score_bonus = 20 if score >= 9 else 0
    perfect_bonus = 20 if score == 10 else 0
    zero_error_bonus = 15 if total_errors == 0 else 0

    total = base_earned + first_time_bonus + high_score_bonus + perfect_bonus + zero_error_bonus

    return {
        "base": base_earned,
        "first_time_bonus": first_time_bonus,
        "high_score_bonus": high_score_bonus,
        "perfect_bonus": perfect_bonus,
        "zero_error_bonus": zero_error_bonus,
        "total": total
    }


async def _award_badge(user_id: str, badge_id: str, db) -> dict:
    """Award a badge, returning the badge info dict."""
    badge_def = BADGES.get(badge_id, {})
    badge_doc = {
        "user_id": user_id,
        "badge_id": badge_id,
        "badge_name": badge_def.get("name", badge_id),
        "description": badge_def.get("description", ""),
        "earned_at": datetime.utcnow(),
    }
    await db.badges.insert_one(badge_doc)
    return {"badge_id": badge_id, "badge_name": badge_def.get("name", badge_id)}


async def check_practice_badges(user_id: str, db) -> list:
    """
    Check and award badges after a practice submission.
    Returns list of newly earned badge dicts.
    """
    earned_docs = await db.badges.find({"user_id": user_id}).to_list(100)
    already_earned = {b["badge_id"] for b in earned_docs}

    newly_earned = []

    # writer: completed 10 practice tasks total
    total_practices = await db.practice_records.count_documents({"user_id": user_id})
    if total_practices >= 10 and "writer" not in already_earned:
        badge = await _award_badge(user_id, "writer", db)
        newly_earned.append(badge)
        already_earned.add("writer")

    # perfectionist: scored 10/10 on any practice task
    perfect = await db.practice_records.find_one({
        "user_id": user_id,
        "overall_score": 10.0
    })
    if perfect and "perfectionist" not in already_earned:
        badge = await _award_badge(user_id, "perfectionist", db)
        newly_earned.append(badge)
        already_earned.add("perfectionist")

    # sharpshooter: check via email_expert-like logic on high scores
    email_highs = await db.practice_records.count_documents({
        "user_id": user_id,
        "task_type": "email",
        "overall_score": {"$gte": 8}
    })
    if email_highs >= 5 and "sharpshooter" not in already_earned:
        badge = await _award_badge(user_id, "sharpshooter", db)
        newly_earned.append(badge)

    return newly_earned
