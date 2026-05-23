"""Helpers for quietly collecting training data from real usage."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional


async def log_grammar_pair(
    db: Any,
    input_text: str,
    errors_found: list[dict],
    corrected_text: str,
    mode: str,
    user_level: str,
    *,
    engine: Optional[str] = None,
    user_id: Optional[str] = None,
) -> None:
    """Save grammar input/output pairs for future fine-tuning."""
    if db is None:
        return

    await db.training_data.insert_one(
        {
            "type": "grammar_check",
            "input": input_text,
            "output": {
                "errors": errors_found,
                "corrected": corrected_text,
            },
            "metadata": {
                "mode": mode,
                "level": user_level,
                "engine": engine,
                "user_id": user_id,
            },
            "created_at": datetime.utcnow(),
        }
    )


async def log_classification_pair(
    db: Any,
    message: str,
    classified_as: str,
    *,
    user_id: Optional[str] = None,
) -> None:
    """Save message classification pairs for future local models."""
    if db is None:
        return

    await db.training_data.insert_one(
        {
            "type": "message_classification",
            "input": message,
            "output": classified_as,
            "metadata": {"user_id": user_id},
            "created_at": datetime.utcnow(),
        }
    )
