"""
services/llm_service.py — LLM API Integration
Primary: Google Gemini | Fallback: OpenRouter | Fallback: HuggingFace
"""

import json
import asyncio
import httpx
from config import GEMINI_API_KEY, GEMINI_MODEL, OPENROUTER_API_KEY, LLM_MODEL, HF_API_KEY, HF_MODEL

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
# HuggingFace new unified router endpoint (old api-inference.huggingface.co is deprecated)
HF_ROUTER_URL = "https://router.huggingface.co/v1/chat/completions"
OPENROUTER_REQUEST_TIMEOUT_SECONDS = 12.0
OPENROUTER_MAX_MODELS = 4

# Ordered by reliability on free tier (verified available 2025-03)
OPENROUTER_FALLBACK_MODELS = [
    "google/gemma-3-4b-it:free",
    "google/gemma-3-12b-it:free",
    "google/gemma-3-27b-it:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "liquid/lfm-2.5-1.2b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
]


def _strip_code_fences(text: str) -> str:
    """Strip markdown code fences if model wraps JSON in ```json ... ```."""
    clean = text.strip()
    if clean.startswith("```") and clean.endswith("```"):
        lines = clean.split("\n")
        if len(lines) >= 3:
            return "\n".join(lines[1:-1]).strip()
    return clean


def _candidate_models(limit: int | None = None) -> list:
    """Return ordered model list (configured primary first, then known fallbacks)."""
    models = []
    if LLM_MODEL:
        models.append(LLM_MODEL)
    for m in OPENROUTER_FALLBACK_MODELS:
        if m not in models:
            models.append(m)
    if limit is not None:
        return models[:limit]
    return models


async def call_llm(system_prompt: str, user_message: str, json_mode: bool = True) -> dict:
    """
    Call LLM with system prompt and user message.
    Tries Gemini first, falls back to OpenRouter, then HuggingFace.
    Returns parsed JSON response or raw text.
    """
    
    # Try Gemini first (primary)
    if GEMINI_API_KEY:
        try:
            result = await _call_gemini(system_prompt, user_message, json_mode)
            return result
        except Exception as e:
            print(f"⚠️ Gemini failed: {e}, trying OpenRouter...")
    
    # Fallback to OpenRouter
    if OPENROUTER_API_KEY:
        try:
            result = await _call_openrouter(system_prompt, user_message, json_mode)
            return result
        except Exception as e:
            print(f"⚠️ OpenRouter failed: {e}, trying HuggingFace...")
    
    # Last resort: HuggingFace
    if HF_API_KEY:
        try:
            result = await _call_hf(system_prompt, user_message, json_mode)
            return result
        except Exception as e:
            print(f"⚠️ HuggingFace also failed: {e}")
            raise
    
    raise Exception("No LLM API keys configured")


async def call_llm_chat(messages: list) -> str:
    """
    Call LLM with full message history (for chat).
    Tries Gemini first, falls back to OpenRouter, then HuggingFace.
    Returns the assistant's text response.
    """
    
    # Try Gemini first
    if GEMINI_API_KEY:
        try:
            return await _call_gemini_chat(messages)
        except Exception as e:
            print(f"⚠️ Gemini chat failed: {e}, trying OpenRouter...")
    
    # Fallback to OpenRouter
    if OPENROUTER_API_KEY:
        try:
            return await _call_openrouter_chat(messages)
        except Exception as e:
            print(f"⚠️ OpenRouter chat failed: {e}, trying HuggingFace...")
    
    # Last resort: HuggingFace
    if HF_API_KEY:
        try:
            return await _call_hf_chat(messages)
        except Exception as e:
            print(f"⚠️ HuggingFace chat also failed: {e}")
            raise
    
    raise Exception("No LLM API keys configured")


# ─── Gemini Implementation ────────────────────────────────────

async def _call_gemini(system_prompt: str, user_message: str, json_mode: bool = True) -> dict:
    """Call Google Gemini API."""
    
    url = f"{GEMINI_URL}/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    
    body = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "parts": [{"text": user_message}]
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 2000,
        }
    }
    
    if json_mode:
        body["generationConfig"]["responseMimeType"] = "application/json"
    
    async with httpx.AsyncClient(timeout=25.0) as client:
        response = await client.post(url, json=body)
        response.raise_for_status()
        
        data = response.json()
        content = data["candidates"][0]["content"]["parts"][0]["text"]
        
        if json_mode:
            return json.loads(content)
        return {"text": content}


