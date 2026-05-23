"""
services/llm_service.py — LLM integration with provider fallback.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional

import httpx

from config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    HF_API_KEY,
    HF_MODEL,
    LLM_MODEL,
    OPENROUTER_API_KEY,
)

_DEFAULT_TIMEOUT = 25.0
_DEFAULT_MAX_TOKENS = 800
_DEFAULT_TEMPERATURE = 0.2
_JSON_HINT = "Return ONLY valid JSON. Do not use markdown or code fences."


def _pick_provider() -> Optional[str]:
    forced = os.getenv("LLM_PROVIDER", "").strip().lower()
    if forced in {"gemini", "openrouter", "huggingface", "hf"}:
        if forced in {"huggingface", "hf"} and HF_API_KEY:
            return "huggingface"
        if forced == "openrouter" and OPENROUTER_API_KEY:
            return "openrouter"
        if forced == "gemini" and GEMINI_API_KEY:
            return "gemini"

    if GEMINI_API_KEY:
        return "gemini"
    if OPENROUTER_API_KEY:
        return "openrouter"
    if HF_API_KEY:
        return "huggingface"
    return None


def _strip_code_fences(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z0-9_-]*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)
    return cleaned.strip()


def _extract_json(text: str) -> Optional[dict]:
    if not text:
        return None
    cleaned = _strip_code_fences(text)
    match = re.search(r"\{.*\}", cleaned, re.S)
    if not match:
        return None
    candidate = match.group(0)
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return None


def _messages_to_prompt(messages: List[Dict[str, str]]) -> str:
    parts = []
    for msg in messages:
        role = (msg.get("role") or "user").upper()
        content = msg.get("content") or ""
        parts.append(f"{role}: {content}")
    return "\n".join(parts).strip()


async def _call_openai_compatible(
    endpoint: str,
    api_key: str,
    model: str,
    messages: List[Dict[str, str]],
    max_tokens: int,
    temperature: float,
    response_format: Optional[Dict[str, str]] = None,
) -> str:
    if not api_key:
        raise RuntimeError("Missing API key for provider")
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    if response_format:
        payload["response_format"] = response_format
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=_DEFAULT_TIMEOUT) as client:
        resp = await client.post(endpoint, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
    choices = data.get("choices", [])
    if not choices:
        raise RuntimeError("No choices returned from provider")
    message = choices[0].get("message", {})
    content = message.get("content", "")
    if not isinstance(content, str):
        raise RuntimeError("Invalid response content from provider")
    return content


async def _call_gemini(
    system_prompt: str,
    user_message: str,
    max_tokens: int,
    temperature: float,
) -> str:
    if not GEMINI_API_KEY:
        raise RuntimeError("Missing Gemini API key")
    prompt = f"{system_prompt}\n\n{user_message}".strip() if system_prompt else user_message
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temperature},
    }
    async with httpx.AsyncClient(timeout=_DEFAULT_TIMEOUT) as client:
        resp = await client.post(url, json=body)
        resp.raise_for_status()
        data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        raise RuntimeError("No candidates returned from Gemini")
    parts = candidates[0].get("content", {}).get("parts", [])
    text = "".join(part.get("text", "") for part in parts)
    return text.strip()


def _offline_json(user_message: str) -> Dict[str, Any]:
    return {
        "feedback": "LLM unavailable. Using offline mode.",
        "errors": [],
        "suggestions": [],
        "improved_text": user_message,
    }


def _offline_chat() -> str:
    return (
        "I'm your WriteWisely coach! I'm currently running in offline mode. "
        "Please focus on the lessons and practice exercises to improve your writing."
    )


async def _call_openrouter(system_prompt: str, user_message: str, json_mode: bool = True) -> Any:
    messages = []
    if system_prompt:
        if json_mode:
            system_prompt = f"{system_prompt}\n\n{_JSON_HINT}"
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_message})
    temperature = 0.0 if json_mode else _DEFAULT_TEMPERATURE
    response_format = {"type": "json_object"} if json_mode else None
    try:
        raw = await _call_openai_compatible(
            "https://openrouter.ai/api/v1/chat/completions",
            OPENROUTER_API_KEY,
            LLM_MODEL,
            messages,
            _DEFAULT_MAX_TOKENS,
            temperature,
            response_format=response_format,
        )
    except Exception:
        raw = await _call_openai_compatible(
            "https://openrouter.ai/api/v1/chat/completions",
            OPENROUTER_API_KEY,
            LLM_MODEL,
            messages,
            _DEFAULT_MAX_TOKENS,
            temperature,
        )
    if not json_mode:
        return raw
    return _extract_json(raw) or {"errors": [], "note": "Non-JSON response", "raw_response": raw[:2000]}


async def _call_hf(system_prompt: str, user_message: str, json_mode: bool = True) -> Any:
    messages = []
    if system_prompt:
        if json_mode:
            system_prompt = f"{system_prompt}\n\n{_JSON_HINT}"
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_message})
    temperature = 0.0 if json_mode else _DEFAULT_TEMPERATURE
    response_format = {"type": "json_object"} if json_mode else None
    try:
        raw = await _call_openai_compatible(
            "https://router.huggingface.co/v1/chat/completions",
            HF_API_KEY,
            HF_MODEL,
            messages,
            _DEFAULT_MAX_TOKENS,
            temperature,
            response_format=response_format,
        )
    except Exception:
        raw = await _call_openai_compatible(
            "https://router.huggingface.co/v1/chat/completions",
            HF_API_KEY,
            HF_MODEL,
            messages,
            _DEFAULT_MAX_TOKENS,
            temperature,
        )
    if not json_mode:
        return raw
    return _extract_json(raw) or {"errors": [], "note": "Non-JSON response", "raw_response": raw[:2000]}


class LLMService:
    """Compatibility service that mimics old LLM interface with live providers."""

    async def generate_response(
        self,
        prompt: str,
        max_tokens: Optional[int] = None,
        **_: Any,
    ) -> Dict[str, Any]:
        prompt_lower = (prompt or "").lower()
        provider = _pick_provider()

        if not provider:
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

        try:
            messages = [
                {"role": "system", "content": "You are a helpful writing mentor."},
                {"role": "user", "content": prompt},
            ]
            reply = await call_llm_chat(messages, max_tokens=max_tokens)
            return {"response": reply, "confidence": 0.85}
        except Exception:
            return {"response": _offline_chat(), "confidence": 0.5}

    async def check_text_with_context(
        self,
        text: str,
        user_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        context = user_context or ""
        prompt = (
            "Analyze the text and return JSON with an 'errors' array. "
            "Each error should include type, original, correction, explanation, position, and severity. "
            f"User context: {context}"
        )
        result = await call_llm(prompt, f"Text: {text}", json_mode=True)
        return {
            "text": text,
            "errors": result.get("errors", []) if isinstance(result, dict) else [],
            "confidence": result.get("confidence", 0.75) if isinstance(result, dict) else 0.5,
        }


async def call_llm(system_prompt: str, user_message: str, json_mode: bool = True) -> dict:
    provider = _pick_provider()
    if not provider:
        return _offline_json(user_message) if json_mode else {"text": _offline_chat()}

    try:
        if provider == "gemini":
            prompt = system_prompt
            if json_mode:
                prompt = f"{prompt}\n\n{_JSON_HINT}"
            raw = await _call_gemini(prompt, user_message, _DEFAULT_MAX_TOKENS, _DEFAULT_TEMPERATURE)
            if not json_mode:
                return {"text": raw}
            parsed = _extract_json(raw)
            if parsed is None:
                return {"errors": [], "note": "Non-JSON response", "raw_response": raw[:2000]}
            return parsed

        if provider == "openrouter":
            if json_mode:
                return await _call_openrouter(system_prompt, user_message, json_mode=True)
            return {"text": await _call_openrouter(system_prompt, user_message, json_mode=False)}

        if json_mode:
            return await _call_hf(system_prompt, user_message, json_mode=True)
        return {"text": await _call_hf(system_prompt, user_message, json_mode=False)}
    except Exception:
        return _offline_json(user_message) if json_mode else {"text": _offline_chat()}


async def call_llm_chat(messages: list, max_tokens: Optional[int] = None) -> str:
    provider = _pick_provider()
    if not provider:
        return _offline_chat()

    try:
        tokens = max_tokens if isinstance(max_tokens, int) and max_tokens > 0 else _DEFAULT_MAX_TOKENS
        if provider == "gemini":
            prompt = _messages_to_prompt(messages)
            return await _call_gemini("", prompt, tokens, _DEFAULT_TEMPERATURE)
        if provider == "openrouter":
            return await _call_openai_compatible(
                "https://openrouter.ai/api/v1/chat/completions",
                OPENROUTER_API_KEY,
                LLM_MODEL,
                messages,
                tokens,
                _DEFAULT_TEMPERATURE,
            )
        return await _call_openai_compatible(
            "https://router.huggingface.co/v1/chat/completions",
            HF_API_KEY,
            HF_MODEL,
            messages,
            tokens,
            _DEFAULT_TEMPERATURE,
        )
    except Exception:
        return _offline_chat()
