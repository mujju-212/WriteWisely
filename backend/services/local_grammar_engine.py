"""
Local grammar engine for WriteWisely.

Uses LanguageTool for grammar/style detection and SymSpell for extra typo
coverage. The output shape mirrors the existing frontend/backend contract so
the caller can swap between local and LLM-backed analysis without extra
mapping.
"""

from __future__ import annotations

import json
import os
import re
import threading
import time
import urllib.request
from importlib import resources
from typing import Any, Dict, List, Optional

try:
    import language_tool_python
except ImportError:  # pragma: no cover - optional dependency
    language_tool_python = None

try:
    from symspellpy import SymSpell, Verbosity
except ImportError:  # pragma: no cover - optional dependency
    SymSpell = None
    Verbosity = None


LT_CATEGORY_MAP = {
    "TYPOS": "spelling",
    "SPELLING": "spelling",
    "GRAMMAR": "grammar",
    "PUNCTUATION": "punctuation",
    "STYLE": "style",
    "TYPOGRAPHY": "punctuation",
    "CONFUSED_WORDS": "word_choice",
    "REDUNDANCY": "style",
    "CASING": "grammar",
}

HIGH_SCORE_TEMPLATES = {
    "spelling": "Strong spelling accuracy throughout",
    "grammar": "Good grammar with well-structured sentences",
    "sentence_structure": "Sentence structure is clear and easy to follow",
    "tone": "Tone stays appropriate and readable",
    "completeness": "Response length is appropriate for the task",
}

LOW_SCORE_TEMPLATES = {
    "spelling": "Focus on common spelling patterns and proofread carefully",
    "grammar": "Review grammar and punctuation rules in the highlighted areas",
    "sentence_structure": "Try varying sentence length and tightening long sentences",
    "tone": "Keep your tone consistent and avoid overly casual phrasing",
    "completeness": "Add a little more detail to fully develop your ideas",
}

DEFAULT_SPELLING_HINTS = {
    "teh": "the",
    "recieve": "receive",
    "seperate": "separate",
    "definately": "definitely",
    "occured": "occurred",
    "wierd": "weird",
    "writting": "writing",
    "enviroment": "environment",
    "goverment": "government",
    "arguement": "argument",
    "adress": "address",
    "grammer": "grammar",
    "tomorow": "tomorrow",
}

WORD_RE = re.compile(r"\b[A-Za-z][A-Za-z'-]{1,}\b")
SENTENCE_RE = re.compile(r"[^.!?]+[.!?]?")
LT_INIT_WAIT_SECONDS = 0.5
LT_REQUEST_TIMEOUT_SECONDS = 2.5


# #region debug-point B:debug-helper
def _debug_report(hypothesis_id: str, location: str, msg: str, data: dict | None = None) -> None:
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", ".dbg", "live-suggestions-stuck.env")
    url = "http://127.0.0.1:7778/event"
    session_id = "live-suggestions-stuck"
    try:
        with open(os.path.normpath(env_path), "r", encoding="utf-8") as env_file:
            for raw_line in env_file:
                line = raw_line.strip()
                if line.startswith("DEBUG_SERVER_URL="):
                    url = line.split("=", 1)[1]
                elif line.startswith("DEBUG_SESSION_ID="):
                    session_id = line.split("=", 1)[1]
    except Exception:
        pass
    payload = {
        "sessionId": session_id,
        "runId": "pre-fix",
        "hypothesisId": hypothesis_id,
        "location": location,
        "msg": f"[DEBUG] {msg}",
        "data": data or {},
        "ts": int(time.time() * 1000),
    }
    try:
        urllib.request.urlopen(
            urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            ),
            timeout=0.8,
        ).read()
    except Exception:
        pass
# #endregion


def _clamp_score(value: float) -> float:
    return max(1.0, min(10.0, value))


