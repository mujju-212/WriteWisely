"""
routes/chat.py — AI Chat Routes
Context Injection: queries DB for user data → builds prompt → calls LLM
"""

import json
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from bson import ObjectId
from datetime import datetime

from config import get_db
from middleware.auth_middleware import get_current_user
from services.llm_service import call_llm_chat
from services.pattern_service import get_top_errors
from prompts.templates import get_prompt
from models.schemas import SendMessageRequest

router = APIRouter()


def _safe_preview(text: str, limit: int = 1200) -> str:
    if not text:
        return ""
    clean = " ".join(text.split())
    return clean[:limit]


def _extract_text_from_upload(filename: str, content: bytes) -> str:
    lower = (filename or "").lower()

    # MVP supports text-like documents for content injection.
    text_exts = (".txt", ".md", ".json", ".csv", ".log", ".py", ".js", ".jsx", ".ts", ".tsx")
    if lower.endswith(text_exts):
        return content.decode("utf-8", errors="ignore")

    # Fallback attempt for unknown extensions if content is mostly text.
    decoded = content.decode("utf-8", errors="ignore")
    if decoded and len(decoded.strip()) > 0:
        return decoded

    raise HTTPException(status_code=400, detail="Unsupported file type for text context injection")


@router.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(default=""),
    user=Depends(get_current_user)
):
    db = get_db()

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max size is 2MB")

    text = _extract_text_from_upload(file.filename or "document", content)
    if len(text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Document has too little text content")

    now = datetime.utcnow()
    doc = {
        "user_id": user["id"],
        "title": title.strip() or file.filename or "Uploaded Document",
        "filename": file.filename or "document",
        "mime_type": file.content_type or "application/octet-stream",
        "content": text,
        "content_preview": _safe_preview(text),
        "word_count": len(text.split()),
        "created_at": now,
        "updated_at": now,
    }
    result = await db.chat_documents.insert_one(doc)

    return {
        "id": str(result.inserted_id),
        "title": doc["title"],
        "filename": doc["filename"],
        "word_count": doc["word_count"],
        "preview": doc["content_preview"],
        "message": "Document uploaded successfully"
    }


@router.get("/documents")
async def list_chat_documents(user=Depends(get_current_user)):
    db = get_db()
    docs = await db.chat_documents.find(
        {"user_id": user["id"]}
    ).sort("updated_at", -1).limit(50).to_list(length=50)

    return {
        "documents": [
            {
                "id": str(d["_id"]),
                "title": d.get("title", "Document"),
                "filename": d.get("filename", "document"),
                "word_count": d.get("word_count", 0),
                "preview": d.get("content_preview", ""),
                "updated_at": d.get("updated_at", d.get("created_at", datetime.utcnow())).isoformat()
            }
            for d in docs
        ]
    }


@router.delete("/documents/{document_id}")
async def delete_chat_document(document_id: str, user=Depends(get_current_user)):
    db = get_db()
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=400, detail="Invalid document id")

    result = await db.chat_documents.delete_one({
        "_id": ObjectId(document_id),
        "user_id": user["id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"message": "Document deleted"}


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
    
    # Pull user-selected uploaded docs for context injection
    selected_doc_ids = [d for d in (data.document_ids or []) if ObjectId.is_valid(d)]
    documents = []
    if selected_doc_ids:
        documents = await db.chat_documents.find({
            "_id": {"$in": [ObjectId(did) for did in selected_doc_ids]},
            "user_id": user_id
        }).to_list(length=10)
    else:
        documents = await db.chat_documents.find({"user_id": user_id}).sort("updated_at", -1).limit(2).to_list(length=2)

    docs_context = "No uploaded documents provided."
    if documents:
        docs_parts = []
        for d in documents:
            title = d.get("title", d.get("filename", "Document"))
            preview = _safe_preview(d.get("content", ""), limit=1400)
            docs_parts.append(f"Document: {title}\nContent: {preview}")
        docs_context = "\n\n".join(docs_parts)

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
    system_prompt += (
        "\n\nUPLOADED DOCUMENT CONTEXT (for reference while answering):\n"
        f"{docs_context}\n"
        "Use document context only when relevant to the user's question."
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
                        {
                            "role": "assistant",
                            "content": ai_reply,
                            "timestamp": now,
                            "context_used": {
                                "level": profile.get("current_level", 1),
                                "top_errors_count": len(top_errors),
                                "practice_scores": practice_scores,
                                "document_ids": [str(d.get("_id")) for d in documents],
                                "document_titles": [d.get("title", d.get("filename", "Document")) for d in documents]
                            }
                        }
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
