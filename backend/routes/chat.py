"""
routes/chat.py - AI chat routes with multi-conversation support.

Supports:
- Conversation list/create/rename/delete
- Per-conversation history
- Message send with optional document + referenced conversation context
- Uploaded document list/delete
"""

import json
import re
from datetime import datetime
from io import BytesIO
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel

from config import get_db
from middleware.auth_middleware import get_current_user
from models.schemas import SendMessageRequest
from prompts.templates import get_prompt
from services.llm_service import call_llm_chat
from services.pattern_service import get_top_errors

try:
    from pypdf import PdfReader
except Exception:
    PdfReader = None

router = APIRouter()


class ConversationCreateRequest(BaseModel):
    title: Optional[str] = None
    reference_conversation_ids: Optional[List[str]] = None


class ConversationUpdateRequest(BaseModel):
    title: Optional[str] = None
    reference_conversation_ids: Optional[List[str]] = None


def _safe_preview(text: str, limit: int = 1200) -> str:
    if not text:
        return ""
    clean = " ".join(text.split())
    return clean[:limit]


def _contains_false_doc_access_denial(text: str) -> bool:
    """Detect responses that incorrectly claim uploaded docs are inaccessible."""
    if not text:
        return False

    normalized = " ".join(text.lower().split())
    has_doc_reference = re.search(r"\b(upload|uploaded|document|documents|file|files|pdf|attachment)\b", normalized)
    has_denial = re.search(
        r"(do not have access|don't have access|did not have access|didn't have access|"
        r"cannot access|can't access|could not access|couldn't access|no access)",
        normalized,
    )
    return bool(has_doc_reference and has_denial)


def _extract_text_from_upload(filename: str, content: bytes) -> str:
    lower = (filename or "").lower()

    if lower.endswith(".pdf"):
        if PdfReader is None:
            raise HTTPException(
                status_code=500,
                detail="PDF support is not available on the server. Install pypdf and retry.",
            )

        try:
            reader = PdfReader(BytesIO(content))
            extracted_pages = []
            for page in reader.pages:
                page_text = (page.extract_text() or "").strip()
                if page_text:
                    extracted_pages.append(page_text)

            extracted = "\n\n".join(extracted_pages).strip()
            if extracted:
                return extracted

            raise HTTPException(status_code=400, detail="Could not extract readable text from PDF")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid or unreadable PDF file")

    text_exts = (".txt", ".md", ".json", ".csv", ".log", ".py", ".js", ".jsx", ".ts", ".tsx")
    if lower.endswith(text_exts):
        return content.decode("utf-8", errors="ignore")

    decoded = content.decode("utf-8", errors="ignore")
    if decoded and len(decoded.strip()) > 0:
        return decoded

    raise HTTPException(status_code=400, detail="Unsupported file type for text context injection")


def _conversation_title_from_text(text: str, fallback: str = "New Chat") -> str:
    clean = " ".join((text or "").split()).strip()
    if not clean:
        return fallback
    if len(clean) <= 60:
        return clean
    return clean[:57] + "..."


def _normalize_reference_ids(raw_ids: Optional[List[str]], exclude_id: Optional[str] = None) -> List[str]:
    refs: List[str] = []
    for cid in raw_ids or []:
        if not isinstance(cid, str) or not ObjectId.is_valid(cid):
            continue
        if exclude_id and cid == exclude_id:
            continue
        if cid not in refs:
            refs.append(cid)
    return refs


def _timestamp_to_string(value) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value or "")


def _build_conversation_summary(doc: dict) -> dict:
    messages = doc.get("messages", []) or []

    preview_source = ""
    for msg in reversed(messages):
        if msg.get("role") == "user" and (msg.get("content") or "").strip():
            preview_source = (msg.get("content") or "").strip()
            break
    if not preview_source and messages:
        preview_source = (messages[-1].get("content") or "").strip()

    preview = _safe_preview(preview_source, limit=90)

    created_at = doc.get("created_at")
    if not isinstance(created_at, datetime):
        if isinstance(doc.get("_id"), ObjectId):
            created_at = doc["_id"].generation_time
        else:
            created_at = datetime.utcnow()

    updated_at = doc.get("updated_at")
    if not isinstance(updated_at, datetime):
        updated_at = created_at

    title = (doc.get("title") or "").strip()
    if not title:
        title = _conversation_title_from_text(preview_source)

    refs = _normalize_reference_ids(doc.get("reference_conversation_ids"), exclude_id=str(doc.get("_id")))

    return {
        "id": str(doc.get("_id")),
        "title": title,
        "preview": preview,
        "message_count": len(messages),
        "created_at": created_at.isoformat(),
        "updated_at": updated_at.isoformat(),
        "reference_conversation_ids": refs,
    }


