"""
services/llm_service.py — STATIC MODE (no LLM API calls)
All grammar/practice checks use rule-based logic and static data only.
"""

import json
from typing import Any, Dict, List, Optional


class LLMService:
    """Compatibility service that mimics old LLM interface in offline mode."""

    async def generate_response(
        self,
        prompt: str,
        max_tokens: Optional[int] = None,
        **_: Any,
    ) -> Dict[str, Any]:
        prompt_lower = (prompt or "").lower()

        # Keep classifier flows stable for mentor routing.
        if "classify this user message" in prompt_lower:
            return {"response": "general_query", "confidence": 0.95}

        # Return parseable JSON when callers explicitly request JSON output.
        if "format your response as json" in prompt_lower or "format response as json" in prompt_lower:
            return {
                "response": json.dumps(
                    {
                        "improved_text": "Offline mode: No live AI rewrite. Please edit using lesson guidance.",
                        "improvements": [],
                        "overall_change": "Static mode response based on pre-defined rules.",
                        "goals": [],
                        "daily_target": 45,
                        "reason": "Offline mode uses local guidance instead of live AI.",
                        "tip": "Complete one lesson and one practice task today.",
                    }
                ),
                "confidence": 0.7,
            }

        text = "Offline mode: AI generation is disabled. Use lessons and practice templates for guided writing."
        if isinstance(max_tokens, int) and max_tokens > 0:
            text = text[:max_tokens]

        return {"response": text, "confidence": 0.7}

    async def check_text_with_context(
        self,
        text: str,
        user_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        _ = user_context
        # Minimal compatible structure for fallback strategy.
        return {
            "text": text,
            "errors": [],
            "confidence": 0.85,
            "note": "Static pre-defined analysis mode.",
        }


async def call_llm(system_prompt: str, user_message: str, json_mode: bool = True) -> dict:
    """Stub: Returns a minimal static response without calling any LLM."""
    if json_mode:
        return {
            "feedback": "Feature requires AI — running in static mode.",
            "score": 70,
            "errors": [],
            "suggestions": [],
            "corrections": [],
            "improved_text": user_message,
        }
    return {"text": "Running in static mode — AI unavailable."}


async def call_llm_chat(messages: list) -> str:
    """Stub: Returns a static coaching message without calling any LLM."""
    return (
        "I'm your WriteWisely coach! I'm currently running in offline mode. "
        "Please focus on the lessons and practice exercises to improve your writing."
    )
