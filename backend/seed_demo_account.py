"""
seed_demo_account.py — Populates dummy.login@writewisely.dev with rich demo data.

Run from the backend/ directory:
    python seed_demo_account.py

What it creates:
  • User account (email verified, level 8, 2450 credits, 14-day streak)
  • learning_progress  → 10 completed levels + 1 in-progress
  • error_patterns     → 6 common error types with realistic frequencies
  • practice_records   → 18 practice sessions spanning the last 21 days
  • badges             → 5 earned badges
  • projects           → 3 writing projects with real content
  • chat_history       → a short 3-turn AI-tutor conversation
  • notifications      → 4 recent notifications
"""

import asyncio
import sys
from datetime import datetime, timedelta
from pathlib import Path

# ── ensure we can import config even when run directly ──────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parent))

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from config import MONGODB_URL, hash_password

# ── Constants ───────────────────────────────────────────────────────────────
DEMO_EMAIL    = "dummy.login@writewisely.dev"
DEMO_PASSWORD = "Demo@1234"          # easy to type during the demo
DEMO_NAME     = "Alex Morgan"
NOW           = datetime.utcnow()


def days_ago(n: int, hour: int = 10, minute: int = 0) -> datetime:
    return (NOW - timedelta(days=n)).replace(hour=hour, minute=minute, second=0)


