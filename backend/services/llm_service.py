"""
services/llm_service.py — OpenRouter LLM API Integration
"""

import json
import httpx
from config import OPENROUTER_API_KEY, LLM_MODEL

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


async def call_llm(system_prompt: str, user_message: str, json_mode: bool = True) -> dict:
    """
    Call OpenRouter API with system prompt and user message.
    Returns parsed JSON response or raw text.
    Raises exception on failure (caught by checker_service for fallback).
    """
    
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
        "temperature": 0.3,  # Low temperature for consistent results
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


async def call_llm_chat(messages: list) -> str:
    """
    Call OpenRouter API with full message history (for chat).
    Returns the assistant's text response.
    """
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://writewisely.app",
        "X-Title": "WriteWisely"
    }
    
    body = {
        "model": LLM_MODEL,
        "messages": messages,
        "temperature": 0.7,  # Slightly more creative for chat
        "max_tokens": 1000
    }
    
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(OPENROUTER_URL, headers=headers, json=body)
        response.raise_for_status()
        
        data = response.json()
        return data["choices"][0]["message"]["content"]
