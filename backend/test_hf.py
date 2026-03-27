"""Test HuggingFace Inference API."""
import asyncio, httpx, os
from dotenv import load_dotenv
load_dotenv()

HF_KEY = os.getenv("HF_API_KEY")
HF_MODEL = os.getenv("HF_MODEL", "meta-llama/Llama-3.1-8B-Instruct")

async def test_hf():
    print(f"Testing HuggingFace model: {HF_MODEL}")
    
    url = f"https://router.huggingface.co/hf-inference/models/{HF_MODEL}/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {HF_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": HF_MODEL,
        "messages": [
            {"role": "system", "content": "You are a JSON-only responder. Return ONLY valid JSON, no markdown."},
            {"role": "user", "content": 'Check spelling: "I recieved the package yesterady". Return JSON: {"errors": [{"word": "wrong", "fix": "right"}]}'}
        ],
        "max_tokens": 300,
        "temperature": 0.3
    }
    
    async with httpx.AsyncClient(timeout=30.0) as c:
        r = await c.post(url, json=body, headers=headers)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            content = data["choices"][0]["message"]["content"]
            print(f"✅ HuggingFace WORKS!")
            print(f"Response: {content[:200]}")
            return True
        else:
            print(f"❌ Failed: {r.text[:400]}")
            return False

asyncio.run(test_hf())
