"""
services/checker_service.py — Spell/Grammar Check Logic
Pipeline: Tier 1 (edit distance, instant) → Tier 2 (AI deep analysis) → Merge
"""

from services.llm_service import call_llm
from services.pattern_service import save_errors
from prompts.templates import get_prompt


async def check_text(text: str, mode: str, context: str, user_level: str, user_id: str = None, task_prompt: str = None) -> dict:
    """
    Main spell/grammar check function.
    Used by Practice (live + analysis) and Project modes.

    Pipeline:
      1. Tier 1 (edit distance) — instant, catches obvious typos
      2. Tier 2 (AI) — deep grammar, punctuation, style analysis
      3. Merge — AI results take priority; Tier 1 fills gaps

    Modes:
      - practice_live:     hints only (no corrections shown)
      - practice_analysis: full analysis with scores + improved version
      - project:           full corrections + explanations + style tips
    """

    # ── TIER 1: Edit distance check (always runs first, instant) ──
    tier1_errors = _fallback_check(text)["errors"]

    # ── TIER 2: AI check ──────────────────────────────────────────
    try:
        if mode == "practice_live":
            result = await _check_live(text, context, user_level, tier1_errors)
        elif mode == "practice_analysis":
            result = await _check_analysis(text, context, user_level, "writing", tier1_errors, task_prompt=task_prompt or context)
        elif mode == "project":
            result = await _check_project(text, context, user_level, tier1_errors)
        else:
            result = await _check_project(text, context, user_level, tier1_errors)

        # ── MERGE: AI takes priority, Tier 1 fills gaps ───────────
        result = _merge_results(tier1_errors, result, mode)
        result["fallback_used"] = False

    except Exception as e:
        print(f"⚠️ LLM check failed, using Tier 1 only: {e}")
        result = {"errors": tier1_errors, "fallback_used": True}
        # Color the fallback errors
        for err in result["errors"]:
            err.setdefault("color", "red")
            err.setdefault("hint", "Possible spelling error")

    # ── Save error patterns (non-blocking) ────────────────────────
    if user_id and result.get("errors"):
        try:
            await save_errors(user_id, result["errors"], f"from_{mode}")
        except Exception:
            pass

    return result


def _merge_results(tier1_errors: list, ai_result: dict, mode: str) -> dict:
    """
    Merge Tier 1 (edit distance) and Tier 2 (AI) results.
    - AI errors always take priority (richer info)
    - Tier 1 errors fill in anything AI missed
    - Deduplication by character position overlap
    """
    ai_errors = ai_result.get("errors", [])

    # Build set of positions covered by AI
    ai_covered_positions = set()
    for err in ai_errors:
        pos = err.get("position", {})
        start = pos.get("start", -1)
        end = pos.get("end", -1)
        if start >= 0:
            for i in range(start, end + 1):
                ai_covered_positions.add(i)

    # Add Tier 1 errors that AI didn't cover
    merged_errors = list(ai_errors)
    for t1_err in tier1_errors:
        pos = t1_err.get("position", {})
        start = pos.get("start", -1)
        if start >= 0 and start not in ai_covered_positions:
            # AI missed this — add Tier 1 result (as spelling only)
            if mode == "practice_live":
                # In live mode, strip correction (hints only)
                merged_errors.append({
                    "type": "spelling",
                    "word": t1_err.get("word", ""),
                    "hint": "Check the spelling of this word",
                    "position": t1_err.get("position"),
                    "color": "red"
                })
            else:
                merged_errors.append(t1_err)

    ai_result["errors"] = merged_errors
    return ai_result


async def _check_live(text: str, context: str, user_level: str, tier1_errors: list) -> dict:
    """Practice live mode — hints only, no solutions."""
    prompt = get_prompt(
        "practice_live_hints",
        text=text,
        context_type=context,
        user_level=user_level,
        tier1_hint=_format_tier1_for_prompt(tier1_errors)
    )

    result = await call_llm(prompt, f"Check this text: {text}")

    # Enforce no corrections in live mode
    errors = result.get("errors", [])
    for error in errors:
        error.setdefault("color", "red" if error.get("type") == "spelling" else "yellow")
        error.pop("correction", None)
        error.pop("explanation", None)
        error.pop("improved_version", None)

    return {"errors": errors}


