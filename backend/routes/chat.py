"""
routes/chat.py — AI Chat Routes
Context Injection: queries DB for user data → builds prompt → calls LLM
"""

import json
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime

from config import get_db
from middleware.auth_middleware import get_current_user
from services.llm_service import call_llm_chat
from services.pattern_service import get_top_errors
from prompts.templates import get_prompt
from models.schemas import SendMessageRequest

router = APIRouter()


# ─── Get Chat History ─────────────────────────────────────────
@router.get("/history")
async def get_chat_history(user=Depends(get_current_user)):
    db = get_db()
    
    chat_doc = await db.chat_history.find_one({"user_id": user["id"]})
    
    if not chat_doc or not chat_doc.get("messages"):
        return {"messages": []}
    
    # Return last 20 messages
    messages = chat_doc["messages"][-20:]
    
    return {
        "messages": [
            {
                "role": m["role"],
                "content": m["content"],
                "timestamp": m.get("timestamp", "").isoformat() if isinstance(m.get("timestamp"), datetime) else str(m.get("timestamp", ""))
            }
            for m in messages
        ]
    }


# ─── Send Message ─────────────────────────────────────────────
@router.post("/send")
async def send_message(data: SendMessageRequest, user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]
    profile = user.get("profile", {})
    
    # ─── STEP 1: Build user context from DB (Context Injection) ───
    
    # Top errors
    top_errors = await get_top_errors(user_id, limit=5)
    
    # Recent practice scores
    recent_practice = await db.practice_records.find(
        {"user_id": user_id}
    ).sort("submitted_at", -1).limit(3).to_list(length=3)
    
    practice_scores = [
        {"task": p.get("task_type", "unknown"), "score": p.get("overall_score", 0)}
        for p in recent_practice
    ]
    
    # Lessons completed
    lessons_done = await db.learning_progress.count_documents(
        {"user_id": user_id, "status": "completed"}
    )
    
    # ─── STEP 2: Build system prompt with context ─────────────
    
    system_prompt = get_prompt(
        "chat_coach",
        user_name=user.get("name", "Student"),
        level=profile.get("current_level", 1),
        credits=profile.get("total_credits", 0),
        streak=profile.get("current_streak", 0),
        strengths=", ".join(profile.get("strengths", ["Not assessed yet"])),
        weaknesses=", ".join(profile.get("weaknesses", ["Not assessed yet"])),
        lessons_completed=lessons_done,
        recent_errors=json.dumps(top_errors) if top_errors else "No errors recorded yet",
        practice_scores=json.dumps(practice_scores) if practice_scores else "No practice done yet"
    )
    
    # ─── STEP 3: Get chat history (last 6 messages) ───────────
    
    chat_doc = await db.chat_history.find_one({"user_id": user_id})
    recent_messages = []
    
    if chat_doc and chat_doc.get("messages"):
        recent_msgs = chat_doc["messages"][-6:]
        for msg in recent_msgs:
            recent_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
    
    # ─── STEP 4: Build messages array for LLM ─────────────────
    
    messages_to_send = [
        {"role": "system", "content": system_prompt}
    ]
    messages_to_send.extend(recent_messages)
    messages_to_send.append({"role": "user", "content": data.message})
    
    # ─── STEP 5: Call LLM ─────────────────────────────────────
    
    try:
        ai_reply = await call_llm_chat(messages_to_send)
    except Exception as e:
        ai_reply = (
            f"I'm having trouble connecting right now. 😅 "
            f"But I can see you're at Level {profile.get('current_level', 1)} "
            f"with {profile.get('total_credits', 0)} credits! "
            f"Try asking me again in a moment."
        )
    
    # ─── STEP 6: Save messages to chat history ────────────────
    
    now = datetime.utcnow()
    
    await db.chat_history.update_one(
        {"user_id": user_id},
        {
            "$push": {
                "messages": {
                    "$each": [
                        {"role": "user", "content": data.message, "timestamp": now},
                        {"role": "assistant", "content": ai_reply, "timestamp": now}
                    ]
                }
            }
        },
        upsert=True
    )
    
    return {"response": ai_reply}


# ─── Clear Chat History ───────────────────────────────────────
@router.delete("/clear")
async def clear_chat(user=Depends(get_current_user)):
    db = get_db()
    
    await db.chat_history.update_one(
        {"user_id": user["id"]},
        {"$set": {"messages": []}}
    )
    
    return {"message": "Chat history cleared!"}
