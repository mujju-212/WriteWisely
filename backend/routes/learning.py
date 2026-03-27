"""
routes/learning.py — Learning Mode Routes
Levels, Lessons, Quizzes, Assignments
"""

from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
import json
import os

from config import get_db
from middleware.auth_middleware import get_current_user
from services.pattern_service import add_credits, save_errors, create_notification, CREDIT_VALUES
from services.checker_service import check_text
from models.schemas import SubmitQuizRequest, SubmitAssignmentRequest

router = APIRouter()

LESSONS_DIR = "data/lessons"
QUIZZES_DIR = "data/quizzes"


# ─── Get All Levels ───────────────────────────────────────────
@router.get("/levels")
async def get_all_levels(user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]
    user_level = user.get("profile", {}).get("current_level", 1)
    
    # Load all lesson files
    levels = []
    for i in range(1, 31):
        filename = f"{LESSONS_DIR}/level_{i:02d}.json"
        
        level_data = {"level_id": i, "title": f"Level {i}", "topic": "", "category": "beginner"}
        
        if os.path.exists(filename):
            try:
                with open(filename, "r") as f:
                    data = json.load(f)
                level_data["title"] = data.get("title", f"Level {i}")
                level_data["topic"] = data.get("topic", "")
                level_data["category"] = data.get("category", "beginner")
            except Exception:
                pass
        
        # Get user's progress for this level
        progress = await db.learning_progress.find_one(
            {"user_id": user_id, "level_number": i}
        )
        
        if progress:
            level_data["status"] = progress.get("status", "available")
            level_data["score"] = progress.get("assignment", {}).get("score")
            level_data["credits_earned"] = progress.get("credits_earned", 0)
        elif i <= user_level:
            level_data["status"] = "available"
        elif i == user_level + 1:
            level_data["status"] = "available"
        else:
            level_data["status"] = "locked"
        
        # Categorize
        if i <= 10:
            level_data["category"] = "beginner"
        elif i <= 20:
            level_data["category"] = "intermediate"
        else:
            level_data["category"] = "advanced"
        
        levels.append(level_data)
    
    return {"levels": levels}


# ─── Get Single Lesson ────────────────────────────────────────
@router.get("/levels/{level_id}")
async def get_lesson(level_id: int, user=Depends(get_current_user)):
    filename = f"{LESSONS_DIR}/level_{level_id:02d}.json"
    
    if not os.path.exists(filename):
        raise HTTPException(status_code=404, detail=f"Lesson {level_id} not found")
    
    with open(filename, "r") as f:
        lesson = json.load(f)
    
    # Mark as in_progress if not already
    db = get_db()
    await db.learning_progress.update_one(
        {"user_id": user["id"], "level_number": level_id},
        {
            "$setOnInsert": {
                "user_id": user["id"],
                "level_number": level_id,
                "topic": lesson.get("topic", ""),
                "status": "in_progress",
                "started_at": datetime.utcnow(),
                "quiz_scores": [],
                "assignment": {},
                "credits_earned": 0
            }
        },
        upsert=True
    )
    
    # Load quiz questions (from separate quiz file or lesson file)
    quiz_questions = []
    quiz_file = f"{QUIZZES_DIR}/quiz_{level_id:02d}.json"
    if os.path.exists(quiz_file):
        with open(quiz_file, "r") as f:
            quiz_data = json.load(f)
        quiz_questions = quiz_data.get("questions", [])
    elif "quiz" in lesson:
        quiz_questions = lesson.get("quiz", {}).get("questions", [])

    # Get current progress to include in response
    progress = await db.learning_progress.find_one(
        {"user_id": user["id"], "level_number": level_id}
    ) or {}

    return {
        "lesson": lesson,
        "quiz": {"questions": quiz_questions},
        "progress": {
            "lesson_read": progress.get("lesson_read", False),
            "quiz_completed": bool(progress.get("quiz_scores")),
            "quiz_score": progress.get("quiz_scores", [{}])[-1].get("score", 0) if progress.get("quiz_scores") else 0,
            "quiz_total": progress.get("quiz_scores", [{}])[-1].get("total", 0) if progress.get("quiz_scores") else 0,
            "assignment_submitted": progress.get("assignment", {}).get("submitted", False),
            "assignment_score": progress.get("assignment", {}).get("score", 0),
            "assignment_total": progress.get("assignment", {}).get("total", 0),
            "assignment_review": progress.get("assignment", {}).get("review", []),
            "credits_earned": progress.get("credits_earned", 0),
            "status": progress.get("status", "in_progress"),
        }
    }


# ─── Mark Lesson Read ─────────────────────────────────────────
@router.post("/lesson/{level_id}/complete")
async def mark_lesson_read(level_id: int, user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]

    # Check if already marked read (no double credit)
    progress = await db.learning_progress.find_one(
        {"user_id": user_id, "level_number": level_id}
    )

    if progress and progress.get("lesson_read"):
        return {
            "message": "Lesson already marked as read",
            "credits_earned": 0,
            "progress": {"lesson_read": True}
        }

    credits = CREDIT_VALUES.get("lesson_complete", 10)

    await db.learning_progress.update_one(
        {"user_id": user_id, "level_number": level_id},
        {
            "$set": {"lesson_read": True},
            "$inc": {"credits_earned": credits},
            "$setOnInsert": {
                "user_id": user_id,
                "level_number": level_id,
                "status": "in_progress",
                "started_at": datetime.utcnow(),
                "quiz_scores": [],
                "assignment": {},
            }
        },
        upsert=True
    )

    await add_credits(user_id, credits, f"Lesson Read Level {level_id}")

    return {
        "message": "Lesson marked as read",
        "credits_earned": credits,
        "progress": {"lesson_read": True}
    }