class LocalGrammarEngine:
    """Local grammar, spelling, and style engine."""

    def __init__(self, language: str = "en-US") -> None:
        self.language = language
        self.tool = self._init_language_tool(language)
        self.symspell = self._init_symspell()
        self.available = self.tool is not None or self.symspell is not None

    def check_grammar(self, text: str, hints_only: bool = False) -> Dict[str, Any]:
        """Return live-check style errors for the given text."""
        self._ensure_available()
        errors = self._collect_errors(text)

        if hints_only:
            for error in errors:
                error.pop("explanation", None)

        return {"errors": errors}

    def analyze_text(
        self,
        text: str,
        user_level: str = "intermediate",
        task_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Return detailed local analysis for practice mode."""
        self._ensure_available()
        errors = self._collect_errors(text)
        scores = self._generate_scores(text, errors, user_level, task_prompt)
        strengths, areas_to_improve = self._generate_feedback(scores, errors, user_level)

        return {
            **scores,
            "errors": errors,
            "improved_version": self._generate_improved_version(text, errors),
            "strengths": strengths,
            "areas_to_improve": areas_to_improve,
        }

    def check_project(self, text: str, user_level: str = "intermediate") -> Dict[str, Any]:
        """Return project editor suggestions using the local engine."""
        self._ensure_available()
        errors = self._collect_errors(text)
        scores = self._generate_scores(text, errors, user_level)
        strengths, areas_to_improve = self._generate_feedback(scores, errors, user_level)
        overall_score = scores["overall_score"]

        if overall_score >= 8:
            overall_feedback = "Your draft is in strong shape. The remaining issues are minor."
        elif overall_score >= 6:
            overall_feedback = "Your draft is clear overall, but a few corrections will improve polish."
        else:
            overall_feedback = "Fix the highlighted issues first, then review the flow and clarity again."

        return {
            "errors": errors,
            "score": overall_score,
            "suggestions": areas_to_improve[:4],
            "overall_feedback": overall_feedback,
            "strengths": strengths,
            "areas_to_improve": areas_to_improve,
            "improved_version": self._generate_improved_version(text, errors),
        }

    def _ensure_available(self) -> None:
        if not self.available:
            raise RuntimeError(
                "Local grammar engine dependencies are unavailable. "
                "Install language_tool_python and symspellpy to enable it."
            )

    def _collect_errors(self, text: str) -> List[Dict[str, Any]]:
        if not text.strip():
            return []

        trace_id = f"collect:{len(text)}:{abs(hash((text or '')[:32]))}"
        started_at = time.monotonic()
        # #region debug-point B:collect-errors-start
        _debug_report("B", "local_grammar_engine._collect_errors:start", "collect_errors entered", {"traceId": trace_id, "textLength": len(text), "hasTool": self.tool is not None, "hasSymSpell": self.symspell is not None})
        # #endregion

        errors: List[Dict[str, Any]] = []
        covered_spans: set[tuple[int, int]] = set()

        for match in self._run_language_tool(text):
            converted = self._lt_to_ww_error(text, match)
            if not converted:
                continue
            span = (
                converted.get("position", {}).get("start"),
                converted.get("position", {}).get("end"),
            )
            if span in covered_spans:
                continue
            covered_spans.add(span)
            errors.append(converted)

        # #region debug-point B:collect-errors-after-lt
        _debug_report("B", "local_grammar_engine._collect_errors:after_lt", "language tool collection finished", {"traceId": trace_id, "errorCount": len(errors), "elapsedMs": round((time.monotonic() - started_at) * 1000, 1)})
        # #endregion

        for extra in self._run_symspell(text, covered_spans):
            span = (
                extra.get("position", {}).get("start"),
                extra.get("position", {}).get("end"),
            )
            if span in covered_spans:
                continue
            covered_spans.add(span)
            errors.append(extra)

        deduped = sorted(
            self._dedupe_errors(errors),
            key=lambda item: item.get("position", {}).get("start", 0),
        )
        # #region debug-point B:collect-errors-return
        _debug_report("B", "local_grammar_engine._collect_errors:return", "collect_errors returning", {"traceId": trace_id, "errorCount": len(deduped), "elapsedMs": round((time.monotonic() - started_at) * 1000, 1)})
        # #endregion
        return deduped

    def _run_language_tool(self, text: str) -> List[Any]:
        if self.tool is None:
            return []
        try:
            trace_id = f"lt:{len(text)}:{abs(hash((text or '')[:32]))}"
            started_at = time.monotonic()
            result_holder: list[List[Any]] = [[]]
            error_holder: list[Exception | None] = [None]

            def _check() -> None:
                try:
                    result_holder[0] = list(self.tool.check(text))
                except Exception as exc:
                    error_holder[0] = exc

            # #region debug-point A:lt-start
            _debug_report("A", "local_grammar_engine._run_language_tool:start", "language tool check starting", {"traceId": trace_id, "textLength": len(text)})
            # #endregion
            worker = threading.Thread(target=_check, daemon=True)
            worker.start()
            worker.join(timeout=LT_REQUEST_TIMEOUT_SECONDS)
            if worker.is_alive():
                # #region debug-point C:lt-timeout
                _debug_report("C", "local_grammar_engine._run_language_tool:timeout", "language tool check timed out", {"traceId": trace_id, "timeoutSeconds": LT_REQUEST_TIMEOUT_SECONDS, "elapsedMs": round((time.monotonic() - started_at) * 1000, 1)})
                # #endregion
                self.tool = None
                self.available = self.symspell is not None
                return []
            if error_holder[0] is not None:
                raise error_holder[0]
            matches = result_holder[0]
            # #region debug-point A:lt-return
            _debug_report("A", "local_grammar_engine._run_language_tool:return", "language tool check returned", {"traceId": trace_id, "matchCount": len(matches), "elapsedMs": round((time.monotonic() - started_at) * 1000, 1)})
            # #endregion
            return matches
        except Exception:
            # #region debug-point C:lt-error
            _debug_report("C", "local_grammar_engine._run_language_tool:error", "language tool check failed", {"textLength": len(text)})
            # #endregion
            return []

    def _run_symspell(
        self,
        text: str,
        covered_spans: set[tuple[int, int]],
    ) -> List[Dict[str, Any]]:
        suggestions: List[Dict[str, Any]] = []
        trace_id = f"sym:{len(text)}:{abs(hash((text or '')[:32]))}"
        started_at = time.monotonic()
        # #region debug-point B:symspell-start
        _debug_report("B", "local_grammar_engine._run_symspell:start", "symspell check starting", {"traceId": trace_id, "textLength": len(text), "coveredSpanCount": len(covered_spans)})
        # #endregion

        if self.symspell is None:
            # No SymSpell available — use the hardcoded dictionary only
            for match in WORD_RE.finditer(text):
                token = match.group(0)
                lower = token.lower()
                if lower not in DEFAULT_SPELLING_HINTS:
                    continue
                span = (match.start(), match.end())
                if span in covered_spans:
                    continue
                suggestions.append(
                    self._make_spelling_error(
                        text=text,
                        original=token,
                        correction=DEFAULT_SPELLING_HINTS[lower],
                        start=match.start(),
                        end=match.end(),
                        explanation="This looks like a common misspelling.",
                    )
                )
            # #region debug-point B:symspell-fallback-return
            _debug_report("B", "local_grammar_engine._run_symspell:fallback_return", "fallback dictionary returned", {"traceId": trace_id, "suggestionCount": len(suggestions), "elapsedMs": round((time.monotonic() - started_at) * 1000, 1)})
            # #endregion
            return suggestions

        for match in WORD_RE.finditer(text):
            token = match.group(0)
            lower = token.lower()
            if len(lower) < 2 or not lower.isalpha():
                continue

            span = (match.start(), match.end())
            if span in covered_spans:
                continue

            lookup = self.symspell.lookup(
                lower,
                Verbosity.CLOSEST,
                max_edit_distance=2,
                include_unknown=True,
                transfer_casing=False,
            )

            if not lookup or lookup[0].distance == 0:
                # Word found exactly in dictionary — it's correct
                continue

            best = lookup[0]
            if best.term == lower and getattr(best, "count", 0) > 0:
                continue

            if best.distance <= 2:
                # Close match found — suggest the correction
                suggestions.append(
                    self._make_spelling_error(
                        text=text,
                        original=token,
                        correction=self._apply_casing(token, best.term),
                        start=match.start(),
                        end=match.end(),
                        explanation="This word is likely misspelled.",
                    )
                )
            else:
                # Word is too far from anything in dictionary — flag as unknown
                suggestions.append(
                    self._make_spelling_error(
                        text=text,
                        original=token,
                        correction="",
                        start=match.start(),
                        end=match.end(),
                        explanation="This word is not recognized. Check spelling.",
                    )
                )

        # #region debug-point B:symspell-return
        _debug_report("B", "local_grammar_engine._run_symspell:return", "symspell check returned", {"traceId": trace_id, "suggestionCount": len(suggestions), "elapsedMs": round((time.monotonic() - started_at) * 1000, 1)})
        # #endregion
        return suggestions

    def _lt_to_ww_error(self, text: str, match: Any) -> Optional[Dict[str, Any]]:
        start = int(getattr(match, "offset", 0))
        end = start + int(getattr(match, "errorLength", 0))
        if end <= start or end > len(text):
            return None

        category = getattr(match, "category", None)
        category_id = getattr(category, "id", None) or getattr(category, "name", None) or str(category or "")
        issue_type = (getattr(match, "ruleIssueType", "") or "").upper()
        error_type = LT_CATEGORY_MAP.get(str(category_id).upper()) or LT_CATEGORY_MAP.get(issue_type, "grammar")

        original = text[start:end]
        replacements = list(getattr(match, "replacements", []) or [])
        correction = replacements[0] if replacements else None
        message = getattr(match, "message", "") or "Review this part of your writing."
        short_message = getattr(match, "shortMessage", "") or message

        error: Dict[str, Any] = {
            "type": error_type,
            "word": original,
            "original": original,
            "text": original,
            "hint": short_message,
            "position": {"start": start, "end": end},
            "color": "red" if error_type == "spelling" else "yellow",
            "severity": "minor" if error_type in {"spelling", "punctuation"} else "major",
            "explanation": message,
        }
        if correction:
            error["correction"] = correction
        return error

    def _generate_scores(
        self,
        text: str,
        errors: List[Dict[str, Any]],
        user_level: str,
        task_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        words = re.findall(r"\b\w+\b", text)
        word_count = max(len(words), 1)
        sentence_count = max(len([s for s in SENTENCE_RE.findall(text) if s.strip()]), 1)
        unique_ratio = len({word.lower() for word in words}) / word_count if words else 0.0

        spelling_errors = sum(1 for e in errors if e.get("type") == "spelling")
        grammar_errors = sum(1 for e in errors if e.get("type") == "grammar")
        punctuation_errors = sum(1 for e in errors if e.get("type") == "punctuation")
        style_errors = sum(1 for e in errors if e.get("type") in {"style", "word_choice"})

        avg_sentence_length = word_count / sentence_count

        spelling_score = _clamp_score(10 - (spelling_errors * 1.8) - ((spelling_errors / word_count) * 20))
        grammar_score = _clamp_score(
            10
            - (grammar_errors * 1.5)
            - (punctuation_errors * 1.1)
            - (style_errors * 0.5)
        )

        if 8 <= avg_sentence_length <= 22:
            structure_score = 9.0
        elif 6 <= avg_sentence_length <= 28:
            structure_score = 7.5
        else:
            structure_score = 5.5
        if sentence_count == 1 and word_count > 25:
            structure_score -= 1.5
        structure_score = _clamp_score(structure_score - min(style_errors * 0.3, 1.5))

        punctuation_ratio = len(re.findall(r"[.!?,;:]", text)) / word_count
        tone_score = 7.0
        if text and text[:1].isupper():
            tone_score += 0.5
        if text.rstrip().endswith((".", "!", "?")):
            tone_score += 0.5
        if 0.35 <= unique_ratio <= 0.8:
            tone_score += 1.0
        if punctuation_ratio < 0.01 and word_count > 20:
            tone_score -= 1.0
        tone_score = _clamp_score(tone_score - min(style_errors * 0.4, 1.5))

        target_words = 35
        if task_prompt and len(task_prompt.split()) > 12:
            target_words = 50
        completeness_score = _clamp_score(3.0 + min(word_count / target_words, 1.0) * 7.0)

        weights = {
            "beginner": [0.40, 0.30, 0.15, 0.10, 0.05],
            "intermediate": [0.25, 0.25, 0.25, 0.15, 0.10],
            "advanced": [0.15, 0.20, 0.30, 0.20, 0.15],
        }
        current_weights = weights.get((user_level or "intermediate").lower(), weights["intermediate"])
        overall = (
            spelling_score * current_weights[0]
            + grammar_score * current_weights[1]
            + structure_score * current_weights[2]
            + tone_score * current_weights[3]
            + completeness_score * current_weights[4]
        )

        return {
            "overall_score": round(_clamp_score(overall), 1),
            "category_scores": {
                "spelling": round(spelling_score),
                "grammar": round(grammar_score),
                "sentence_structure": round(structure_score),
                "tone": round(tone_score),
                "completeness": round(completeness_score),
            },
        }

    def _generate_improved_version(self, text: str, errors: List[Dict[str, Any]]) -> str:
        sortable = [
            error
            for error in errors
            if error.get("position") and error.get("correction")
        ]
        improved = text
        for error in sorted(sortable, key=lambda item: item["position"]["start"], reverse=True):
            start = error["position"]["start"]
            end = error["position"]["end"]
            improved = improved[:start] + str(error["correction"]) + improved[end:]
        return improved

    def _generate_feedback(
        self,
        scores: Dict[str, Any],
        errors: List[Dict[str, Any]],
        user_level: str,
    ) -> tuple[List[str], List[str]]:
        strengths: List[str] = []
        areas: List[str] = []

        category_scores = scores.get("category_scores", {})
        for category, score in category_scores.items():
            if score >= 8:
                strengths.append(HIGH_SCORE_TEMPLATES.get(category, f"Good {category.replace('_', ' ')}"))
            elif score < 6:
                areas.append(LOW_SCORE_TEMPLATES.get(category, f"Improve {category.replace('_', ' ')}"))

        error_types = {error.get("type") for error in errors}
        if "word_choice" in error_types and len(areas) < 4:
            areas.append("Choose more precise words where the meaning feels unclear")
        if not strengths:
            strengths.append("You are building a solid draft to improve from")
        if not areas:
            areas.append("Do one final proofreading pass for small issues")

        return strengths[:4], areas[:4]

    def _dedupe_errors(self, errors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        deduped: List[Dict[str, Any]] = []
        seen = set()
        for error in errors:
            position = error.get("position") or {}
            key = (
                error.get("type"),
                position.get("start"),
                position.get("end"),
                str(error.get("correction", "")).lower(),
            )
            if key in seen:
                continue
            seen.add(key)
            deduped.append(error)
        return deduped

    def _init_language_tool(self, language: str) -> Optional[Any]:
        if language_tool_python is None:
            print("[LocalEngine] language_tool_python not installed, skipping.")
            return None
        # Start LanguageTool init in a background thread with a timeout.
        # First init downloads a ~200MB server jar and can take minutes.
        # We don't block the engine — SymSpell is available immediately.
        result_holder: list = [None]
        def _init():
            try:
                tool = language_tool_python.LanguageTool(language)
                if hasattr(tool, "_TIMEOUT"):
                    tool._TIMEOUT = LT_REQUEST_TIMEOUT_SECONDS
                self.tool = tool
                self.available = True
                result_holder[0] = tool
                print("[LocalEngine] LanguageTool ready.")
            except Exception as exc:
                print(f"[LocalEngine] LanguageTool init failed: {exc}")
        t = threading.Thread(target=_init, daemon=True)
        t.start()
        t.join(timeout=LT_INIT_WAIT_SECONDS)
        if result_holder[0] is not None:
            return result_holder[0]
        else:
            print("[LocalEngine] LanguageTool not ready yet (still loading in background). Using SymSpell only.")
            # Background init continues and will attach the tool when ready.
        return None

    def _init_symspell(self) -> Optional[Any]:
        if SymSpell is None:
            print("[LocalEngine] symspellpy not installed, skipping.")
            return None

        try:
            dictionary_path = resources.files("symspellpy").joinpath(
                "frequency_dictionary_en_82_765.txt"
            )
            symspell = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)
            if not symspell.load_dictionary(str(dictionary_path), term_index=0, count_index=1):
                print("[LocalEngine] SymSpell dictionary load failed.")
                return None
            print("[LocalEngine] SymSpell dictionary loaded.")
            return symspell
        except Exception as e:
            print(f"[LocalEngine] SymSpell init failed: {e}")
            return None

    def _apply_casing(self, source: str, suggestion: str) -> str:
        if source.isupper():
            return suggestion.upper()
        if source[:1].isupper():
            return suggestion.capitalize()
        return suggestion

    def _make_spelling_error(
        self,
        text: str,
        original: str,
        correction: str,
        start: int,
        end: int,
        explanation: str,
    ) -> Dict[str, Any]:
        hint = f"Did you mean '{correction}'?" if correction else "Check this word - it may be misspelled."
        return {
            "type": "spelling",
            "word": original,
            "original": original,
            "text": original,
            "correction": correction or "",
            "hint": hint,
            "position": {"start": start, "end": end},
            "color": "red",
            "severity": "minor",
            "explanation": explanation,
        }


_ENGINE: Optional[LocalGrammarEngine] = None
_ENGINE_LOCK = threading.Lock()


def get_engine() -> LocalGrammarEngine:
    global _ENGINE
    if _ENGINE is None:
        with _ENGINE_LOCK:
            if _ENGINE is None:
                _ENGINE = LocalGrammarEngine()
    return _ENGINE
