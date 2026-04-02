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


def _safe_get(doc: dict, *path, default=0):
    """Safely get nested dict values without raising KeyError."""
    current = doc
    for key in path:
        if not isinstance(current, dict):
            return default
        current = current.get(key)
        if current is None:
            return default
    return current


def _daily_minutes(doc: dict) -> int:
    """Return best-effort daily minutes from daily_stats doc.

    Supports older docs where totals.total_time_minutes may be missing.
    """
    explicit_total = _safe_get(doc, "totals", "total_time_minutes", default=None)
    if isinstance(explicit_total, (int, float)):
        return int(explicit_total)

    learning_minutes = _safe_get(doc, "learning", "time_spent_minutes", default=0)
    practice_minutes = _safe_get(doc, "practice", "time_spent_minutes", default=0)

    learning_val = learning_minutes if isinstance(learning_minutes, (int, float)) else 0
    practice_val = practice_minutes if isinstance(practice_minutes, (int, float)) else 0
    return int(learning_val + practice_val)


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


# ─── Analytics Overview — Full 8-Section Response ────────────
@router.get("/overview")
async def get_analytics(period: str = "weekly", user=Depends(get_current_user)):
    """
    Full analytics page data — all 8 sections in one call.
    period: daily | weekly | monthly
    """
    db = get_db()
    user_id = user["id"]
    profile = user.get("profile", {})

    # ── Pull all practice records ────────────────────────────
    all_practice = await db.practice_records.find(
        {"user_id": user_id}
    ).sort("submitted_at", 1).to_list(200)

    period_docs = []
    period_label = "Last 8 weeks"

    # ── Accuracy graph (period-aware) ────────────────────────
    if period == "daily":
        from datetime import date
        dates = [(datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(6, -1, -1)]
        daily_docs = await db.daily_stats.find(
            {"user_id": user_id, "date": {"$in": dates}}
        ).to_list(7)
        period_docs = daily_docs
        period_label = "Last 7 days"
        daily_map = {d["date"]: d for d in daily_docs}
        accuracy_graph = [
            {
                "label": d[5:],
                "accuracy": _safe_get(daily_map.get(d, {}), "totals", "accuracy_percentage", default=0),
                "practice_avg": _safe_get(daily_map.get(d, {}), "practice", "average_score", default=0) * 10,
                "lessons": _safe_get(daily_map.get(d, {}), "learning", "lessons_completed", default=0)
            }
            for d in dates
        ]
    elif period == "monthly":
        monthly_docs = await db.monthly_stats.find(
            {"user_id": user_id}
        ).sort([("year", -1), ("month", -1)]).limit(6).to_list(6)
        monthly_docs.reverse()
        period_docs = monthly_docs
        period_label = "Last 6 months"
        import calendar as _cal
        accuracy_graph = [
            {
                "label": f"{_cal.month_abbr[m['month']]} {m['year']}",
                "accuracy": _safe_get(m, "totals", "avg_accuracy", default=0),
                "practice_avg": _safe_get(m, "practice", "avg_score", default=0) * 10,
                "lessons": _safe_get(m, "learning", "lessons_completed", default=0)
            }
            for m in monthly_docs
        ]
        if not accuracy_graph:
            accuracy_graph = _practice_trend_graph(all_practice)
    else:  # weekly
        weekly_docs = await db.weekly_stats.find(
            {"user_id": user_id}
        ).sort("week_start", -1).limit(8).to_list(8)
        weekly_docs.reverse()
        period_docs = weekly_docs
        period_label = "Last 8 weeks"
        accuracy_graph = [
            {
                "label": f"W{i+1}",
                "accuracy": _safe_get(w, "totals", "avg_daily_accuracy", default=0),
                "practice_avg": _safe_get(w, "practice", "avg_score", default=0) * 10,
                "lessons": _safe_get(w, "learning", "lessons_completed", default=0)
            }
            for i, w in enumerate(weekly_docs)
        ]
        if not accuracy_graph:
            accuracy_graph = _practice_trend_graph(all_practice)

    # ── Error analysis ───────────────────────────────────────
    all_errors = await db.error_patterns.find({"user_id": user_id}).to_list(200)
    top_errors_raw = sorted(all_errors, key=lambda e: e.get("frequency", 0), reverse=True)[:5]

    error_type_totals = defaultdict(int)
    for e in all_errors:
        error_type_totals[e.get("error_type", "other")] += e.get("frequency", 0)
    total_err_count = sum(error_type_totals.values())
    error_distribution = [
        {
            "name": k, "value": v,
            "percentage": round(v / total_err_count * 100, 1) if total_err_count > 0 else 0
        }
        for k, v in error_type_totals.items()
    ]

    top_errors = [
        {
            "rank": i + 1,
            "error": e.get("original_word", e.get("word", "?")),
            "type": e.get("error_type", "spelling"),
            "count": e.get("frequency", 0),
            "status": "improving" if e.get("frequency", 0) < 3 else "active"
        }
        for i, e in enumerate(top_errors_raw)
    ]

    # ── Learning progress ────────────────────────────────────
    all_progress = await db.learning_progress.find({"user_id": user_id}).to_list(30)
    completed = [p for p in all_progress if p.get("status") == "completed"]
    beginner_done = len([p for p in completed if p.get("level_number", 0) <= 10])
    intermediate_done = len([p for p in completed if 11 <= p.get("level_number", 0) <= 20])
    advanced_done = len([p for p in completed if p.get("level_number", 0) >= 21])

    quiz_performance = []
    for p in completed[-10:]:
        for q in p.get("quiz_scores", []):
            total_q = q.get("total", 0)
            if total_q > 0:
                pct = round(q.get("score", 0) / total_q * 100, 0)
                quiz_performance.append({"level": f"L{p.get('level_number', 0)}", "score_percentage": pct})
                break

    # ── Practice performance ─────────────────────────────────
    practice_scores_trend = [
        {"label": f"T{i+1}", "score": p.get("overall_score", 0)}
        for i, p in enumerate(all_practice[-10:])
    ]
    task_type_breakdown: dict = {}
    for p in all_practice:
        ttype = p.get("task_type", "general")
        if ttype not in task_type_breakdown:
            task_type_breakdown[ttype] = {"scores": [], "count": 0}
        task_type_breakdown[ttype]["scores"].append(p.get("overall_score", 0))
        task_type_breakdown[ttype]["count"] += 1
    task_type_stats = [
        {"type": k, "avg_score": round(sum(v["scores"]) / len(v["scores"]), 1), "count": v["count"]}
        for k, v in task_type_breakdown.items()
    ]

    # ── Heatmap (last 365 days) ─────────────────────────────
    all_daily = await db.daily_stats.find({"user_id": user_id}).sort("date", -1).limit(365).to_list(365)
    heatmap_data = {
        d.get("date"): _daily_minutes(d)
        for d in all_daily
        if d.get("date")
    }
    total_time = sum(_daily_minutes(d) for d in all_daily)
    learning_time = sum(_safe_get(d, "learning", "time_spent_minutes", default=0) for d in all_daily)
    practice_time_sum = sum(_safe_get(d, "practice", "time_spent_minutes", default=0) for d in all_daily)

    # ── Daily time bars (last 7 days) ───────────────────────
    from datetime import date as _date
    last7 = [(datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(6, -1, -1)]
    daily_time_bars = [
        {"day": d[5:], "minutes": heatmap_data.get(d, 0)}
        for d in last7
    ]

    # ── Badges ───────────────────────────────────────────────
    ALL_BADGE_DEFS = [
        {"badge_id": "first_steps",   "name": "First Steps",      "requirement": "Complete first lesson",           "credits_needed": 10},
        {"badge_id": "bookworm",      "name": "Bookworm",          "requirement": "Complete 10 lessons",             "credits_needed": 100},
        {"badge_id": "writer_badge",  "name": "Writer",            "requirement": "Complete 10 practice tasks",      "credits_needed": 250},
        {"badge_id": "on_fire",       "name": "On Fire",           "requirement": "7-day streak",                    "credits_needed": 300},
        {"badge_id": "sharpshooter",  "name": "Sharpshooter",      "requirement": "5 perfect quiz scores",           "credits_needed": 400},
        {"badge_id": "scholar",       "name": "Scholar",           "requirement": "Reach Level 15",                  "credits_needed": 500},
        {"badge_id": "perfectionist", "name": "Perfectionist",     "requirement": "3 practice scores of 10/10",      "credits_needed": 750},
        {"badge_id": "champion",      "name": "Grammar Champion",  "requirement": "Reach Level 25",                  "credits_needed": 1000},
        {"badge_id": "master",        "name": "Master",            "requirement": "Complete all 30 levels",          "credits_needed": 2000},
        {"badge_id": "legend",        "name": "Legend",            "requirement": "All badges + 90% accuracy",       "credits_needed": 5000},
    ]

    all_badges_earned = await db.badges.find({"user_id": user_id}).sort("earned_at", 1).to_list(20)
    earned_ids = {b["badge_id"] for b in all_badges_earned}
    next_badges = [b for b in ALL_BADGE_DEFS if b["badge_id"] not in earned_ids][:2]

    # Credits growth (cumulative weekly)
    weekly_for_credits = await db.weekly_stats.find({"user_id": user_id}).sort("week_start", 1).limit(8).to_list(8)
    running = 0
    credits_growth = []
    for i, w in enumerate(weekly_for_credits, 1):
        running += _safe_get(w, "totals", "total_credits", default=0)
        credits_growth.append({"label": f"W{i}", "credits": running})

    badge_timeline = []
    for b in all_badges_earned:
        earned_at_val = b.get("earned_at")
        badge_timeline.append({
            "badge_id": b.get("badge_id", ""),
            "name": b.get("badge_name", ""),
            "earned_at": earned_at_val.isoformat() if isinstance(earned_at_val, datetime) else str(earned_at_val or ""),
            "description": b.get("description", "")
        })

    # ── Comparison: this week vs last week ───────────────────
    today_dt = _date.today()
    wstart = (today_dt - timedelta(days=today_dt.weekday())).isoformat()
    pwstart = (today_dt - timedelta(days=today_dt.weekday() + 7)).isoformat()
    this_week = await db.weekly_stats.find_one({"user_id": user_id, "week_start": wstart})
    last_week = await db.weekly_stats.find_one({"user_id": user_id, "week_start": pwstart})

    def _cmp(curr, prev):
        diff = round(curr - prev, 2)
        return {"current": curr, "previous": prev, "diff": diff, "direction": "up" if diff > 0 else ("down" if diff < 0 else "same")}

    comparison = {}
    if this_week and last_week:
        comparison = {
            "accuracy":     _cmp(_safe_get(this_week, "totals", "avg_daily_accuracy", default=0), _safe_get(last_week, "totals", "avg_daily_accuracy", default=0)),
            "errors":       _cmp(_safe_get(this_week, "errors", "total_made", default=0), _safe_get(last_week, "errors", "total_made", default=0)),
            "practice_avg": _cmp(_safe_get(this_week, "practice", "avg_score", default=0), _safe_get(last_week, "practice", "avg_score", default=0)),
            "time_spent":   _cmp(_safe_get(this_week, "totals", "total_time_minutes", default=0), _safe_get(last_week, "totals", "total_time_minutes", default=0)),
            "words":        _cmp(_safe_get(this_week, "totals", "total_words", default=0), _safe_get(last_week, "totals", "total_words", default=0)),
            "lessons":      _cmp(_safe_get(this_week, "learning", "lessons_completed", default=0), _safe_get(last_week, "learning", "lessons_completed", default=0)),
        }

    # ── Insights (rule-based) ────────────────────────────────
    insights = []
    if all_errors:
        top_e = max(all_errors, key=lambda e: e.get("frequency", 0))
        insights.append({"type": "warning", "icon": "⚠️", "text": f"{top_e.get('error_type','').capitalize()} errors are most common", "detail": f"'{top_e.get('original_word','')}' appears {top_e.get('frequency',0)} times"})
    if len(all_practice) >= 3:
        recent = [p.get("overall_score", 0) for p in all_practice[-3:]]
        first3  = [p.get("overall_score", 0) for p in all_practice[:3]]
        if sum(recent) / 3 > sum(first3) / 3:
            insights.append({"type": "success", "icon": "💡", "text": "Practice scores are improving!", "detail": f"Avg went from {round(sum(first3)/3,1)} → {round(sum(recent)/3,1)}"})
    streak = profile.get("current_streak", 0)
    if 0 < streak < 7:
        insights.append({"type": "info", "icon": "🔥", "text": f"{streak} day streak! Keep going!", "detail": f"{7-streak} more days to unlock Week Warrior badge"})
    if task_type_stats:
        weakest = min(task_type_stats, key=lambda x: x["avg_score"])
        insights.append({"type": "suggestion", "icon": "🎯", "text": f"Focus on {weakest['type']} writing", "detail": f"Your {weakest['type']} avg is {weakest['avg_score']}/10 (lowest)"})

    # ── Overview cards ───────────────────────────────────────
    def _avg(values: list) -> float:
        nums = [float(v) for v in values if isinstance(v, (int, float))]
        if not nums:
            return 0.0
        return round(sum(nums) / len(nums), 1)

    accuracy = await _calculate_accuracy(user_id)
    avg_practice_score = round(sum(p.get("overall_score", 0) for p in all_practice) / len(all_practice), 1) if all_practice else 0
    all_time_words = sum(p.get("word_count", 0) for p in all_practice)

    period_accuracy = 0.0
    period_avg_practice_score = 0.0
    period_words = 0
    period_practice_done = 0
    period_errors = 0
    period_errors_resolved = 0
    period_time_minutes = 0
    period_credits = 0

    if period_docs:
        if period == "daily":
            period_accuracy = _avg([_safe_get(d, "totals", "accuracy_percentage", default=0) for d in period_docs])
            period_avg_practice_score = _avg([_safe_get(d, "practice", "average_score", default=0) for d in period_docs])
            period_words = int(sum(_safe_get(d, "totals", "total_words", default=0) for d in period_docs))
            period_practice_done = int(sum(_safe_get(d, "practice", "tasks_completed", default=0) for d in period_docs))
            period_errors = int(sum(_safe_get(d, "errors", "total_made", default=0) for d in period_docs))
            period_errors_resolved = int(sum(_safe_get(d, "errors", "total_fixed", default=0) for d in period_docs))
            period_time_minutes = int(sum(_daily_minutes(d) for d in period_docs))
            period_credits = int(sum(_safe_get(d, "totals", "total_credits", default=0) for d in period_docs))
        elif period == "monthly":
            period_accuracy = _avg([_safe_get(m, "totals", "avg_accuracy", default=0) for m in period_docs])
            period_avg_practice_score = _avg([_safe_get(m, "practice", "avg_score", default=0) for m in period_docs])
            period_words = int(sum(_safe_get(m, "totals", "total_words", default=0) for m in period_docs))
            period_practice_done = int(sum(_safe_get(m, "practice", "tasks_completed", default=0) for m in period_docs))
            period_errors = int(sum(_safe_get(m, "errors", "total_made", default=0) for m in period_docs))
            period_errors_resolved = int(sum(_safe_get(m, "errors", "total_fixed", default=0) for m in period_docs))
            period_time_minutes = int(sum(_safe_get(m, "totals", "total_time_minutes", default=0) for m in period_docs))
            period_credits = int(sum(_safe_get(m, "totals", "total_credits", default=0) for m in period_docs))
        else:
            period_accuracy = _avg([_safe_get(w, "totals", "avg_daily_accuracy", default=0) for w in period_docs])
            period_avg_practice_score = _avg([_safe_get(w, "practice", "avg_score", default=0) for w in period_docs])
            period_words = int(sum(_safe_get(w, "totals", "total_words", default=0) for w in period_docs))
            period_practice_done = int(sum(_safe_get(w, "practice", "tasks_completed", default=0) for w in period_docs))
            period_errors = int(sum(_safe_get(w, "errors", "total_made", default=0) for w in period_docs))
            period_errors_resolved = int(sum(_safe_get(w, "errors", "total_fixed", default=0) for w in period_docs))
            period_time_minutes = int(sum(_safe_get(w, "totals", "total_time_minutes", default=0) for w in period_docs))
            period_credits = int(sum(_safe_get(w, "totals", "total_credits", default=0) for w in period_docs))
    else:
        now = datetime.utcnow()
        if period == "daily":
            since = now - timedelta(days=7)
            period_label = "Last 7 days"
        elif period == "monthly":
            since = now - timedelta(days=180)
            period_label = "Last 6 months"
        else:
            since = now - timedelta(days=56)
            period_label = "Last 8 weeks"

        period_practice = []
        for p in all_practice:
            submitted_at = p.get("submitted_at")
            if isinstance(submitted_at, datetime) and submitted_at >= since:
                period_practice.append(p)

        period_scores = [p.get("overall_score", 0) for p in period_practice if isinstance(p.get("overall_score"), (int, float))]
        period_accuracy = round(_avg([s * 10 for s in period_scores]), 1) if period_scores else 0
        period_avg_practice_score = _avg(period_scores)
        period_words = int(sum(p.get("word_count", 0) for p in period_practice))
        period_practice_done = len(period_practice)
        period_errors = int(sum(len((p.get("analysis") or {}).get("errors", []) or []) for p in period_practice))
        period_errors_resolved = 0
        period_time_minutes = int(len(period_practice) * 10)
        period_credits = int(sum(p.get("credits_earned", 0) for p in period_practice))

        if period_practice_done == 0:
            period_accuracy = accuracy
            period_avg_practice_score = avg_practice_score
            period_words = int(all_time_words)
            period_practice_done = len(all_practice)
            period_errors = int(sum(e.get("frequency", 0) for e in all_errors))
            period_errors_resolved = int(len([e for e in all_errors if e.get("resolved", False)]))
            period_time_minutes = int(total_time)
            period_credits = int(profile.get("total_credits", 0))

    return {
        "period": period,
        "overview_cards": {
            "level": profile.get("current_level", 1),
            "accuracy": round(period_accuracy, 1),
            "overall_accuracy": accuracy,
            "streak": profile.get("current_streak", 0),
            "best_streak": profile.get("best_streak", 0),
            "credits": period_credits,
            "total_credits": profile.get("total_credits", 0),
            "rank": profile.get("rank", "Beginner Writer"),
            "total_words": period_words,
            "practice_done": period_practice_done,
            "avg_practice_score": round(period_avg_practice_score, 1),
            "total_errors": period_errors,
            "errors_resolved": period_errors_resolved,
            "time_minutes": period_time_minutes,
            "period_label": period_label
        },
        "accuracy_graph": accuracy_graph,
        "error_analysis": {
            "distribution": error_distribution,
            "top_errors": top_errors,
        },
        "learning_progress": {
            "completed_levels": len(completed),
            "total_levels": 30,
            "beginner":     {"done": beginner_done,     "total": 10},
            "intermediate": {"done": intermediate_done, "total": 10},
            "advanced":     {"done": advanced_done,     "total": 10},
            "quiz_performance": quiz_performance,
            "stats": {
                "lessons_completed": len(completed),
                "quizzes_passed": len([p for p in completed if p.get("quiz_scores")]),
                "assignments_done": len([p for p in completed if p.get("assignment", {}).get("submitted")]),
                "completion_rate": round(len(completed) / 30 * 100, 1)
            }
        },
        "practice_performance": {
            "score_trend": practice_scores_trend,
            "by_task_type": task_type_stats,
            "stats": {
                "total_done": len(all_practice),
                "best_score": max((p.get("overall_score", 0) for p in all_practice), default=0),
                "worst_score": min((p.get("overall_score", 0) for p in all_practice), default=0),
                "avg_score": avg_practice_score
            }
        },
        "time_activity": {
            "heatmap": heatmap_data,
            "distribution": {
                "learning": round(learning_time / total_time * 100, 1) if total_time > 0 else 0,
                "practice": round(practice_time_sum / total_time * 100, 1) if total_time > 0 else 0,
                "total_minutes": total_time
            },
            "daily_bars": daily_time_bars
        },
        "achievements": {
            "badges_earned": badge_timeline,
            "total_earned": len(all_badges_earned),
            "total_available": len(ALL_BADGE_DEFS),
            "next_badges": next_badges,
            "credits_growth": credits_growth,
            "all_badge_defs": ALL_BADGE_DEFS
        },
        "comparison": comparison,
        "insights": insights
    }


def _practice_trend_graph(records: list) -> list:
    """Fallback: build accuracy graph from raw practice records."""
    return [
        {"label": f"T{i+1}", "accuracy": round(p.get("overall_score", 0) * 10, 1), "practice_avg": round(p.get("overall_score", 0) * 10, 1), "lessons": 0}
        for i, p in enumerate(records[-8:])
    ]


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