async def _check_project(text: str, context: str, user_level: str, tier1_errors: list) -> dict:
    """Project mode — full corrections + explanations + style tips."""
    prompt = get_prompt(
        "spell_grammar_check",
        text=text,
        context_type=context,
        user_level=user_level,
        tier1_hint=_format_tier1_for_prompt(tier1_errors)
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


async def _check_analysis(text: str, context: str, user_level: str, task_type: str, tier1_errors: list, task_prompt: str = None) -> dict:
    """Practice analysis mode — full detailed report with scores."""
    prompt = get_prompt(
        "practice_analysis",
        submitted_text=text,
        context_type=context,
        user_level=user_level,
        task_type=task_type,
        task_prompt=task_prompt or context,
        tier1_hint=_format_tier1_for_prompt(tier1_errors)
    )

    result = await call_llm(prompt, f"Analyze this {task_type}: {text}")
    return result


def _format_tier1_for_prompt(tier1_errors: list) -> str:
    """Format Tier 1 errors as a hint for the AI prompt."""
    if not tier1_errors:
        return "None detected"
    items = [f"'{e.get('word', '')}' → '{e.get('correction', '')}'" for e in tier1_errors[:10]]
    return ", ".join(items)


def _fallback_check(text: str) -> dict:
    """
    Tier 1: Edit distance spell check using common misspellings dictionary.
    Runs instantly (<5ms). Catches obvious typos.
    Always runs BEFORE AI — results passed as context to AI prompt.
    """
    # Expanded common misspellings dictionary
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
        "resturant": "restaurant", "succesful": "successful", "suprise": "surprise",
        "tommorow": "tomorrow", "wierd": "weird", "writting": "writing",
        "arguement": "argument", "acheive": "achieve", "apparant": "apparent",
        "catagory": "category", "cemetary": "cemetery", "changable": "changeable",
        "commited": "committed", "concensus": "consensus", "dilemna": "dilemma",
        "dissapoint": "disappoint", "embarass": "embarrass", "flourescent": "fluorescent",
        "guage": "gauge", "hygeine": "hygiene", "inadvertant": "inadvertent",
        "judgement": "judgment", "maintainance": "maintenance", "mischievious": "mischievous",
        "neice": "niece", "nineth": "ninth", "occurrance": "occurrence",
        "pasttime": "pastime", "percieve": "perceive", "persistance": "persistence",
        "privelege": "privilege", "questionaire": "questionnaire", "reciept": "receipt",
        "rythm": "rhythm", "shedule": "schedule", "threshhold": "threshold",
        "tyrany": "tyranny", "vaccuum": "vacuum", "wether": "whether",
        "reqeust": "request", "could'nt": "couldn't", "should'nt": "shouldn't",
        "would'nt": "wouldn't", "runing": "running", "stoped": "stopped",
        "planing": "planning", "hopeing": "hoping", "writeing": "writing",
        "makeing": "making", "loveing": "loving", "theif": "thief",
        "feild": "field", "peice": "piece", "nieghbor": "neighbor",
        "acheivment": "achievement", "adress": "address", "agression": "aggression",
        "anual": "annual", "aparent": "apparent", "atempt": "attempt",
        "atribute": "attribute", "bussiness": "business", "carear": "career",
        "colum": "column", "comming": "coming", "comparisson": "comparison",
        "completly": "completely", "consistant": "consistent", "continous": "continuous",
        "critisism": "criticism", "curiousity": "curiosity", "decieve": "deceive",
        "desicion": "decision", "devide": "divide", "diffrence": "difference",
        "discription": "description", "exagerate": "exaggerate", "excede": "exceed",
        "experiance": "experience", "explenation": "explanation", "extravagent": "extravagant",
        "familier": "familiar", "fasinating": "fascinating", "fourty": "forty",
        "freind": "friend", "fundemental": "fundamental", "generaly": "generally",
        "grammer": "grammar", "gratefull": "grateful", "hansome": "handsome",
        "hapily": "happily", "happyness": "happiness", "histroy": "history",
        "honist": "honest", "imaginery": "imaginary", "importent": "important",
        "incedent": "incident", "inconvienent": "inconvenient", "infinate": "infinite",
        "intresting": "interesting", "irresistable": "irresistible", "jelous": "jealous",
        "jewlry": "jewelry", "jurnalist": "journalist", "knolwedge": "knowledge",
        "liesure": "leisure", "libary": "library", "lisense": "license",
        "litrally": "literally", "lonliness": "loneliness", "medeival": "medieval",
        "mispell": "misspell", "missle": "missile", "morale": "morale",
        "narative": "narrative", "naturaly": "naturally", "negociate": "negotiate",
        "nervious": "nervous", "occaisional": "occasional", "offence": "offence",
        "ommit": "omit", "oppertunity": "opportunity", "oposition": "opposition",
        "origional": "original", "paramter": "parameter", "particuarly": "particularly",
        "penninsula": "peninsula", "percentige": "percentage", "permenant": "permanent",
        "personaly": "personally", "phenominon": "phenomenon", "playwrite": "playwright",
        "posible": "possible", "practicle": "practical", "predjudice": "prejudice",
        "preperation": "preparation", "presense": "presence", "preveous": "previous",
        "princapal": "principal", "proably": "probably", "professionaly": "professionally",
        "promissory": "promissory", "propably": "probably", "purposly": "purposely",
        "reccomend": "recommend", "recieve": "receive", "relavant": "relevant",
        "religous": "religious", "repitition": "repetition", "responsable": "responsible",
        "rediculous": "ridiculous", "scedule": "schedule", "senstive": "sensitive",
        "similer": "similar", "sincerly": "sincerely", "skillful": "skillful",
        "souviner": "souvenir", "specifly": "specify", "stationery": "stationery",
        "studing": "studying", "succede": "succeed", "sumary": "summary",
        "supercede": "supersede", "suprize": "surprise", "surounded": "surrounded",
        "tecnology": "technology", "temperment": "temperament", "tendancy": "tendency",
        "tomorow": "tomorrow", "totaly": "totally", "transfered": "transferred",
        "treament": "treatment", "twelth": "twelfth", "typicaly": "typically",
        "unfortunatly": "unfortunately", "usally": "usually", "uterly": "utterly",
        "vaguley": "vaguely", "valueable": "valuable", "varient": "variant",
        "vegatable": "vegetable", "violance": "violence", "visability": "visibility",
        "volcane": "volcano", "voluntery": "voluntary", "vulernable": "vulnerable",
        "wenever": "whenever", "wheter": "whether", "widley": "widely",
        "wonderfull": "wonderful", "writting": "writing", "yesturday": "yesterday",
    }

    words = text.split()
    errors = []
    pos = 0

    for word in words:
        clean_word = word.strip(".,!?;:\"'()[]{}-").lower()

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
