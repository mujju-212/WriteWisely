"""
routes/checker.py — Spell/Grammar Check Route
Shared by Practice (live) and Project modes
"""

from fastapi import APIRouter, Depends

from middleware.auth_middleware import get_current_user
from services.checker_service import check_text
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
    """
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
    
    return result
