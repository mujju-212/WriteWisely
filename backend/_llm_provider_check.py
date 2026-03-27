import sys
import json
import httpx
sys.path.insert(0, 'backend')
from config import GEMINI_API_KEY, GEMINI_MODEL, OPENROUTER_API_KEY, LLM_MODEL, HF_API_KEY, HF_MODEL

prompt = 'Say only: OK'

print('GEMINI_CONFIGURED', bool(GEMINI_API_KEY), 'MODEL', GEMINI_MODEL)
if GEMINI_API_KEY:
    try:
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}'
        body = {
            'contents': [{'parts': [{'text': prompt}]}],
            'generationConfig': {'maxOutputTokens': 32, 'temperature': 0.1}
        }
        r = httpx.post(url, json=body, timeout=20.0)
        print('GEMINI_STATUS', r.status_code)
        print('GEMINI_SNIP', r.text[:180])
    except Exception as e:
        print('GEMINI_ERR', str(e)[:180])

print('OPENROUTER_CONFIGURED', bool(OPENROUTER_API_KEY), 'MODEL', LLM_MODEL)
if OPENROUTER_API_KEY:
    try:
        r = httpx.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers={'Authorization': f'Bearer {OPENROUTER_API_KEY}', 'Content-Type': 'application/json'},
            json={'model': LLM_MODEL, 'messages': [{'role':'user','content': prompt}], 'max_tokens': 32},
            timeout=20.0
        )
        print('OPENROUTER_STATUS', r.status_code)
        print('OPENROUTER_SNIP', r.text[:180])
    except Exception as e:
        print('OPENROUTER_ERR', str(e)[:180])

print('HF_CONFIGURED', bool(HF_API_KEY), 'MODEL', HF_MODEL)
if HF_API_KEY:
    try:
        r = httpx.post(
            'https://router.huggingface.co/v1/chat/completions',
            headers={'Authorization': f'Bearer {HF_API_KEY}', 'Content-Type': 'application/json'},
            json={'model': HF_MODEL, 'messages': [{'role':'user','content': prompt}], 'max_tokens': 32},
            timeout=20.0
        )
        print('HF_STATUS', r.status_code)
        print('HF_SNIP', r.text[:180])
    except Exception as e:
        print('HF_ERR', str(e)[:180])