# ── Main Seed Function ───────────────────────────────────────────────────────
async def seed():
    client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=6000)
    db = client.writewisely

    print("🔌 Connected to MongoDB")

    # ── 0. Remove old demo data ──────────────────────────────────────────────
    existing = await db.users.find_one({"email": DEMO_EMAIL})
    if existing:
        uid = str(existing["_id"])
        print(f"♻️  Wiping existing demo data for {DEMO_EMAIL} (uid={uid}) …")
        await db.users.delete_one({"_id": existing["_id"]})
        for col in ["learning_progress", "error_patterns", "practice_records",
                    "badges", "projects", "chat_history", "notifications"]:
            res = await db[col].delete_many({"user_id": uid})
            print(f"   {col}: deleted {res.deleted_count} docs")

    # ── 1. Create User ───────────────────────────────────────────────────────
    user_doc = {
        "name":           DEMO_NAME,
        "email":          DEMO_EMAIL,
        "phone":          "+91 98765 43210",
        "password_hash":  hash_password(DEMO_PASSWORD),
        "role":           "student",
        "email_verified": True,
        "session_id":     "demo-session",
        "created_at":     days_ago(60),
        "profile": {
            "current_level":    8,
            "assessment_score": 72,
            "strengths":        ["sentence_structure", "vocabulary", "punctuation"],
            "weaknesses":       ["spelling", "homophone_confusion", "comma_splices"],
            "total_credits":    2450,
            "current_streak":   14,
            "best_streak":      21,
            "rank":             "Proficient Writer",
            "last_active":      NOW,
        },
        "settings": {
            "theme":                  "dark",
            "font_size":              "medium",
            "notifications_enabled":  True,
            "email_notifications":    True,
            "reminder_time":          "09:00",
        }
    }
    result = await db.users.insert_one(user_doc)
    uid = str(result.inserted_id)
    print(f"✅ User created  → _id={uid}")

    # ── 2. Learning Progress ─────────────────────────────────────────────────
    level_meta = [
        (1,  "Spelling Basics",          "spelling",   "completed",  days_ago(55), days_ago(55, 11), [{"score":9,"total":10}]),
        (2,  "Grammar Fundamentals",     "grammar",    "completed",  days_ago(50), days_ago(50, 11), [{"score":8,"total":10}]),
        (3,  "Punctuation Essentials",   "punctuation","completed",  days_ago(45), days_ago(45, 11), [{"score":7,"total":10}]),
        (4,  "Homophones & Confusables", "spelling",   "completed",  days_ago(40), days_ago(40, 11), [{"score":6,"total":10}]),
        (5,  "Sentence Structure",       "grammar",    "completed",  days_ago(35), days_ago(35, 11), [{"score":8,"total":10}]),
        (6,  "Formal Email Writing",     "writing",    "completed",  days_ago(28), days_ago(28, 11), [{"score":9,"total":10}]),
        (7,  "Paragraph Coherence",      "writing",    "completed",  days_ago(21), days_ago(21, 11), [{"score":7,"total":10}]),
        (8,  "Advanced Punctuation",     "punctuation","in_progress",days_ago(7),  None,             []),
        (9,  "Report Writing",           "writing",    "available",  None,         None,             []),
        (10, "Academic Style",           "writing",    "available",  None,         None,             []),
        (11, "Complex Sentences",        "grammar",    "locked",     None,         None,             []),
    ]

    lp_docs = []
    for lvl, topic, cat, status, started, completed, qscores in level_meta:
        doc = {
            "user_id":       uid,
            "level_number":  lvl,
            "topic":         topic,
            "category":      cat,
            "status":        status,
            "read_sections": [True, True, True] if status == "completed" else [True, False],
            "quiz_scores":   qscores,
            "credits_earned": 120 if status == "completed" else 0,
            "started_at":    started,
            "completed_at":  completed,
        }
        lp_docs.append(doc)

    await db.learning_progress.insert_many(lp_docs)
    print(f"✅ learning_progress  → {len(lp_docs)} records")

    # ── 3. Error Patterns ────────────────────────────────────────────────────
    error_pattern_docs = [
        {
            "user_id":      uid,
            "error_type":   "spelling",
            "subtype":      "misspelling",
            "frequency":    34,
            "example_word": "recieve",
            "correction":   "receive",
            "original_word":"recieve",
            "accuracy":     62.0,
            "first_seen":   days_ago(55),
            "last_occurred":days_ago(1),
        },
        {
            "user_id":      uid,
            "error_type":   "homophone",
            "subtype":      "their/there/they're",
            "frequency":    18,
            "example_word": "there going",
            "correction":   "they're going",
            "original_word":"there",
            "accuracy":     70.0,
            "first_seen":   days_ago(45),
            "last_occurred":days_ago(3),
        },
        {
            "user_id":      uid,
            "error_type":   "grammar",
            "subtype":      "subject_verb_agreement",
            "frequency":    14,
            "example_word": "they was",
            "correction":   "they were",
            "original_word":"was",
            "accuracy":     75.0,
            "first_seen":   days_ago(40),
            "last_occurred":days_ago(5),
        },
        {
            "user_id":      uid,
            "error_type":   "punctuation",
            "subtype":      "comma_splice",
            "frequency":    11,
            "example_word": "I went home, it was late",
            "correction":   "I went home; it was late",
            "original_word":"comma_splice",
            "accuracy":     78.0,
            "first_seen":   days_ago(35),
            "last_occurred":days_ago(4),
        },
        {
            "user_id":      uid,
            "error_type":   "word_choice",
            "subtype":      "affect_effect",
            "frequency":    7,
            "example_word": "the affect of rain",
            "correction":   "the effect of rain",
            "original_word":"affect",
            "accuracy":     85.0,
            "first_seen":   days_ago(20),
            "last_occurred":days_ago(7),
        },
        {
            "user_id":      uid,
            "error_type":   "spelling",
            "subtype":      "double_consonant",
            "frequency":    9,
            "example_word": "occurence",
            "correction":   "occurrence",
            "original_word":"occurence",
            "accuracy":     80.0,
            "first_seen":   days_ago(30),
            "last_occurred":days_ago(2),
        },
    ]
    await db.error_patterns.insert_many(error_pattern_docs)
    print(f"✅ error_patterns     → {len(error_pattern_docs)} records")

    # ── 4. Practice Records ──────────────────────────────────────────────────
    task_types = ["email", "letter", "paragraph", "report", "journal"]
    practice_data = [
        # (days_ago, task_type, overall_score, word_count, credits_earned)
        (21, "letter",    6.2, 120, 30),
        (20, "email",     5.8, 95,  20),
        (19, "paragraph", 6.5, 80,  30),
        (18, "journal",   7.0, 110, 40),
        (17, "letter",    6.8, 130, 35),
        (16, "email",     7.2, 85,  40),
        (15, "report",    5.5, 200, 20),
        (14, "paragraph", 7.5, 90,  50),
        (13, "letter",    7.8, 140, 50),
        (12, "email",     8.0, 100, 60),
        (11, "journal",   6.5, 115, 30),
        (10, "report",    8.2, 210, 60),
        (9,  "paragraph", 8.5, 95,  70),
        (8,  "letter",    7.9, 145, 50),
        (5,  "email",     8.8, 105, 80),
        (4,  "report",    8.3, 220, 60),
        (2,  "letter",    9.1, 150, 90),
        (1,  "email",     9.4, 110, 100),
    ]

    practice_docs = []
    for day, ttype, score, wcount, credits in practice_data:
        practice_docs.append({
            "user_id":       uid,
            "task_type":     ttype,
            "task_id":       f"pt_{ttype}_{day}",
            "text":          _sample_practice_text(ttype),
            "overall_score": score,
            "word_count":    wcount,
            "credits_earned":credits,
            "errors": _sample_errors(ttype),
            "strengths":     ["clear opening", "good vocabulary"],
            "areas_to_improve": ["punctuation consistency", "avoid run-on sentences"],
            "submitted_at":  days_ago(day, 9, 30),
            "mode":          "after_analysis",
            "attempt_number":1,
        })

    await db.practice_records.insert_many(practice_docs)
    print(f"✅ practice_records   → {len(practice_docs)} records")

    # ── 5. Badges ────────────────────────────────────────────────────────────
    badge_docs = [
        {
            "user_id":    uid,
            "badge_id":   "first_lesson",
            "badge_name": "First Step",
            "description":"Completed your very first lesson!",
            "earned":     True,
            "earned_at":  days_ago(55),
        },
        {
            "user_id":    uid,
            "badge_id":   "streak_7",
            "badge_name": "Week Warrior",
            "description":"Maintained a 7-day learning streak.",
            "earned":     True,
            "earned_at":  days_ago(30),
        },
        {
            "user_id":    uid,
            "badge_id":   "practice_10",
            "badge_name": "Practice Pro",
            "description":"Submitted 10 practice sessions.",
            "earned":     True,
            "earned_at":  days_ago(15),
        },
        {
            "user_id":    uid,
            "badge_id":   "level_5",
            "badge_name": "Rising Star",
            "description":"Reached Level 5 in the curriculum.",
            "earned":     True,
            "earned_at":  days_ago(35),
        },
        {
            "user_id":    uid,
            "badge_id":   "perfect_quiz",
            "badge_name": "Quiz Master",
            "description":"Scored 100% on a quiz.",
            "earned":     True,
            "earned_at":  days_ago(20),
        },
        {
            "user_id":    uid,
            "badge_id":   "on_fire",
            "badge_name": "On Fire 🔥",
            "description":"Keep a 21-day streak to unlock!",
            "earned":     False,
            "earned_at":  None,
        },
        {
            "user_id":    uid,
            "badge_id":   "wordsmith",
            "badge_name": "Wordsmith",
            "description":"Write 5,000 words across all projects.",
            "earned":     False,
            "earned_at":  None,
        },
    ]
    await db.badges.insert_many(badge_docs)
    print(f"✅ badges             → {len(badge_docs)} records ({sum(1 for b in badge_docs if b['earned'])} earned)")

    # ── 6. Projects ──────────────────────────────────────────────────────────
    project_docs = [
        {
            "user_id":    uid,
            "title":      "Internship Application Email",
            "doc_type":   "email",
            "content":    (
                "Subject: Application for Summer Internship – Computer Science\n\n"
                "Dear Hiring Manager,\n\n"
                "I am writing to express my strong interest in the summer internship position "
                "at your esteemed organisation. I am currently a third-year student pursuing a "
                "Bachelor of Science in Computer Science at Delhi University.\n\n"
                "During my studies, I have developed proficiency in Python, data analysis, and "
                "web development. I have successfully completed two academic projects involving "
                "machine learning and REST API design. I am eager to apply these skills in a "
                "real-world environment.\n\n"
                "Please find my résumé attached for your consideration. I would welcome the "
                "opportunity to discuss how I can contribute to your team.\n\n"
                "Yours sincerely,\nAlex Morgan"
            ),
            "word_count": 118,
            "created_at": days_ago(10),
            "updated_at": days_ago(2),
        },
        {
            "user_id":    uid,
            "title":      "Climate Change Research Notes",
            "doc_type":   "research",
            "content":    (
                "# Climate Change: Causes, Effects & Solutions\n\n"
                "## Introduction\n"
                "Climate change refers to long-term shifts in global temperatures and weather patterns. "
                "While some change is natural, human activities since the Industrial Revolution have "
                "become the dominant driver.\n\n"
                "## Key Causes\n"
                "1. Burning fossil fuels releases CO₂ and methane.\n"
                "2. Deforestation reduces the Earth's carbon absorption capacity.\n"
                "3. Industrial agriculture contributes approximately 14.5% of global emissions.\n\n"
                "## Observed Effects\n"
                "- Global average temperature has risen ~1.1 °C since pre-industrial times.\n"
                "- Sea levels are rising at 3.3 mm per year.\n"
                "- Extreme weather events (floods, droughts, wildfires) are intensifying.\n\n"
                "## Potential Solutions\n"
                "Transitioning to renewable energy, increasing energy efficiency, and adopting "
                "sustainable land-use practices are among the most impactful interventions. "
                "International cooperation through agreements such as the Paris Accord remains critical."
            ),
            "word_count": 147,
            "created_at": days_ago(25),
            "updated_at": days_ago(8),
        },
        {
            "user_id":    uid,
            "title":      "My Learning Journey — Personal Journal",
            "doc_type":   "journal",
            "content":    (
                "March 13\n"
                "Started using WriteWisely today after struggling with formal writing for months. "
                "The placement test told me I'm at Level 2 — better than expected! Excited to work "
                "through the curriculum.\n\n"
                "March 19\n"
                "Completed the homophones lesson. Their, there, and they're always confused me. "
                "The quiz was tricky but I scored 6/10. The explanations really helped.\n\n"
                "March 24\n"
                "Submitted my first formal email practice. The AI feedback pointed out three comma "
                "splices I had not noticed. Going to review punctuation next.\n\n"
                "March 27\n"
                "14-day streak today! The dashboard shows my accuracy has climbed from 62% to 81%. "
                "Still struggling with spelling — recieve vs receive keeps tripping me up!"
            ),
            "word_count": 136,
            "created_at": days_ago(14),
            "updated_at": days_ago(0),
        },
    ]
    await db.projects.insert_many(project_docs)
    print(f"✅ projects           → {len(project_docs)} records")

    # ── 7. Chat History ──────────────────────────────────────────────────────
    chat_doc = {
        "user_id": uid,
        "messages": [
            {
                "role":      "user",
                "content":   "Why do I keep confusing 'affect' and 'effect'?",
                "timestamp": days_ago(5, 14, 10),
            },
            {
                "role":      "assistant",
                "content":   (
                    "Great question! The confusion is very common. Here is a simple rule:\n\n"
                    "• **Affect** is usually a *verb* — it describes an action. "
                    "Example: 'The rain *affected* our plans.'\n"
                    "• **Effect** is usually a *noun* — it's a result or outcome. "
                    "Example: 'The *effect* of rain was a cancelled picnic.'\n\n"
                    "A helpful trick: remember **A**ffect = **A**ction, **E**ffect = **E**nd result."
                ),
                "timestamp": days_ago(5, 14, 11),
            },
            {
                "role":      "user",
                "content":   "Can you give me a sentence to practice?",
                "timestamp": days_ago(5, 14, 13),
            },
            {
                "role":      "assistant",
                "content":   (
                    "Absolutely! Try completing this:\n\n"
                    "> 'Lack of sleep can ______ your concentration, and the ______ can last all day.'\n\n"
                    "Answer: **affect** (verb) and **effect** (noun). "
                    "Write a few similar sentences in your next practice session to reinforce this!"
                ),
                "timestamp": days_ago(5, 14, 14),
            },
        ],
        "created_at":  days_ago(5, 14, 10),
        "updated_at":  days_ago(5, 14, 14),
    }
    await db.chat_history.insert_one(chat_doc)
    print(f"✅ chat_history       → 1 conversation (4 messages)")

    # ── 8. Notifications ─────────────────────────────────────────────────────
    notification_docs = [
        {
            "user_id":    uid,
            "title":      "🔥 14-Day Streak!",
            "message":    "Amazing work, Alex! You've maintained a 14-day learning streak. Keep it up!",
            "type":       "achievement",
            "read":       False,
            "created_at": days_ago(0, 8, 0),
        },
        {
            "user_id":    uid,
            "title":      "📝 Practice Reminder",
            "message":    "You haven't practised today yet. Complete a quick 10-minute task to maintain your streak!",
            "type":       "reminder",
            "read":       False,
            "created_at": days_ago(0, 9, 0),
        },
        {
            "user_id":    uid,
            "title":      "🏅 Badge Earned: Quiz Master",
            "message":    "Congratulations! You scored 100% on a quiz and earned the Quiz Master badge.",
            "type":       "badge",
            "read":       True,
            "created_at": days_ago(20),
        },
        {
            "user_id":    uid,
            "title":      "📚 Level 8 Unlocked",
            "message":    "You've unlocked Advanced Punctuation (Level 8). Time to tackle comma splices and semicolons!",
            "type":       "learning",
            "read":       True,
            "created_at": days_ago(7),
        },
    ]
    await db.notifications.insert_many(notification_docs)
    print(f"✅ notifications      → {len(notification_docs)} records")

    # ── Done ─────────────────────────────────────────────────────────────────
    client.close()
    print("\n" + "="*60)
    print(f"🎉  Demo account seeded successfully!")
    print(f"    Email    : {DEMO_EMAIL}")
    print(f"    Password : {DEMO_PASSWORD}")
    print(f"    Level    : 8  |  Credits: 2450  |  Streak: 14 days")
    print(f"    Rank     : Proficient Writer")
    print("="*60)


