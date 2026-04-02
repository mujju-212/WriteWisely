"""
services/checker_service.py — Spell/Grammar Check Logic
Pipeline: Tier 1 (edit distance, instant) → Tier 2 (AI deep analysis) → Merge
"""

import re

from services.llm_service import call_llm
from services.pattern_service import save_errors
from prompts.templates import get_prompt


def _norm_token(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (value or "").lower())


def _normalize_error_type(value: str) -> str:
    raw = (value or "grammar").strip().lower().replace(" ", "_")
    allowed = {"spelling", "grammar", "punctuation", "word_choice", "style"}
    return raw if raw in allowed else "grammar"


def _find_word_span(text: str, word: str, taken_spans: list[tuple[int, int]]) -> tuple[int, int] | None:
    """Find a non-overlapping span for `word` in `text` using word boundaries."""
    if not text or not word:
        return None

    word_clean = _norm_token(word)
    if not word_clean:
        return None

    for m in re.finditer(r"\b{}\b".format(re.escape(word_clean)), text.lower()):
        start, end = m.start(), m.end()
        overlaps = any(start < t_end and end > t_start for t_start, t_end in taken_spans)
        if not overlaps:
            return start, end

    # Fallback: substring lookup without boundaries
    idx = text.lower().find(word_clean)
    if idx >= 0:
        start, end = idx, idx + len(word_clean)
        overlaps = any(start < t_end and end > t_start for t_start, t_end in taken_spans)
        if not overlaps:
            return start, end

    return None


def _normalize_error_positions(text: str, errors: list) -> list:
    """Ensure all errors have sane character positions mapped to the actual text."""
    if not errors:
        return []

    normalized = []
    taken_spans: list[tuple[int, int]] = []
    text_len = len(text)

    for err in errors:
        e = dict(err)
        etype = _normalize_error_type(e.get("type", "grammar"))
        e["type"] = etype
        e["color"] = "red" if etype == "spelling" else "yellow"

        word = (e.get("word") or e.get("original") or "").strip()
        pos = e.get("position") or {}
        start = pos.get("start")
        end = pos.get("end")

        has_valid_position = (
            isinstance(start, int)
            and isinstance(end, int)
            and 0 <= start < end <= text_len
        )

        if has_valid_position and word:
            slice_clean = _norm_token(text[start:end])
            word_clean = _norm_token(word)
            if slice_clean != word_clean:
                has_valid_position = False

        if not has_valid_position:
            span = _find_word_span(text, word, taken_spans)
            if span:
                start, end = span
                has_valid_position = True
            elif isinstance(start, int) and isinstance(end, int):
                # Clamp to valid range as a last resort.
                s = max(0, min(start, max(0, text_len - 1)))
                e_pos = max(s + 1, min(end, text_len))
                start, end = s, e_pos
                has_valid_position = True

        if has_valid_position:
            e["position"] = {"start": start, "end": end}
            taken_spans.append((start, end))

        normalized.append(e)

    # Deduplicate by error type + word + position.
    deduped = _dedupe_errors(normalized)
    return deduped


