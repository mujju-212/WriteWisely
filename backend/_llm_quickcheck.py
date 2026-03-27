import json, sys
import httpx
sys.path.append('backend')
from config import OPENROUTER_API_KEY, LLM_MODEL, HF_API_KEY, HF_MODEL

prompt='Return JSON only: {"ok":true}'

print('OPENROUTER_KEY', bool(OPENROUTER_API_KEY), 'MODEL', LLM_MODEL)
if OPENROUTER_API_KEY:
    try:
        r=httpx.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers={'Authorization': f'Bearer {OPENROUTER_API_KEY}','Content-Type':'application/json'},
            json={'model': LLM_MODEL,'messages':[{'role':'user','content':prompt}], 'max_tokens':80},
            timeout=20.0
        )
        print('OPENROUTER_STATUS', r.status_code)
        print('OPENROUTER_SNIP', r.text[:220])
    except Exception as e:
        print('OPENROUTER_ERR', str(e)[:220])

print('HF_KEY', bool(HF_API_KEY), 'MODEL', HF_MODEL)
if HF_API_KEY:
    try:
        r=httpx.post(
            'https://router.huggingface.co/v1/chat/completions',
            headers={'Authorization': f'Bearer {HF_API_KEY}','Content-Type':'application/json'},
            json={'model': HF_MODEL,'messages':[{'role':'user','content':prompt}], 'max_tokens':80},
            timeout=20.0
        )
        print('HF_STATUS', r.status_code)
        print('HF_SNIP', r.text[:220])
    except Exception as e:
        print('HF_ERR', str(e)[:220])
