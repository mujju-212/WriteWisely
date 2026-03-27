import asyncio
import sys
sys.path.append('backend')
from services.llm_service import _call_openrouter, _call_hf

async def main():
    prompt = 'You are a concise assistant. Return valid JSON only.'
    msg = 'Return {"ok": true, "provider": "test"} as JSON.'

    try:
        r1 = await _call_openrouter(prompt, msg, True)
        print('OPENROUTER_OK', isinstance(r1, dict), r1)
    except Exception as e:
        print('OPENROUTER_FAIL', str(e)[:300])

    try:
        r2 = await _call_hf(prompt, msg, True)
        print('HF_OK', isinstance(r2, dict), r2)
    except Exception as e:
        print('HF_FAIL', str(e)[:300])

asyncio.run(main())
