"""
services/llm_service.py — LLM API Integration
Primary: Google Gemini | Fallback: OpenRouter
"""

import json
import httpx
from config import GEMINI_API_KEY, GEMINI_MODEL, OPENROUTER_API_KEY, LLM_MODEL

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


async def call_llm(system_prompt: str, user_message: str, json_mode: bool = True) -> dict:
    """
    Call LLM with system prompt and user message.
    Tries Gemini first, falls back to OpenRouter if Gemini fails.
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
            print(f"⚠️ OpenRouter also failed: {e}")
            raise
    
    raise Exception("No LLM API keys configured")


async def call_llm_chat(messages: list) -> str:
    """
    Call LLM with full message history (for chat).
    Tries Gemini first, falls back to OpenRouter.
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
            print(f"⚠️ OpenRouter chat also failed: {e}")
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
    
    body = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.3,
        "max_tokens": 2000
    }
    
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(OPENROUTER_URL, headers=headers, json=body)
        response.raise_for_status()
        
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        
        if json_mode:
            return json.loads(content)
        return {"text": content}


async def _call_openrouter_chat(messages: list) -> str:
    """Call OpenRouter API with full message history."""
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://writewisely.app",
        "X-Title": "WriteWisely"
    }
    
    body = {
        "model": LLM_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1000
    }
    
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(OPENROUTER_URL, headers=headers, json=body)
        response.raise_for_status()
        
        data = response.json()
        return data["choices"][0]["message"]["content"]
