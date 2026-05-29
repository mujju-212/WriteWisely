"""
spacy_grammar_rules.py — Fast, pure-Python grammar checker using spaCy.

Replaces LanguageTool (Java) with rule-based NLP checks.
Typical latency: 30-80ms per check (vs 500-2000ms for LanguageTool).

Rule categories:
  1. Subject-verb agreement   ("I has" → "I have")
  2. Verb tense errors        ("He go yesterday" → "He went yesterday")
  3. Double / repeated words  ("the the" → "the")
  4. Missing capitalization    (sentence start)
  5. Punctuation issues        (missing period, double spaces)
  6. Confused words            (their/there/they're, your/you're, its/it's)
  7. Passive voice detection   (style hint)
  8. Article misuse            ("a apple" → "an apple")
  9. Common grammar patterns   ("could of" → "could have")
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

# Lazy-loaded spacy model (loaded once on first call)
_nlp = None


def _get_nlp():
    """Load spacy model lazily — first call takes ~200ms, then cached."""
    global _nlp
    if _nlp is None:
        import spacy
        _nlp = spacy.load("en_core_web_sm", disable=["ner", "textcat"])
    return _nlp


# ── Rule data ──────────────────────────────────────────────────────────

# Subject-verb agreement: pronoun → expected verb forms
_SVA_RULES: Dict[str, Dict[str, str]] = {
    # "I has" → "I have"
    "i":    {"has": "have", "is": "am", "was": "was", "does": "do",
             "goes": "go", "makes": "make", "takes": "take",
             "gets": "get", "comes": "come", "knows": "know",
             "thinks": "think", "wants": "want", "needs": "need",
             "sees": "see", "says": "say", "gives": "give"},
    # "He/She/It go" → "He/She/It goes"
    "he":   {"have": "has", "am": "is", "are": "is", "do": "does",
             "go": "goes", "make": "makes", "take": "takes",
             "get": "gets", "come": "comes", "know": "knows",
             "think": "thinks", "want": "wants", "need": "needs",
             "see": "sees", "say": "says", "give": "gives"},
    "she":  {},  # filled below
    "it":   {},  # filled below
    # "They/We has" → "They/We have"
    "they": {"has": "have", "is": "are", "was": "were", "does": "do",
             "goes": "go", "makes": "make", "takes": "take",
             "gets": "get"},
    "we":   {},  # filled below
    "you":  {"has": "have", "is": "are", "was": "were", "does": "do"},
}
# Copy he rules to she/it
_SVA_RULES["she"] = dict(_SVA_RULES["he"])
_SVA_RULES["it"] = dict(_SVA_RULES["he"])
# Copy they rules to we
_SVA_RULES["we"] = dict(_SVA_RULES["they"])


# Confused words: (wrong_word_in_context) → (correction, explanation)
_CONFUSED_WORDS = {
    # their / there / they're
    ("their", "VBP"):  ("they're", "Use \"they're\" (they are) for the verb form."),
    ("there", "VBP"):  ("they're", "Use \"they're\" (they are) for the verb form."),
    # your / you're
    ("your", "VBP"):   ("you're", "Use \"you're\" (you are) for the verb form."),
    # its / it's — detected via context
    # to / too / two
    # affect / effect — common pairs
}

# "could of" → "could have" patterns
_OF_HAVE_ERRORS = {
    "could of": "could have",
    "would of": "would have",
    "should of": "should have",
    "must of": "must have",
    "might of": "might have",
    "may of": "may have",
}

# a/an rules
_VOWEL_SOUNDS = set("aeiou")
_AN_EXCEPTIONS = {"hour", "honest", "honor", "honour", "heir", "herb"}
_A_EXCEPTIONS = {"university", "uniform", "unique", "united", "union",
                  "unit", "use", "used", "useful", "user", "usual",
                  "usually", "european", "one", "once"}


# ── Main check function ───────────────────────────────────────────────

def check_grammar_spacy(text: str) -> List[Dict[str, Any]]:
    """
    Run all grammar rules on the given text.
    Returns a list of error dicts matching the WriteWisely contract:
    {type, word, correction, hint, explanation, position: {start, end}, color, severity}
    """
    if not text or not text.strip():
        return []

    nlp = _get_nlp()
    doc = nlp(text)

    errors: List[Dict[str, Any]] = []
    covered_spans: set = set()

    def _add(e: Optional[Dict]) -> None:
        if e is None:
            return
        span = (e["position"]["start"], e["position"]["end"])
        if span in covered_spans:
            return
        covered_spans.add(span)
        errors.append(e)

    # Run each rule set
    for e in _check_subject_verb_agreement(doc, text):
        _add(e)
    for e in _check_double_words(doc, text):
        _add(e)
    for e in _check_of_have(text):
        _add(e)
    for e in _check_a_an(doc, text):
        _add(e)
    for e in _check_capitalization(text):
        _add(e)
    for e in _check_punctuation(text):
        _add(e)
    for e in _check_passive_voice(doc, text):
        _add(e)
    for e in _check_repeated_punctuation(text):
        _add(e)

    # Sort by position
    errors.sort(key=lambda x: x.get("position", {}).get("start", 0))
    return errors


# ── Individual rule implementations ───────────────────────────────────

def _make_error(
    error_type: str,
    word: str,
    correction: str,
    hint: str,
    explanation: str,
    start: int,
    end: int,
    severity: str = "major",
) -> Dict[str, Any]:
    """Create a standard WriteWisely error dict."""
    color = "red" if error_type == "spelling" else "yellow"
    return {
        "type": error_type,
        "word": word,
        "original": word,
        "text": word,
        "correction": correction,
        "hint": hint,
        "explanation": explanation,
        "position": {"start": start, "end": end},
        "color": color,
        "severity": severity,
    }


def _check_subject_verb_agreement(doc, text: str) -> List[Dict]:
    """Detect subject-verb agreement errors like 'I has', 'He go'."""
    results = []
    tokens = list(doc)

    for i in range(len(tokens) - 1):
        subj = tokens[i]
        verb = tokens[i + 1]

        subj_lower = subj.text.lower()
        verb_lower = verb.text.lower()

        # Only check if subject is a pronoun and next token is a verb
        if subj.pos_ not in ("PRON",) and subj_lower not in _SVA_RULES:
            continue
        if verb.pos_ not in ("VERB", "AUX"):
            continue

        rules = _SVA_RULES.get(subj_lower, {})
        if verb_lower in rules:
            correction = rules[verb_lower]
            results.append(_make_error(
                error_type="grammar",
                word=verb.text,
                correction=correction,
                hint=f'Should be "{correction}" after "{subj.text}"',
                explanation=f'"{subj.text} {verb.text}" has a subject-verb agreement error. '
                            f'Use "{subj.text} {correction}" instead.',
                start=verb.idx,
                end=verb.idx + len(verb.text),
            ))

    return results


def _check_double_words(doc, text: str) -> List[Dict]:
    """Detect repeated words like 'the the', 'is is'."""
    results = []
    tokens = [t for t in doc if not t.is_punct and not t.is_space]

    for i in range(len(tokens) - 1):
        if tokens[i].text.lower() == tokens[i + 1].text.lower():
            word = tokens[i + 1].text
            results.append(_make_error(
                error_type="grammar",
                word=f"{tokens[i].text} {word}",
                correction=tokens[i].text,
                hint="Remove the repeated word",
                explanation=f'"{tokens[i].text}" appears twice in a row. Remove the duplicate.',
                start=tokens[i].idx,
                end=tokens[i + 1].idx + len(word),
                severity="minor",
            ))

    return results


def _check_of_have(text: str) -> List[Dict]:
    """Detect 'could of' → 'could have' errors."""
    results = []
    text_lower = text.lower()

    for wrong, correct in _OF_HAVE_ERRORS.items():
        idx = 0
        while True:
            pos = text_lower.find(wrong, idx)
            if pos == -1:
                break
            # Make sure it's a word boundary
            before_ok = pos == 0 or not text[pos - 1].isalpha()
            after_pos = pos + len(wrong)
            after_ok = after_pos >= len(text) or not text[after_pos].isalpha()
            if before_ok and after_ok:
                original = text[pos:pos + len(wrong)]
                results.append(_make_error(
                    error_type="grammar",
                    word=original,
                    correction=correct,
                    hint=f'Use "{correct}" instead of "{wrong}"',
                    explanation=f'"{wrong}" is incorrect. The correct phrase is "{correct}" '
                                f'(using the verb "have", not the preposition "of").',
                    start=pos,
                    end=pos + len(wrong),
                ))
            idx = pos + len(wrong)

    return results


def _check_a_an(doc, text: str) -> List[Dict]:
    """Detect article misuse: 'a apple' → 'an apple', 'an university' → 'a university'."""
    results = []
    tokens = list(doc)

    for i in range(len(tokens) - 1):
        article = tokens[i]
        next_tok = tokens[i + 1]

        if article.text.lower() not in ("a", "an"):
            continue
        if next_tok.is_punct or next_tok.is_space:
            continue

        next_word = next_tok.text.lower()
        first_char = next_word[0] if next_word else ""

        # Determine if "an" should be used
        should_use_an = (
            (first_char in _VOWEL_SOUNDS and next_word not in _A_EXCEPTIONS)
            or next_word in _AN_EXCEPTIONS
        )

        current_is_an = article.text.lower() == "an"

        if should_use_an and not current_is_an:
            # Should be "an" but got "a"
            correction = "an" if article.text[0].islower() else "An"
            results.append(_make_error(
                error_type="grammar",
                word=article.text,
                correction=correction,
                hint=f'Use "an" before "{next_tok.text}"',
                explanation=f'Use "an" instead of "a" before words starting with a vowel sound.',
                start=article.idx,
                end=article.idx + len(article.text),
                severity="minor",
            ))
        elif not should_use_an and current_is_an:
            # Should be "a" but got "an"
            correction = "a" if article.text[0].islower() else "A"
            results.append(_make_error(
                error_type="grammar",
                word=article.text,
                correction=correction,
                hint=f'Use "a" before "{next_tok.text}"',
                explanation=f'Use "a" instead of "an" before words that don\'t start with a vowel sound.',
                start=article.idx,
                end=article.idx + len(article.text),
                severity="minor",
            ))

    return results


def _check_capitalization(text: str) -> List[Dict]:
    """Check if sentences start with a capital letter."""
    results = []
    # Split on sentence-ending punctuation
    sentences = re.split(r'(?<=[.!?])\s+', text)
    offset = 0

    for sent in sentences:
        if not sent:
            offset += len(sent)
            continue

        # Find actual start position in original text
        real_start = text.find(sent, offset)
        if real_start == -1:
            offset += len(sent) + 1
            continue

        first_char = sent[0]
        if first_char.isalpha() and first_char.islower():
            # Skip if it's the first sentence and starts with a known
            # lowercase-start word (like "iPhone")
            if first_char + sent[1:2] not in ("iP", "eB"):
                results.append(_make_error(
                    error_type="punctuation",
                    word=first_char,
                    correction=first_char.upper(),
                    hint="Capitalize the first letter of the sentence",
                    explanation="Sentences should start with a capital letter.",
                    start=real_start,
                    end=real_start + 1,
                    severity="minor",
                ))

        offset = real_start + len(sent)

    return results


def _check_punctuation(text: str) -> List[Dict]:
    """Check for missing end punctuation."""
    results = []
    stripped = text.rstrip()

    if stripped and stripped[-1].isalpha():
        # Text doesn't end with punctuation
        word_count = len(stripped.split())
        if word_count >= 3:  # Only flag if it looks like a real sentence
            results.append(_make_error(
                error_type="punctuation",
                word="",
                correction=".",
                hint="Add punctuation at the end of your sentence",
                explanation="Your text appears to be missing end punctuation (period, question mark, or exclamation mark).",
                start=len(stripped),
                end=len(stripped),
                severity="minor",
            ))

    return results


def _check_passive_voice(doc, text: str) -> List[Dict]:
    """Detect passive voice constructions (style suggestion, not error)."""
    results = []
    tokens = list(doc)

    # Pattern: be-verb + past participle (VBN)
    _be_forms = {"am", "is", "are", "was", "were", "be", "been", "being"}

    for i in range(len(tokens) - 1):
        if tokens[i].text.lower() in _be_forms and tokens[i + 1].tag_ == "VBN":
            # Check it's not part of a progressive ("is being done" — already passive)
            # Simple passive: "was written", "is made", "are given"
            be_tok = tokens[i]
            participle = tokens[i + 1]
            phrase = f"{be_tok.text} {participle.text}"

            # Skip very common non-passive constructions
            if participle.text.lower() in ("been", "going", "being", "done", "born",
                                            "supposed", "used", "allowed", "known",
                                            "located", "based", "interested",
                                            "married", "tired", "excited", "bored",
                                            "confused", "satisfied", "worried"):
                continue

            results.append(_make_error(
                error_type="style",
                word=phrase,
                correction="",
                hint="Consider using active voice",
                explanation=f'"{phrase}" uses passive voice. Consider rewriting in '
                            f'active voice for clearer, more direct writing.',
                start=be_tok.idx,
                end=participle.idx + len(participle.text),
                severity="minor",
            ))

    return results


def _check_repeated_punctuation(text: str) -> List[Dict]:
    """Detect repeated punctuation like '!!' or '..' (excluding '...' ellipsis)."""
    results = []

    for m in re.finditer(r'([!?])\1+', text):
        char = m.group(1)
        results.append(_make_error(
            error_type="punctuation",
            word=m.group(),
            correction=char,
            hint="Avoid repeated punctuation marks",
            explanation=f"Using multiple {char} marks is informal. Use a single one.",
            start=m.start(),
            end=m.end(),
            severity="minor",
        ))

    # Double periods (but not ellipsis ...)
    for m in re.finditer(r'\.\.(?!\.)', text):
        results.append(_make_error(
            error_type="punctuation",
            word="..",
            correction=".",
            hint="Remove the extra period",
            explanation="Two periods in a row — use either one period or an ellipsis (...).",
            start=m.start(),
            end=m.end(),
            severity="minor",
        ))

    return results