async def _fetch_user_conversation(db, user_id: str, conversation_id: str):
    return await db.chat_history.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": user_id,
    })


async def _fetch_latest_user_conversation(db, user_id: str):
    return await db.chat_history.find_one(
        {"user_id": user_id},
        sort=[("updated_at", -1), ("_id", -1)],
    )


async def _load_referenced_conversations_context(
    db,
    user_id: str,
    reference_ids: List[str],
    exclude_id: Optional[str] = None,
) -> str:
    refs = _normalize_reference_ids(reference_ids, exclude_id=exclude_id)
    if not refs:
        return ""

    object_ids = [ObjectId(cid) for cid in refs]
    docs = await db.chat_history.find({
        "_id": {"$in": object_ids},
        "user_id": user_id,
    }).to_list(length=10)

    if not docs:
        return ""

    sections = []
    for conv in docs:
        title = (conv.get("title") or "").strip() or "Referenced Chat"
        msgs = conv.get("messages", [])[-6:]
        lines = []
        for msg in msgs:
            role = "User" if msg.get("role") == "user" else "Assistant"
            content = _safe_preview(msg.get("content", ""), limit=420)
            if content:
                lines.append(f"{role}: {content}")

        if lines:
            sections.append(f"Referenced Chat: {title}\n" + "\n".join(lines))

    return "\n\n".join(sections)


@router.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(default=""),
    user=Depends(get_current_user),
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
        "message": "Document uploaded successfully",
    }


