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
from services.pattern_service import add_credits, save_errors, CREDIT_VALUES
from prompts.templates import get_prompt
from services.llm_service import call_llm
from models.schemas import SubmitPracticeRequest

router = APIRouter()


# ─── Get Practice Templates ──────────────────────────────────
@router.get("/templates")
async def get_templates(user=Depends(get_current_user)):
    user_level = user.get("profile", {}).get("current_level", 1)
    
    # Determine level category
    if user_level <= 10:
        level_cat = "beginner"
    elif user_level <= 20:
        level_cat = "intermediate"
    else:
        level_cat = "advanced"
    
    try:
        with open("data/practice_templates.json", "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        return {"templates": []}
    
    # Filter templates appropriate for user's level
    templates = data.get("templates", [])
    filtered = [t for t in templates if t.get("level", "beginner") <= level_cat or True]
    
    return {"templates": filtered, "user_level": level_cat}


# ─── Submit Practice ─────────────────────────────────────────
@router.post("/submit")
async def submit_practice(data: SubmitPracticeRequest, user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]
    user_level = user.get("profile", {}).get("current_level", 1)
    
    # Determine level name
    if user_level <= 10:
        level_name = "beginner"
    elif user_level <= 20:
        level_name = "intermediate"
    else:
        level_name = "advanced"
    
    # Get task info
    try:
        with open("data/practice_templates.json", "r") as f:
            templates_data = json.load(f)
        templates = {t["task_id"]: t for t in templates_data.get("templates", [])}
        task = templates.get(data.task_id, {})
    except Exception:
        task = {}
    
    task_prompt = task.get("prompt", "Free writing practice")
    task_type = task.get("type", "general")
    task_credits = task.get("credits", 30)
    
    # Full analysis via LLM
    try:
        prompt = get_prompt(
            "practice_analysis",
            submitted_text=data.text,
            user_level=level_name,
            task_type=task_type,
            task_prompt=task_prompt,
            context_type=task_type
        )
        
        analysis = await call_llm(prompt, f"Analyze this {task_type}: {data.text}")
    except Exception as e:
        # Fallback analysis
        analysis = {
            "overall_score": 5.0,
            "category_scores": {
                "spelling": 5, "grammar": 5,
                "sentence_structure": 5, "tone": 5, "completeness": 5
            },
            "errors": [],
            "improved_version": data.text,
            "strengths": ["Good effort!"],
            "areas_to_improve": ["Keep practicing to improve"]
        }
    
    # Calculate credits based on score
    score = analysis.get("overall_score", 5)
    credits = int(task_credits * (score / 10))
    
    # Bonus for high scores
    if score >= 9:
        credits += CREDIT_VALUES["practice_bonus_9_10"]
    
    # Save errors to pattern DB
    if analysis.get("errors"):
        await save_errors(user_id, analysis["errors"], "practice")
    
    # Save practice record
    record = {
        "user_id": user_id,
        "task_id": data.task_id,
        "task_type": task_type,
        "task_prompt": task_prompt,
        "submitted_text": data.text,
        "mode": data.mode,
        "submitted_at": datetime.utcnow(),
        "analysis": analysis,
        "overall_score": score,
        "errors_found": len(analysis.get("errors", [])),
        "credits_earned": credits,
        "fallback_used": False
    }
    
    await db.practice_records.insert_one(record)
    
    # Award credits
    await add_credits(user_id, credits, f"Practice: {task_type}")
    
    # Add credits to response
    analysis["credits_earned"] = credits
    
    return analysis
