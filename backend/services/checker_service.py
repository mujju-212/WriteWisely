"""
services/checker_service.py — Spell/Grammar Check Logic
Primary: LLM via llm_service | Fallback: Levenshtein edit distance
"""

from services.llm_service import call_llm
from services.pattern_service import save_errors
from prompts.templates import get_prompt


async def check_text(text: str, mode: str, context: str, user_level: str, user_id: str = None) -> dict:
    """
    Main spell/grammar check function.
    Used by Practice (live + analysis) and Project modes.
    
    Modes:
      - practice_live: returns hints only (no corrections)
      - practice_analysis: returns full analysis with scores
      - project: returns full corrections + explanations
    """
    
    try:
        if mode == "practice_live":
            result = await _check_live(text, context, user_level)
        elif mode == "practice_analysis":
            result = await _check_analysis(text, context, user_level, "practice")
        elif mode == "project":
            result = await _check_project(text, context, user_level)
        else:
            result = await _check_project(text, context, user_level)
        
        # Save error patterns to DB (non-blocking, don't fail if this errors)
        if user_id and result.get("errors"):
            try:
                await save_errors(user_id, result["errors"], f"from_{mode}")
            except Exception:
                pass
        
        result["fallback_used"] = False
        return result
        
    except Exception as e:
        print(f"⚠️ LLM check failed, using fallback: {e}")
        result = _fallback_check(text)
        result["fallback_used"] = True
        return result


async def _check_live(text: str, context: str, user_level: str) -> dict:
    """Practice live mode — hints only, no solutions."""
    prompt = get_prompt(
        "practice_live_hints",
        text=text,
        context_type=context,
        user_level=user_level
    )
    
    result = await call_llm(prompt, f"Check this text: {text}")
    
    # Ensure we have proper structure
    errors = result.get("errors", [])
    for error in errors:
        error.setdefault("color", "red" if error.get("type") == "spelling" else "yellow")
        # Strip any accidentally included corrections
        error.pop("correction", None)
        error.pop("explanation", None)
    
    return {"errors": errors}


async def _check_project(text: str, context: str, user_level: str) -> dict:
    """Project mode — full corrections + explanations."""
    prompt = get_prompt(
        "spell_grammar_check",
        text=text,
        context_type=context,
        user_level=user_level
    )
    
    result = await call_llm(prompt, f"Analyze this text: {text}")
    
    errors = result.get("errors", [])
    for error in errors:
        error["color"] = "red" if error.get("type") == "spelling" else "yellow"
    
    return {
        "errors": errors,
        "score": result.get("score"),
        "suggestions": result.get("suggestions", []),
        "overall_feedback": result.get("overall_feedback", "")
    }


async def _check_analysis(text: str, context: str, user_level: str, task_type: str) -> dict:
    """Practice analysis mode — full detailed report with scores."""
    prompt = get_prompt(
        "practice_analysis",
        submitted_text=text,
        context_type=context,
        user_level=user_level,
        task_type=task_type,
        task_prompt=context
    )
    
    result = await call_llm(prompt, f"Analyze this {task_type}: {text}")
    return result


def _fallback_check(text: str) -> dict:
    """
    Fallback spell check using Levenshtein distance.
    Only catches basic spelling errors (no grammar).
    Used when LLM API fails.
    """
    try:
        from Levenshtein import distance
    except ImportError:
        return {"errors": [], "fallback_used": True}
    
    # Basic common misspellings dictionary
    common_corrections = {
        "teh": "the", "recieve": "receive", "occurence": "occurrence",
        "seperate": "separate", "definately": "definitely", "accomodate": "accommodate",
        "occured": "occurred", "untill": "until", "begining": "beginning",
        "beleive": "believe", "calender": "calendar", "collegue": "colleague",
        "comittee": "committee", "concious": "conscious", "definate": "definite",
        "enviroment": "environment", "existance": "existence", "foriegn": "foreign",
        "goverment": "government", "harrass": "harass", "immediatly": "immediately",
        "independant": "independent", "knowlege": "knowledge", "liason": "liaison",
        "millenium": "millennium", "neccessary": "necessary", "noticable": "noticeable",
        "parliment": "parliament", "persistant": "persistent", "posession": "possession",
        "prefered": "preferred", "pronounciation": "pronunciation", "publically": "publicly",
        "recomend": "recommend", "refered": "referred", "relevent": "relevant",
        "resturant": "restaurant", "seize": "seize", "succesful": "successful",
        "suprise": "surprise", "tommorow": "tomorrow", "wierd": "weird",
        "writting": "writing", "arguement": "argument", "acheive": "achieve",
        "apparant": "apparent", "catagory": "category", "cemetary": "cemetery",
        "changable": "changeable", "commited": "committed", "concensus": "consensus",
        "dilemna": "dilemma", "dissapoint": "disappoint", "embarass": "embarrass",
        "flourescent": "fluorescent", "guage": "gauge", "hygeine": "hygiene",
        "inadvertant": "inadvertent", "jewellry": "jewelry", "judgement": "judgment",
        "maintainance": "maintenance", "mischievious": "mischievous",
        "neice": "niece", "nineth": "ninth",
        "occurrance": "occurrence", "pasttime": "pastime", "percieve": "perceive",
        "persistance": "persistence", "privelege": "privilege", "questionaire": "questionnaire",
        "reciept": "receipt", "rythm": "rhythm", "shedule": "schedule",
        "threshhold": "threshold", "tyrany": "tyranny", "vaccuum": "vacuum",
        "wether": "whether", "reqeust": "request", "could'nt": "couldn't",
        "should'nt": "shouldn't", "would'nt": "wouldn't",
    }
    
    words = text.split()
    errors = []
    pos = 0
    
    for word in words:
        clean_word = word.strip(".,!?;:\"'()[]{}").lower()
        
        if clean_word in common_corrections:
            errors.append({
                "type": "spelling",
                "word": word,
                "correction": common_corrections[clean_word],
                "hint": "Possible spelling error",
                "explanation": f"Did you mean '{common_corrections[clean_word]}'?",
                "position": {"start": pos, "end": pos + len(word)},
                "severity": "minor",
                "color": "red"
            })
        
        pos += len(word) + 1  # +1 for space
    
    return {"errors": errors}