# ── Helpers ──────────────────────────────────────────────────────────────────
def _sample_practice_text(task_type: str) -> str:
    texts = {
        "email": (
            "Dear Sir, I am writing to enquire about the job oppurtunity advertised on your website. "
            "I beleive I have the necessary qualifications and would like to apply. Please let me know "
            "if you require any additional informations. Yours faithfully, Alex."
        ),
        "letter": (
            "To Whom It May Concern, I am writting this letter to complain about the service I recieved "
            "at your branch last Tuesday. The staff were unhelpfull and the waiting time was unacceptable. "
            "I expect a prompt resolution to this matter."
        ),
        "paragraph": (
            "Technology has changged the way we communicate dramaticaly. In todays world, people can "
            "send messages across the globe in seconds. However, this convienence has also led to "
            "a decline in face-to-face interactions, which effects our social skills."
        ),
        "report": (
            "Executiv Summary: This report examines the impact of remote working on employee productivty. "
            "Data was collected from three hunderd employees over a six-month period. The findings indicate "
            "that flexability in working hours positively corelates with higher output and job satisfaction."
        ),
        "journal": (
            "Today I studdied the chapter on punctuation and realised I have been making alot of comma "
            "mistakes in my writing. The teacher says that a comma splice occures when two independant "
            "clauses are joined by just a comma. I need too practice this more."
        ),
    }
    return texts.get(task_type, texts["paragraph"])


