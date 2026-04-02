"""
backfill_analytics.py — Retroactively populate daily_stats / weekly_stats / monthly_stats
from existing practice_records, learning_progress, badges, and error_patterns.

Run from the backend directory:
    cd d:\\AVTIVE PROJ\\WriteWisely\\backend
    python backfill_analytics.py

Works with both local MongoDB and MongoDB Atlas.
"""

import asyncio
import os
from datetime import datetime, timedelta, date
from collections import defaultdict
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")


def err_type_counts(errors: list) -> dict:
    counts = {"spelling": 0, "grammar": 0, "punctuation": 0, "word_confusion": 0}
    for e in errors:
        t = (e.get("type") or e.get("error_type") or "grammar").lower()
        if t == "spelling":
            counts["spelling"] += 1
        elif t in ("grammar", "sentence"):
            counts["grammar"] += 1
        elif t == "punctuation":
            counts["punctuation"] += 1
        else:
            counts["word_confusion"] += 1
    return counts


async def backfill(db):
    print("=" * 60)
    print("  WriteWisely Analytics Backfill")
    print("=" * 60)

    # ── 1. Get all users ─────────────────────────────────────
    users = await db.users.find({}, {"_id": 1}).to_list(10000)
    print(f"Found {len(users)} user(s)\n")

    for user_doc in users:
        user_id = str(user_doc["_id"])
        print(f"  Processing user: {user_id}")

        # ── 2. Pull all existing data ─────────────────────
        practice_records = await db.practice_records.find(
            {"user_id": user_id}
        ).sort("submitted_at", 1).to_list(10000)

        learning_records = await db.learning_progress.find(
            {"user_id": user_id}
        ).to_list(10000)

        # ── 3. Build per-day buckets ──────────────────────
        # Format: day_data[date_str] = { ... }
        day_data: dict = defaultdict(lambda: {
            "learning": {"lessons_completed": 0, "quizzes_taken": 0, "quiz_correct": 0,
                         "quiz_total": 0, "assignments_completed": 0, "assignment_score": 0,
                         "assignment_total": 0, "time_spent_minutes": 0, "credits_earned": 0},
            "practice": {"tasks_completed": 0, "task_types": [], "scores": [],
                         "average_score": 0, "words_written": 0,
                         "time_spent_minutes": 0, "credits_earned": 0},
            "errors": {"total_made": 0, "total_fixed": 0,
                       "by_type": {"spelling": 0, "grammar": 0, "punctuation": 0, "word_confusion": 0}},
            "totals": {"total_time_minutes": 0, "total_credits": 0, "total_words": 0,
                       "accuracy_percentage": 0, "login": True},
        })

        # ─ Practice records ────────────────────────────
        for p in practice_records:
            submitted = p.get("submitted_at")
            if not submitted:
                continue
            day = submitted.strftime("%Y-%m-%d")
            score = float(p.get("overall_score", 0))
            words = p.get("word_count", 0)
            credits = p.get("credits_earned", 0)
            errors = p.get("analysis", {}).get("errors", [])
            total_errors = len(errors)
            ecounts = err_type_counts(errors)

            d = day_data[day]
            d["practice"]["tasks_completed"] += 1
            d["practice"]["scores"].append(score)
            d["practice"]["task_types"].append(p.get("task_type", "general"))
            d["practice"]["words_written"] += words
            d["practice"]["credits_earned"] += credits
            d["practice"]["time_spent_minutes"] += 10  # estimate ~10 min per task

            d["errors"]["total_made"] += total_errors
            for etype, cnt in ecounts.items():
                d["errors"]["by_type"][etype] += cnt

            d["totals"]["total_words"] += words
            d["totals"]["total_credits"] += credits
            d["totals"]["total_time_minutes"] += 10

        # ─ Learning records ────────────────────────────
        for l in learning_records:
            started = l.get("started_at") or l.get("completed_at")
            if not started:
                continue
            day = started.strftime("%Y-%m-%d")
            d = day_data[day]

            # Lesson read
            if l.get("lesson_read"):
                d["learning"]["lessons_completed"] += 1
                lc = l.get("credits_earned", 0)
                d["learning"]["credits_earned"] += lc
                d["totals"]["total_credits"] += lc
                d["learning"]["time_spent_minutes"] += 8  # estimate

            # Quiz scores
            for q in l.get("quiz_scores", []):
                d["learning"]["quizzes_taken"] += 1
                d["learning"]["quiz_correct"] += q.get("score", 0)
                d["learning"]["quiz_total"] += q.get("total", 0)

            # Assignment
            a = l.get("assignment", {})
            if a.get("submitted"):
                d["learning"]["assignments_completed"] += 1
                d["learning"]["assignment_score"] += a.get("score", 0)
                d["learning"]["assignment_total"] += a.get("total", 1)

        # ── 4. Compute accuracy + recalculate averages ──
        for day, d in day_data.items():
            scores_list = d["practice"]["scores"]
            if scores_list:
                d["practice"]["average_score"] = round(sum(scores_list) / len(scores_list), 2)

            # Accuracy
            accuracy_sources = []
            qt = d["learning"]["quiz_total"]
            if qt > 0:
                accuracy_sources.append(d["learning"]["quiz_correct"] / qt * 100)
            for s in d["practice"]["scores"]:
                accuracy_sources.append(s * 10)
            if accuracy_sources:
                d["totals"]["accuracy_percentage"] = round(sum(accuracy_sources) / len(accuracy_sources), 1)

            d["totals"]["total_time_minutes"] = (
                d["learning"]["time_spent_minutes"] + d["practice"]["time_spent_minutes"]
            )

        # ── 5. Upsert daily_stats ────────────────────────
        daily_count = 0
        for day_str, d in day_data.items():
            doc = {
                "user_id": user_id,
                "date": day_str,
                "learning": d["learning"],
                "practice": d["practice"],
                "errors": d["errors"],
                "totals": d["totals"],
                "created_at": datetime.utcnow(),
                "last_updated": datetime.utcnow(),
            }
            await db.daily_stats.update_one(
                {"user_id": user_id, "date": day_str},
                {"$set": doc},
                upsert=True
            )
            daily_count += 1

        print(f"    ✅ daily_stats upserted: {daily_count} days")

        # ── 6. Aggregate weekly_stats ────────────────────
        if not day_data:
            continue

        all_dates = sorted(day_data.keys())
        first_day = datetime.strptime(all_dates[0], "%Y-%m-%d").date()
        last_day = date.today()

        # Generate all week_starts from first activity to today
        week_starts = set()
        cur = first_day - timedelta(days=first_day.weekday())
        while cur <= last_day:
            week_starts.add(cur)
            cur += timedelta(days=7)

        weekly_count = 0
        for wstart in sorted(week_starts):
            week_dates = [(wstart + timedelta(days=i)).isoformat() for i in range(7)]
            week_days = [day_data[d] for d in week_dates if d in day_data]

            if not week_days:
                continue

            def _sum(dd_list, *keys):
                total = 0
                for dd in dd_list:
                    val = dd
                    for k in keys:
                        val = val.get(k, 0) if isinstance(val, dict) else 0
                    total += val
                return total

            all_scores = []
            for dd in week_days:
                all_scores.extend(dd["practice"]["scores"])

            all_acc = [dd["totals"]["accuracy_percentage"] for dd in week_days if dd["totals"]["accuracy_percentage"] > 0]
            qt_total = _sum(week_days, "learning", "quiz_total")

            error_by_type = {
                t: _sum(week_days, "errors", "by_type", t)
                for t in ["spelling", "grammar", "punctuation", "word_confusion"]
            }
            most_common = max(error_by_type, key=error_by_type.get) if any(error_by_type.values()) else "none"
            wend = wstart + timedelta(days=6)

            week_doc = {
                "user_id": user_id,
                "week_start": wstart.isoformat(),
                "week_end": wend.isoformat(),
                "week_number": wstart.isocalendar()[1],
                "year": wstart.year,
                "learning": {
                    "lessons_completed": _sum(week_days, "learning", "lessons_completed"),
                    "quizzes_taken": _sum(week_days, "learning", "quizzes_taken"),
                    "quiz_accuracy": round(_sum(week_days, "learning", "quiz_correct") / qt_total * 100, 1) if qt_total > 0 else 0,
                    "assignments_completed": _sum(week_days, "learning", "assignments_completed"),
                    "avg_assignment_score": 0,
                    "time_spent_minutes": _sum(week_days, "learning", "time_spent_minutes"),
                },
                "practice": {
                    "tasks_completed": _sum(week_days, "practice", "tasks_completed"),
                    "avg_score": round(sum(all_scores) / len(all_scores), 2) if all_scores else 0,
                    "best_score": max(all_scores) if all_scores else 0,
                    "worst_score": min(all_scores) if all_scores else 0,
                    "words_written": _sum(week_days, "practice", "words_written"),
                    "time_spent_minutes": _sum(week_days, "practice", "time_spent_minutes"),
                    "improvement_from_last_week": 0,
                },
                "errors": {
                    "total_made": _sum(week_days, "errors", "total_made"),
                    "total_fixed": 0,
                    "fix_rate": 0,
                    "most_common": most_common,
                    "by_type": error_by_type,
                    "improvement_from_last_week": {},
                },
                "totals": {
                    "active_days": len([dd for dd in week_days if dd["totals"].get("login")]),
                    "total_time_minutes": _sum(week_days, "totals", "total_time_minutes"),
                    "total_credits": _sum(week_days, "totals", "total_credits"),
                    "total_words": _sum(week_days, "totals", "total_words"),
                    "avg_daily_accuracy": round(sum(all_acc) / len(all_acc), 1) if all_acc else 0,
                },
                "generated_at": datetime.utcnow(),
            }

            await db.weekly_stats.update_one(
                {"user_id": user_id, "week_start": wstart.isoformat()},
                {"$set": week_doc},
                upsert=True
            )
            weekly_count += 1

        print(f"    ✅ weekly_stats upserted: {weekly_count} weeks")

        # ── 7. Aggregate monthly_stats ───────────────────
        import calendar as _cal

        months_seen = set()
        for d_str in day_data.keys():
            dt = datetime.strptime(d_str, "%Y-%m-%d")
            months_seen.add((dt.year, dt.month))

        monthly_count = 0
        for (yr, mo) in sorted(months_seen):
            weekly_docs = await db.weekly_stats.find({"user_id": user_id, "year": yr}).to_list(6)
            mo_weeks = []
            for w in weekly_docs:
                ws_dt = datetime.strptime(w["week_start"], "%Y-%m-%d")
                we_dt = datetime.strptime(w["week_end"], "%Y-%m-%d")
                if ws_dt.month == mo or we_dt.month == mo:
                    mo_weeks.append(w)

            if not mo_weeks:
                continue

            def _ws(ws_list, *keys):
                total = 0
                for w in ws_list:
                    val = w
                    for k in keys:
                        val = val.get(k, 0) if isinstance(val, dict) else 0
                    total += val
                return total

            all_scores_mo = [w["practice"]["avg_score"] for w in mo_weeks if w["practice"]["avg_score"] > 0]
            all_acc_mo = [w["totals"]["avg_daily_accuracy"] for w in mo_weeks if w["totals"]["avg_daily_accuracy"] > 0]
            error_trend = {f"week{i+1}": w["errors"]["total_made"] for i, w in enumerate(mo_weeks)}
            by_type_trend = {t: [w["errors"]["by_type"].get(t, 0) for w in mo_weeks] for t in ["spelling", "grammar", "punctuation", "word_confusion"]}
            type_totals = {t: sum(by_type_trend[t]) for t in by_type_trend}
            needs_work = max(type_totals, key=type_totals.get) if any(type_totals.values()) else "spelling"

            # Badges this month
            ms = datetime(yr, mo, 1)
            me = datetime(yr, mo, _cal.monthrange(yr, mo)[1], 23, 59, 59)
            badges_mo = await db.badges.find({"user_id": user_id, "earned_at": {"$gte": ms, "$lte": me}}).to_list(20)

            month_doc = {
                "user_id": user_id, "month": mo, "year": yr,
                "learning": {
                    "lessons_completed": _ws(mo_weeks, "learning", "lessons_completed"),
                    "levels_gained": 0,
                    "quiz_accuracy": round(_ws(mo_weeks, "learning", "quiz_accuracy") / len(mo_weeks), 1) if mo_weeks else 0,
                    "assignments_completed": _ws(mo_weeks, "learning", "assignments_completed"),
                    "avg_assignment_score": 0,
                },
                "practice": {
                    "tasks_completed": _ws(mo_weeks, "practice", "tasks_completed"),
                    "avg_score": round(sum(all_scores_mo) / len(all_scores_mo), 2) if all_scores_mo else 0,
                    "score_trend": all_scores_mo,
                    "best_score": max((w["practice"]["best_score"] for w in mo_weeks), default=0),
                    "words_written": _ws(mo_weeks, "practice", "words_written"),
                    "favorite_task_type": "general",
                },
                "errors": {
                    "total_made": _ws(mo_weeks, "errors", "total_made"),
                    "total_fixed": 0,
                    "fix_rate": 0,
                    "trend": error_trend,
                    "most_improved": "spelling",
                    "needs_work": needs_work,
                    "by_type_trend": by_type_trend,
                },
                "totals": {
                    "active_days": _ws(mo_weeks, "totals", "active_days"),
                    "total_time_minutes": _ws(mo_weeks, "totals", "total_time_minutes"),
                    "total_credits": _ws(mo_weeks, "totals", "total_credits"),
                    "total_words": _ws(mo_weeks, "totals", "total_words"),
                    "avg_accuracy": round(sum(all_acc_mo) / len(all_acc_mo), 1) if all_acc_mo else 0,
                },
                "achievements": {
                    "badges_earned": len(badges_mo),
                    "badge_names": [b.get("badge_name", "") for b in badges_mo],
                    "credits_milestone": 0,
                },
                "generated_at": datetime.utcnow(),
            }

            await db.monthly_stats.update_one(
                {"user_id": user_id, "month": mo, "year": yr},
                {"$set": month_doc},
                upsert=True
            )
            monthly_count += 1

        print(f"    ✅ monthly_stats upserted: {monthly_count} months")

    # ── 8. Create indexes on new collections ──────────
    print("\nCreating indexes...")
    await db.daily_stats.create_index([("user_id", 1), ("date", 1)], unique=True, background=True)
    await db.weekly_stats.create_index([("user_id", 1), ("week_start", 1)], unique=True, background=True)
    await db.monthly_stats.create_index([("user_id", 1), ("month", 1), ("year", 1)], unique=True, background=True)

    print("\n✅ Backfill complete!")
    print("   daily_stats / weekly_stats / monthly_stats are now populated.")
    print("   Open MongoDB Atlas or Compass to verify the collections.\n")


async def main():
    print(f"Connecting to: {MONGO_URL}\n")
    client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=8000)
    try:
        await client.admin.command("ping")
        print("✅ MongoDB connected\n")
    except Exception as e:
        print(f"❌ Could not connect: {e}")
        print("   Check your MONGODB_URL in .env and make sure MongoDB is running.")
        return

    db = client.writewisely
    await backfill(db)
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
