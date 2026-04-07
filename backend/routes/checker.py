"""
routes/checker.py — Spell/Grammar Check Route
Shared by Practice (live) and Project modes
Now with explanations, fallback mechanism, and intelligent error detection
"""

from fastapi import APIRouter, Depends

from config import get_db
from middleware.auth_middleware import get_current_user
from services.checker_service import check_text
from services.explanation_engine import ExplanationEngine
from services.fallback_mechanism import EditDistanceSpellChecker
from models.schemas import CheckTextRequest

router = APIRouter()


@router.post("/check")
async def check_text_endpoint(data: CheckTextRequest, user=Depends(get_current_user)):
    """
    Check text for spelling and grammar errors.
    
    Modes:
      - practice_live: hints only (red/yellow underlines, no solutions)
      - practice_analysis: full detailed analysis with scores
      - project: full corrections + explanations + style tips
    
    Now enhanced with:
    - Smart error detection and explanation
    - Fallback spell checking for robustness
    - WHAT/WHY/HOW explanations for errors
    """
    db = get_db()
    user_level = user.get("profile", {}).get("current_level", 1)
    
    if user_level <= 10:
        level_name = "beginner"
    elif user_level <= 20:
        level_name = "intermediate"
    else:
        level_name = "advanced"
    
    result = await check_text(
        text=data.text,
        mode=data.mode,
        context=data.context,
        user_level=level_name,
        user_id=user["id"]
    )
    
    # Enhance errors with explanations for project mode
    if data.mode == "project" and result.get("errors"):
        explanation_engine = ExplanationEngine(db)
        for error in result["errors"]:
            if not error.get("explanation_details"):
                explanation = await explanation_engine.generate_explanation(
                    error_type=error.get("type", "unknown"),
                    error_text=error.get("text", ""),
                    correction=error.get("correction", ""),
                    context=data.text
                )
                error["explanation_details"] = explanation
    
    # Use fallback checker if no errors found but in live mode
    if data.mode == "practice_live" and (not result.get("errors") or len(result.get("errors", [])) == 0):
        fallback = EditDistanceSpellChecker()
        words = data.text.split()
        fallback_errors = []
        for word in words[:10]:  # Check first 10 words only for performance
            check_result = fallback.check_word(word)
            if not check_result.get("is_correct") and check_result.get("suggestions"):
                fallback_errors.append({
                    "type": "spelling",
                    "text": word,
                    "correction": check_result["suggestions"][0],
                    "confidence": 0.7
                })
        if fallback_errors:
            result["errors"] = fallback_errors
            result["used_fallback"] = True
    
    return result