async def _call_gemini_chat(messages: list) -> str:
    """Call Gemini API with chat history."""
    
    url = f"{GEMINI_URL}/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    
    # Convert OpenAI format messages to Gemini format
    system_text = ""
    gemini_contents = []
    
    for msg in messages:
        if msg["role"] == "system":
            system_text = msg["content"]
        elif msg["role"] == "user":
            gemini_contents.append({
                "role": "user",
                "parts": [{"text": msg["content"]}]
            })
        elif msg["role"] == "assistant":
            gemini_contents.append({
                "role": "model",
                "parts": [{"text": msg["content"]}]
            })
    
    body = {
        "contents": gemini_contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1000,
        }
    }
    
    if system_text:
        body["system_instruction"] = {"parts": [{"text": system_text}]}
    
    async with httpx.AsyncClient(timeout=25.0) as client:
        response = await client.post(url, json=body)
        response.raise_for_status()
        
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


# ─── OpenRouter Implementation (backup) ───────────────────────

async def _call_openrouter(system_prompt: str, user_message: str, json_mode: bool = True) -> dict:
    """Call OpenRouter API."""
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://writewisely.app",
        "X-Title": "WriteWisely"
    }
    
    last_error = None
    async with httpx.AsyncClient(timeout=OPENROUTER_REQUEST_TIMEOUT_SECONDS) as client:
        for model in _candidate_models(OPENROUTER_MAX_MODELS):
            for attempt in range(2):
                body = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 2000
                }

                try:
                    response = await client.post(OPENROUTER_URL, headers=headers, json=body)
                    response.raise_for_status()

                    data = response.json()
                    content = data["choices"][0]["message"]["content"]

                    if json_mode:
                        clean = _strip_code_fences(content)
                        return json.loads(clean)
                    return {"text": content}
                except httpx.HTTPStatusError as e:
                    status = e.response.status_code
                    # Hard fail on authentication/permission/billing issues.
                    if status in (401, 402, 403):
                        raise
                    # Retry same model briefly for temporary rate limits.
                    if status == 429 and attempt < 2:
                        await asyncio.sleep(0.5)
                        last_error = e
                        continue
                    # For model availability/capacity/request issues, try next model.
                    if status in (400, 404, 408, 409, 422, 429, 500, 502, 503, 504):
                        last_error = e
                        break
                    raise
                except json.JSONDecodeError as e:
                    last_error = e
                    break

    if last_error:
        raise last_error
    raise Exception("OpenRouter call failed with no response")



async def _call_openrouter_chat(messages: list) -> str:
    """Call OpenRouter API with full message history."""
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://writewisely.app",
        "X-Title": "WriteWisely"
    }
    
    last_error = None
    async with httpx.AsyncClient(timeout=OPENROUTER_REQUEST_TIMEOUT_SECONDS) as client:
        for model in _candidate_models(OPENROUTER_MAX_MODELS):
            for attempt in range(1):
                body = {
                    "model": model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1000
                }

                try:
                    response = await client.post(OPENROUTER_URL, headers=headers, json=body)
                    response.raise_for_status()
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                except httpx.HTTPStatusError as e:
                    status = e.response.status_code
                    if status in (401, 402, 403):
                        raise
                    if status == 429:
                        last_error = e
                        break
                    if status in (400, 404, 408, 409, 422, 429, 500, 502, 503, 504):
                        last_error = e
                        break
                    raise

    if last_error:
        raise last_error
    raise Exception("OpenRouter chat call failed with no response")


# ─── HuggingFace Implementation (last resort) ─────────────────

async def _call_hf(system_prompt: str, user_message: str, json_mode: bool = True) -> dict:
    """Call HuggingFace Inference Router (new endpoint)."""
    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": HF_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.3,
        "max_tokens": 2000
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(HF_ROUTER_URL, headers=headers, json=body)
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        if json_mode:
            clean = _strip_code_fences(content)
            return json.loads(clean)
        return {"text": content}


async def _call_hf_chat(messages: list) -> str:
    """Call HuggingFace Inference Router with full message history."""
    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": HF_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1000
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(HF_ROUTER_URL, headers=headers, json=body)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