def _sample_errors(task_type: str) -> list:
    common = [
        {
            "type": "spelling",
            "original": "recieve",
            "correction": "receive",
            "explanation": "'ei' not 'ie' — remember 'i before e except after c'.",
            "severity": "minor",
        },
        {
            "type": "grammar",
            "original": "informations",
            "correction": "information",
            "explanation": "'Information' is an uncountable noun and does not take a plural form.",
            "severity": "moderate",
        },
        {
            "type": "punctuation",
            "original": "In todays world",
            "correction": "In today's world",
            "explanation": "Possessive apostrophe required before the 's'.",
            "severity": "minor",
        },
        {
            "type": "spelling",
            "original": "beleive",
            "correction": "believe",
            "explanation": "Use 'ie' not 'ei' — i before e except after c.",
            "severity": "minor",
        },
        {
            "type": "word_choice",
            "original": "effects",
            "correction": "affects",
            "explanation": "Here affect (verb) is correct — it describes an action.",
            "severity": "moderate",
        },
        {
            "type": "spelling",
            "original": "writting",
            "correction": "writing",
            "explanation": "Only one 't' in writing.",
            "severity": "minor",
        },
    ]
    # return a subset based on type
    import random
    random.seed(hash(task_type))
    return random.sample(common, k=min(3, len(common)))


if __name__ == "__main__":
    asyncio.run(seed())