# ─── Submit Quiz ──────────────────────────────────────────────
@router.post("/quiz/{level_id}")
async def submit_quiz(level_id: int, data: SubmitQuizRequest, user=Depends(get_current_user)):
    db = get_db()
    
    # Load quiz answers
    quiz_file = f"{QUIZZES_DIR}/quiz_{level_id:02d}.json"
    if not os.path.exists(quiz_file):
        # Try loading from lesson file
        lesson_file = f"{LESSONS_DIR}/level_{level_id:02d}.json"
        if not os.path.exists(lesson_file):
            raise HTTPException(status_code=404, detail="Quiz not found")
        with open(lesson_file, "r") as f:
            lesson = json.load(f)
        quiz_questions = lesson.get("quiz", {}).get("questions", [])
    else:
        with open(quiz_file, "r") as f:
            quiz_data = json.load(f)
        quiz_questions = quiz_data.get("questions", [])
    
    questions_map = {q["id"]: q for q in quiz_questions}
    
    # Score
    results = []
    correct_count = 0
    
    for answer in data.answers:
        q = questions_map.get(answer.question_id)
        if not q:
            continue
        
        is_correct = answer.selected == q["correct"]
        if is_correct:
            correct_count += 1
        
        results.append({
            "question_id": answer.question_id,
            "selected": answer.selected,
            "correct": q["correct"],
            "is_correct": is_correct,
            "explanation": q.get("explanation", "")
        })
    
    total = len(results)
    score_pct = (correct_count / total * 100) if total > 0 else 0
    
    # Calculate credits
    credits = 0
    if score_pct >= 70:
        credits = CREDIT_VALUES["quiz_pass"]
    if score_pct == 100:
        credits = CREDIT_VALUES["quiz_perfect"]
    
    # Save to DB
    quiz_record = {
        "quiz_id": f"quiz_{level_id}",
        "score": correct_count,
        "total": total,
        "time_taken_sec": 0
    }
    
    await db.learning_progress.update_one(
        {"user_id": user["id"], "level_number": level_id},
        {
            "$push": {"quiz_scores": quiz_record},
            "$inc": {"credits_earned": credits}
        }
    )
    
    if credits > 0:
        await add_credits(user["id"], credits, f"Quiz Level {level_id}")
    
    return {
        "results": results,
        "score": correct_count,
        "total": total,
        "percentage": round(score_pct),
        "credits_earned": credits,
        "passed": score_pct >= 70
    }


# ─── Submit Assignment ────────────────────────────────────────
@router.post("/assignment/{level_id}")
async def submit_assignment(level_id: int, data: SubmitAssignmentRequest, user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]
    user_level = user.get("profile", {}).get("current_level", 1)
    existing_progress = await db.learning_progress.find_one({"user_id": user_id, "level_number": level_id})
    was_completed = bool(existing_progress and existing_progress.get("status") == "completed")
    
    # Determine level name
    if user_level <= 10:
        level_name = "beginner"
    elif user_level <= 20:
        level_name = "intermediate"
    else:
        level_name = "advanced"
    
    # Use checker service to analyze the assignment
    analysis = await check_text(
        text=data.text,
        mode="practice_analysis",
        context="assignment",
        user_level=level_name,
        user_id=user_id
    )
    
    # Calculate score
    errors = analysis.get("errors", [])
    # Simple scoring: fewer errors = higher score
    sentences = [s.strip() for s in data.text.split('.') if s.strip()]
    total = max(len(sentences), 1)
    error_count = len(errors)
    correct = max(total - error_count, 0)
    
    # Build review
    review = []
    for error in errors:
        review.append({
            "sentence": error.get("original", ""),
            "correct": False,
            "error": f"{error.get('original', '')} → {error.get('correction', '')}",
            "explanation": error.get("explanation", "")
        })
    
    # Calculate credits
    credits = CREDIT_VALUES["submit_assignment"]
    if error_count == 0:
        credits = CREDIT_VALUES["perfect_assignment"]
    
    # Save to DB
    assignment_record = {
        "submitted": True,
        "text": data.text,
        "score": correct,
        "total": total,
        "review": review,
        "submitted_at": datetime.utcnow()
    }
    
    await db.learning_progress.update_one(
        {"user_id": user_id, "level_number": level_id},
        {
            "$set": {
                "assignment": assignment_record,
                "status": "completed",
                "completed_at": datetime.utcnow()
            },
            "$inc": {"credits_earned": credits}
        }
    )
    
    # Update user level if they completed this one
    if level_id >= user_level:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"profile.current_level": level_id + 1}}
        )
    
    await add_credits(user_id, credits, f"Assignment Level {level_id}")

    if not was_completed:
        topic = (
            (existing_progress or {}).get("topic")
            or f"Level {level_id}"
        )
        await create_notification(
            user_id=user_id,
            notif_type="level_complete",
            title="✅ Level Completed!",
            message=f"You completed Level {level_id}: {topic}. +{credits} credits earned!",
            icon="✅",
            action_url="/learn",
            metadata={"level": level_id, "credits": credits},
        )
    
    return {
        "review": review,
        "score": correct,
        "total": total,
        "credits_earned": credits,
        "analysis": analysis
    }
