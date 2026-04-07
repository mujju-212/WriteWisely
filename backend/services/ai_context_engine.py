"""
ai_context_engine.py — Personalized AI Context Builder
Dynamically constructs user context from errors, progress, and metrics
Injects context into every AI request for hyper-personalization
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from bson import ObjectId

# ─── Context Builder ───────────────────────────────────────────
class UserContextEngine:
    """Builds dynamic user context for AI personalization"""
    
    def __init__(self, db):
        self.db = db
    
    async def build_full_context(self, user_id: str) -> Dict[str, Any]:
        """
        Constructs comprehensive user context for AI personalization
        Returns: {
            weak_areas, recent_mistakes, learning_level,
            performance_metrics, learning_speed, achievements
        }
        """
        user = await self.db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return {}
        
        weak_areas = await self._get_weak_areas(user_id)
        recent_mistakes = await self._get_recent_mistakes(user_id)
        learning_level = await self._calculate_learning_level(user_id)
        performance_metrics = await self._compute_performance_metrics(user_id)
        learning_speed = await self._estimate_learning_speed(user_id)
        
        return {
            "user_id": user_id,
            "name": user.get("name"),
            "learning_level": learning_level,
            "weak_areas": weak_areas,
            "recent_mistakes": recent_mistakes,
            "performance_metrics": performance_metrics,
            "learning_speed": learning_speed,
            "credits": user.get("credits", 0),
            "streak": user.get("streak", 0),
            "total_practice_count": user.get("practice_count", 0),
        }
    
    async def _get_weak_areas(self, user_id: str) -> List[Dict]:
        """Identify user's weakest grammar/writing areas"""
        errors = list(await self.db.error_patterns.find(
            {"user_id": ObjectId(user_id)},
            sort=[("frequency", -1)],
            limit=5
        ).to_list(length=5))
        
        return [
            {
                "category": e.get("error_type"),
                "frequency": e.get("frequency", 0),
                "examples": e.get("examples", [])[:2],
                "needs_improvement": True
            }
            for e in errors
        ]
    
    async def _get_recent_mistakes(self, user_id: str) -> List[Dict]:
        """Get recent errors from last 7 days for immediate feedback"""
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        mistakes = list(await self.db.error_patterns.find(
            {
                "user_id": ObjectId(user_id),
                "last_occurred": {"$gte": seven_days_ago}
            },
            sort=[("last_occurred", -1)],
            limit=10
        ).to_list(length=10))
        
        return [
            {
                "type": m.get("error_type"),
                "count": m.get("frequency", 1),
                "last_seen": m.get("last_occurred"),
                "pattern": m.get("pattern")
            }
            for m in mistakes
        ]
    
    async def _calculate_learning_level(self, user_id: str) -> str:
        """Determine user's current learning level: Beginner/Intermediate/Advanced"""
        progress = await self.db.users.find_one(
            {"_id": ObjectId(user_id)},
            {"current_level": 1}
        )
        
        level = progress.get("current_level", 1) if progress else 1
        
        if level <= 10:
            return "Beginner"
        elif level <= 20:
            return "Intermediate"
        else:
            return "Advanced"
    
    async def _compute_performance_metrics(self, user_id: str) -> Dict[str, float]:
        """Calculate key performance indicators"""
        practice_records = list(await self.db.practice_records.find(
            {"user_id": ObjectId(user_id)},
            limit=50
        ).to_list(length=50))
        
        if not practice_records:
            return {
                "accuracy_rate": 0.0,
                "average_score": 0.0,
                "improvement_trend": "neutral"
            }
        
        scores = [r.get("score", 0) for r in practice_records]
        accuracy = sum(1 for s in scores if s >= 7) / len(scores) if scores else 0
        
        # Calculate trend
        recent_avg = sum(scores[-10:]) / len(scores[-10:]) if len(scores) >= 10 else sum(scores) / len(scores)
        past_avg = sum(scores[-30:-10]) / len(scores[-30:-10]) if len(scores) > 20 else recent_avg
        
        trend = "improving" if recent_avg > past_avg else ("declining" if recent_avg < past_avg else "stable")
        
        return {
            "accuracy_rate": round(accuracy, 2),
            "average_score": round(sum(scores) / len(scores), 1),
            "improvement_trend": trend
        }
    
    async def _estimate_learning_speed(self, user_id: str) -> str:
        """Estimate how quickly user is learning: Fast/Normal/Slow"""
        progress = await self.db.learning_progress.find(
            {"user_id": ObjectId(user_id)},
            sort=[("completed_at", -1)],
            limit=5
        ).to_list(length=5)
        
        if len(progress) < 2:
            return "unknown"
        
        # Calculate time between completions
        times = [p.get("completed_at") for p in progress if p.get("completed_at")]
        if len(times) < 2:
            return "unknown"
        
        time_diffs = []
        for i in range(len(times) - 1):
            diff = (times[i] - times[i + 1]).total_seconds() / 3600  # hours
            time_diffs.append(diff)
        
        avg_hours = sum(time_diffs) / len(time_diffs)
        
        if avg_hours < 2:
            return "fast"
        elif avg_hours < 8:
            return "normal"
        else:
            return "slow"
    
    async def build_chat_context(self, user_id: str) -> str:
        """
        Build condensed context string for chat LLM
        Used to inject into system prompt
        """
        context = await self.build_full_context(user_id)
        
        weak_areas_str = ", ".join([w["category"] for w in context.get("weak_areas", [])])
        performance = context.get("performance_metrics", {})
        recent_mistakes = context.get('recent_mistakes', [])
        recent_errors_str = ", ".join([m['type'] for m in recent_mistakes[:3]])
        
        return f"""
User Context:
- Name: {context.get('name')}
- Level: {context.get('learning_level')}
- Weak Areas: {weak_areas_str or 'None identified'}
- Accuracy: {performance.get('accuracy_rate', 0)*100}%
- Trend: {performance.get('improvement_trend', 'unknown')}
- Learning Speed: {context.get('learning_speed')}
- Streak: {context.get('streak')} days
- Recent Errors: {recent_errors_str}
"""
    
    async def build_suggestion_context(self, user_id: str, text: str) -> Dict[str, Any]:
        """
        Build AI suggestion context based on user's weak areas
        Helps AI prioritize feedback on user's specific problems
        """
        weak_areas = await self._get_weak_areas(user_id)
        recent_mistakes = await self._get_recent_mistakes(user_id)
        
        return {
            "text_to_check": text,
            "focus_areas": [w["category"] for w in weak_areas[:3]],
            "recent_error_types": [m["type"] for m in recent_mistakes[:3]],
            "prioritize_feedback": {
                "spelling": any("spelling" in w["category"].lower() for w in weak_areas),
                "grammar": any("grammar" in w["category"].lower() for w in weak_areas),
                "punctuation": any("punctuation" in w["category"].lower() for w in weak_areas),
            }
        }


# ─── Context Middleware ────────────────────────────────────────
async def inject_user_context(db, user_id: str, prompt: str) -> str:
    """
    Injects user context into a prompt for personalization
    Usage: personalized_prompt = await inject_user_context(db, user_id, base_prompt)
    """
    engine = UserContextEngine(db)
    context = await engine.build_chat_context(user_id)
    return f"{context}\n\n{prompt}"
