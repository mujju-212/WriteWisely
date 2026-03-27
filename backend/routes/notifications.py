"""
routes/notifications.py — Notification APIs
"""

from datetime import datetime
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from config import get_db
from middleware.auth_middleware import get_current_user

router = APIRouter()


class MarkReadRequest(BaseModel):
    notification_ids: List[str] = Field(default_factory=list)


def _user_match(user_id: str):
    """Match notification documents for current user across ObjectId/string formats."""
    ids = [user_id]
    if ObjectId.is_valid(user_id):
        ids.append(ObjectId(user_id))
    return {"$in": ids}


def _time_ago(created_at: datetime) -> str:
    if not created_at:
        return ""

    now = datetime.utcnow()
    diff = now - created_at
    seconds = int(diff.total_seconds())

    if seconds < 60:
        return "Just now"

    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"

    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour{'s' if hours != 1 else ''} ago"

    days = hours // 24
    if days == 1:
        return "Yesterday"
    if days < 7:
        return f"{days} days ago"

    return created_at.strftime("%b %d")


@router.get("")
async def get_notifications(user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]

    base_query = {"user_id": _user_match(user_id)}

    docs = await db.notifications.find(base_query).sort("created_at", -1).limit(10).to_list(length=10)

    unread_count = await db.notifications.count_documents({
        "user_id": _user_match(user_id),
        "read": False,
    })

    notifications = []
    for d in docs:
        created_at = d.get("created_at", datetime.utcnow())
        notifications.append({
            "id": str(d.get("_id")),
            "type": d.get("type", "system"),
            "title": d.get("title", "Notification"),
            "message": d.get("message", ""),
            "icon": d.get("icon", "📢"),
            "read": bool(d.get("read", False)),
            "action_url": d.get("action_url", "/dashboard"),
            "metadata": d.get("metadata", {}),
            "created_at": created_at.isoformat() if isinstance(created_at, datetime) else str(created_at),
            "time_ago": _time_ago(created_at) if isinstance(created_at, datetime) else "",
        })

    return {
        "notifications": notifications,
        "unread_count": unread_count,
    }


@router.patch("/mark-read")
async def mark_notifications_read(payload: MarkReadRequest, user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]

    valid_ids = [ObjectId(i) for i in payload.notification_ids if ObjectId.is_valid(i)]
    if valid_ids:
        await db.notifications.update_many(
            {
                "_id": {"$in": valid_ids},
                "user_id": _user_match(user_id),
            },
            {"$set": {"read": True}},
        )

    unread_count = await db.notifications.count_documents({
        "user_id": _user_match(user_id),
        "read": False,
    })

    return {
        "message": "Marked as read",
        "unread_count": unread_count,
    }


@router.patch("/mark-all-read")
async def mark_all_notifications_read(user=Depends(get_current_user)):
    db = get_db()
    user_id = user["id"]

    await db.notifications.update_many(
        {
            "user_id": _user_match(user_id),
            "read": False,
        },
        {"$set": {"read": True}},
    )

    return {
        "message": "All notifications marked as read",
        "unread_count": 0,
    }