@router.get("/documents")
async def list_chat_documents(user=Depends(get_current_user)):
    db = get_db()
    docs = await db.chat_documents.find({"user_id": user["id"]}).sort("updated_at", -1).limit(50).to_list(length=50)

    return {
        "documents": [
            {
                "id": str(d["_id"]),
                "title": d.get("title", "Document"),
                "filename": d.get("filename", "document"),
                "word_count": d.get("word_count", 0),
                "preview": d.get("content_preview", ""),
                "updated_at": d.get("updated_at", d.get("created_at", datetime.utcnow())).isoformat(),
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
        "user_id": user["id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"message": "Document deleted"}


@router.get("/conversations")
async def list_conversations(
    limit: int = Query(default=50, ge=1, le=100),
    user=Depends(get_current_user),
):
    db = get_db()

    docs = await db.chat_history.find({"user_id": user["id"]}).sort("updated_at", -1).limit(limit).to_list(length=limit)
    conversations = [_build_conversation_summary(doc) for doc in docs]

    return {
        "conversations": conversations,
        "active_conversation_id": conversations[0]["id"] if conversations else None,
    }


@router.post("/conversations")
async def create_conversation(data: ConversationCreateRequest, user=Depends(get_current_user)):
    db = get_db()
    now = datetime.utcnow()

    title = (data.title or "").strip() or "New Chat"
    refs = _normalize_reference_ids(data.reference_conversation_ids)

    doc = {
        "user_id": user["id"],
        "title": title[:120],
        "messages": [],
        "created_at": now,
        "updated_at": now,
        "reference_conversation_ids": refs,
    }

    result = await db.chat_history.insert_one(doc)
    doc["_id"] = result.inserted_id

    return {
        "conversation": _build_conversation_summary(doc),
        "message": "Conversation created",
    }


@router.patch("/conversations/{conversation_id}")
async def update_conversation(conversation_id: str, data: ConversationUpdateRequest, user=Depends(get_current_user)):
    db = get_db()

    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(status_code=400, detail="Invalid conversation id")

    existing = await _fetch_user_conversation(db, user["id"], conversation_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Conversation not found")

    updates = {}

    if data.title is not None:
        title = data.title.strip() or "New Chat"
        updates["title"] = title[:120]

    if data.reference_conversation_ids is not None:
        updates["reference_conversation_ids"] = _normalize_reference_ids(
            data.reference_conversation_ids,
            exclude_id=conversation_id,
        )

    if not updates:
        return {"conversation": _build_conversation_summary(existing)}

    updates["updated_at"] = datetime.utcnow()

    await db.chat_history.update_one(
        {"_id": ObjectId(conversation_id), "user_id": user["id"]},
        {"$set": updates},
    )

    updated = await _fetch_user_conversation(db, user["id"], conversation_id)
    return {
        "conversation": _build_conversation_summary(updated),
        "message": "Conversation updated",
    }


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, user=Depends(get_current_user)):
    db = get_db()

    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(status_code=400, detail="Invalid conversation id")

    result = await db.chat_history.delete_one({
        "_id": ObjectId(conversation_id),
        "user_id": user["id"],
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.chat_history.update_many(
        {"user_id": user["id"]},
        {"$pull": {"reference_conversation_ids": conversation_id}},
    )

    return {"message": "Conversation deleted"}


@router.get("/history")
async def get_chat_history(
    conversation_id: Optional[str] = Query(default=None),
    user=Depends(get_current_user),
):
    db = get_db()

    conversation = None
    if conversation_id:
        if not ObjectId.is_valid(conversation_id):
            raise HTTPException(status_code=400, detail="Invalid conversation id")
        conversation = await _fetch_user_conversation(db, user["id"], conversation_id)
    else:
        conversation = await _fetch_latest_user_conversation(db, user["id"])

    if not conversation:
        return {"messages": [], "conversation": None}

    messages = (conversation.get("messages") or [])[-50:]

    return {
        "messages": [
            {
                "role": msg.get("role", "assistant"),
                "content": msg.get("content", ""),
                "timestamp": _timestamp_to_string(msg.get("timestamp")),
            }
            for msg in messages
        ],
        "conversation": _build_conversation_summary(conversation),
    }


@router.post("/send")
async def send_message(data: SendMessageRequest, user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]
    profile = user.get("profile", {})

    conversation = None
    if data.conversation_id:
        if not ObjectId.is_valid(data.conversation_id):
            raise HTTPException(status_code=400, detail="Invalid conversation id")
        conversation = await _fetch_user_conversation(db, user_id, data.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = await _fetch_latest_user_conversation(db, user_id)

    now = datetime.utcnow()

    if not conversation:
        initial_title = _conversation_title_from_text(data.message)
        initial_refs = _normalize_reference_ids(data.reference_conversation_ids)
        new_doc = {
            "user_id": user_id,
            "title": initial_title,
            "messages": [],
            "created_at": now,
            "updated_at": now,
            "reference_conversation_ids": initial_refs,
        }
        inserted = await db.chat_history.insert_one(new_doc)
        new_doc["_id"] = inserted.inserted_id
        conversation = new_doc

    conversation_id = str(conversation["_id"])

    if data.reference_conversation_ids is not None:
        reference_ids = _normalize_reference_ids(data.reference_conversation_ids, exclude_id=conversation_id)
    else:
        reference_ids = _normalize_reference_ids(conversation.get("reference_conversation_ids"), exclude_id=conversation_id)

    if conversation.get("reference_conversation_ids") != reference_ids:
        await db.chat_history.update_one(
            {"_id": ObjectId(conversation_id), "user_id": user_id},
            {"$set": {"reference_conversation_ids": reference_ids, "updated_at": now}},
        )
        conversation["reference_conversation_ids"] = reference_ids

    top_errors = await get_top_errors(user_id, limit=5)

    recent_practice = await db.practice_records.find({"user_id": user_id}).sort("submitted_at", -1).limit(3).to_list(length=3)
    practice_scores = [
        {"task": p.get("task_type", "unknown"), "score": p.get("overall_score", 0)}
        for p in recent_practice
    ]

    lessons_done = await db.learning_progress.count_documents({"user_id": user_id, "status": "completed"})

    selected_doc_ids = [d for d in (data.document_ids or []) if ObjectId.is_valid(d)]
    if selected_doc_ids:
        documents = await db.chat_documents.find({
            "_id": {"$in": [ObjectId(did) for did in selected_doc_ids]},
            "user_id": user_id,
        }).to_list(length=10)
    else:
        documents = await db.chat_documents.find({"user_id": user_id}).sort("updated_at", -1).limit(2).to_list(length=2)

    docs_context = "No uploaded documents provided."
    if documents:
        docs_parts = []
        for doc in documents:
            title = doc.get("title", doc.get("filename", "Document"))
            preview = _safe_preview(doc.get("content", ""), limit=1400)
            docs_parts.append(f"Document: {title}\nContent: {preview}")
        docs_context = "\n\n".join(docs_parts)

    reference_context = await _load_referenced_conversations_context(
        db,
        user_id=user_id,
        reference_ids=reference_ids,
        exclude_id=conversation_id,
    )

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
        practice_scores=json.dumps(practice_scores) if practice_scores else "No practice done yet",
    )

    system_prompt += (
        "\n\nUPLOADED DOCUMENT CONTEXT (for reference while answering):\n"
        f"{docs_context}\n"
        "Use document context only when relevant to the user's question."
    )

    if documents:
        doc_titles = [doc.get("title", doc.get("filename", "Document")) for doc in documents]
        system_prompt += (
            "\nDOCUMENT ACCESS STATUS: Uploaded documents are available in context right now. "
            "Do not say you cannot access uploaded files."
        )
        system_prompt += "\nAVAILABLE DOCUMENT TITLES: " + ", ".join(doc_titles)
    else:
        system_prompt += "\nDOCUMENT ACCESS STATUS: No uploaded documents are currently available."

    if reference_context:
        system_prompt += (
            "\n\nREFERENCED CHAT CONTEXT (selected previous chats):\n"
            f"{reference_context}\n"
            "Use this context only when relevant to the user's question."
        )

    recent_messages = []
    for msg in (conversation.get("messages") or [])[-8:]:
        recent_messages.append({
            "role": msg.get("role", "assistant"),
            "content": msg.get("content", ""),
        })

    messages_to_send = [{"role": "system", "content": system_prompt}]
    messages_to_send.extend(recent_messages)
    messages_to_send.append({"role": "user", "content": data.message})

    try:
        ai_reply = await call_llm_chat(messages_to_send)

        if documents and _contains_false_doc_access_denial(ai_reply):
            try:
                correction_prompt = (
                    system_prompt
                    + "\n\nCRITICAL CORRECTION: Uploaded documents are available for this turn. "
                    "Rewrite your response. Never claim you cannot access uploaded documents. "
                    "Use available document context when relevant."
                )
                retry_messages = [{"role": "system", "content": correction_prompt}]
                retry_messages.extend(recent_messages)
                retry_messages.append({"role": "user", "content": data.message})
                corrected_reply = await call_llm_chat(retry_messages)
                if corrected_reply and corrected_reply.strip():
                    ai_reply = corrected_reply
            except Exception:
                pass
    except Exception:
        ai_reply = (
            "I am having trouble connecting right now. "
            f"You are at Level {profile.get('current_level', 1)} with "
            f"{profile.get('total_credits', 0)} credits. Please try again."
        )

    conversation_title = (conversation.get("title") or "").strip() or "New Chat"
    if conversation_title.lower() == "new chat" and len(conversation.get("messages") or []) == 0:
        conversation_title = _conversation_title_from_text(data.message)

    await db.chat_history.update_one(
        {"_id": ObjectId(conversation_id), "user_id": user_id},
        {
            "$set": {
                "updated_at": now,
                "title": conversation_title,
                "reference_conversation_ids": reference_ids,
            },
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
                                "document_ids": [str(doc.get("_id")) for doc in documents],
                                "document_titles": [doc.get("title", doc.get("filename", "Document")) for doc in documents],
                                "reference_conversation_ids": reference_ids,
                            },
                        },
                    ]
                }
            },
        },
        upsert=True,
    )

    return {
        "response": ai_reply,
        "conversation_id": conversation_id,
        "conversation_title": conversation_title,
        "reference_conversation_ids": reference_ids,
    }


@router.delete("/clear")
async def clear_chat(
    conversation_id: Optional[str] = Query(default=None),
    user=Depends(get_current_user),
):
    db = get_db()
    user_id = user["id"]

    conversation = None
    if conversation_id:
        if not ObjectId.is_valid(conversation_id):
            raise HTTPException(status_code=400, detail="Invalid conversation id")
        conversation = await _fetch_user_conversation(db, user_id, conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = await _fetch_latest_user_conversation(db, user_id)

    if not conversation:
        return {"message": "No chat conversation to clear", "conversation_id": None}

    cid = str(conversation["_id"])
    await db.chat_history.update_one(
        {"_id": ObjectId(cid), "user_id": user_id},
        {"$set": {"messages": [], "updated_at": datetime.utcnow()}},
    )

    return {"message": "Chat history cleared", "conversation_id": cid}