def _dedupe_errors(errors: list) -> list:
    """Deduplicate errors by type + normalized word + position."""
    deduped = []
    seen = set()
    for e in errors:
        pos = e.get("position") or {}
        key = (
            e.get("type", "grammar"),
            (e.get("word") or e.get("original") or "").strip().lower(),
            pos.get("start"),
            pos.get("end"),
        )
        if key in seen:
            continue
        seen.add(key)
        deduped.append(e)

    return deduped


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

        # Normalize AI positions before merging so frontend highlights line up.
        result["errors"] = _normalize_error_positions(text, result.get("errors", []))

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
    - Deduplication by word-text overlap (not just start char)
    """
    ai_errors = ai_result.get("errors", [])

    # Build set of character positions already covered by AI errors.
    # Positions are end-exclusive.
    ai_covered = set()
    for err in ai_errors:
        pos = err.get("position") or {}
        start = pos.get("start", -1)
        end   = pos.get("end", -1)
        if start >= 0 and end > start:
            for i in range(start, end):
                ai_covered.add(i)

    # Add Tier 1 errors only where AI has no overlap
    merged = list(ai_errors)
    for t1 in tier1_errors:
        pos   = t1.get("position") or {}
        start = pos.get("start", -1)
        end   = pos.get("end", start)
        if start < 0:
            continue
        # Skip if any character in this word is already covered by AI
        word_range = set(range(start, end))
        if word_range & ai_covered:
            continue
        # Not covered — add it
        if mode == "practice_live":
            merged.append({
                "type": "spelling",
                "word": t1.get("word", ""),
                "hint": "Check the spelling of this word",
                "correction": t1.get("correction", ""),
                "position": pos,
                "color": "red"
            })
        else:
            merged.append(t1)

    ai_result["errors"] = _dedupe_errors(merged)
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
        etype = _normalize_error_type(error.get("type", "grammar"))
        error["type"] = etype
        error["color"] = "red" if etype == "spelling" else "yellow"
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
        etype = _normalize_error_type(error.get("type", "grammar"))
        error["type"] = etype
        error["color"] = "red" if etype == "spelling" else "yellow"

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
    Tier 1: Dictionary-based spell check.
    Runs instantly (<5ms). Catches common typos.
    Positions are measured by scanning the original string so multi-space
    gaps, newlines, and punctuation don't throw offsets off.
    """
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
        "mispell": "misspell", "missle": "missile",
        "narative": "narrative", "naturaly": "naturally", "negociate": "negotiate",
        "nervious": "nervous", "occaisional": "occasional",
        "ommit": "omit", "oppertunity": "opportunity", "oposition": "opposition",
        "origional": "original", "paramter": "parameter", "particuarly": "particularly",
        "penninsula": "peninsula", "percentige": "percentage", "permenant": "permanent",
        "personaly": "personally", "phenominon": "phenomenon", "playwrite": "playwright",
        "posible": "possible", "practicle": "practical", "predjudice": "prejudice",
        "preperation": "preparation", "presense": "presence", "preveous": "previous",
        "princapal": "principal", "proably": "probably", "professionaly": "professionally",
        "propably": "probably", "purposly": "purposely",
        "reccomend": "recommend", "relavant": "relevant",
        "religous": "religious", "repitition": "repetition", "responsable": "responsible",
        "rediculous": "ridiculous", "scedule": "schedule", "senstive": "sensitive",
        "similer": "similar", "sincerly": "sincerely",
        "souviner": "souvenir", "specifly": "specify",
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
        "wonderfull": "wonderful", "yesturday": "yesterday",
    }

    STRIP_CHARS = ".,!?;:\"'()[]{}\u2013\u2014-"
    errors = []
    scan_pos = 0  # current char position in the ORIGINAL string

    # Split on whitespace but keep track of real positions in original text
    import re
    for match in re.finditer(r'\S+', text):
        raw_word = match.group()          # e.g. "teh,"
        word_start = match.start()        # real offset in original string

        # Strip surrounding punctuation for dictionary lookup only
        clean = raw_word.strip(STRIP_CHARS).lower()
        if not clean:
            continue

        if clean in common_corrections:
            # Find where the clean word starts within raw_word (skip leading punct)
            leading_stripped = len(raw_word) - len(raw_word.lstrip(STRIP_CHARS))
            err_start = word_start + leading_stripped
            err_end   = err_start + len(clean)   # end = first char AFTER the word

            errors.append({
                "type": "spelling",
                "word": clean,          # the misspelled word (no punctuation)
                "correction": common_corrections[clean],
                "hint": f"Did you mean \u2018{common_corrections[clean]}\u2019?",
                "explanation": f"\u2018{clean}\u2019 is misspelled. The correct spelling is \u2018{common_corrections[clean]}\u2019.",
                "position": {"start": err_start, "end": err_end},
                "severity": "minor",
                "color": "red"
            })

    return {"errors": errors}
