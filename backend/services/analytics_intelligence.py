"""
analytics_intelligence.py — Intelligent Analytics & Insights Engine
Computes improvement trends, weak area detection, skill classification
Generates performance predictions and visualizations
"""

from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from collections import Counter
import statistics

# ─── Analytics Engine ──────────────────────────────────────────
class AnalyticsIntelligenceEngine:
    """Generates intelligent insights from user analytics"""
    
    def __init__(self, db):
        self.db = db
    
    async def compute_improvement_trend(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Computes user's improvement trend over time
        Returns: trend direction, improvement percentage, velocity
        """
        
        since = datetime.utcnow() - timedelta(days=days)
        
        # Get practice records in time range
        records = list(await self.db.practice_records.find(
            {
                "user_id": ObjectId(user_id),
                "submitted_at": {"$gte": since}
            },
            sort=[("submitted_at", 1)]
        ).to_list(length=1000))
        
        if len(records) < 2:
            return {
                "trend": "insufficient_data",
                "data_points": len(records),
                "recommendation": "Keep practicing! We need more data to show your progress."
            }
        
        scores = [r.get("score", 0) for r in records]
        
        # Calculate metrics
        first_half = scores[:len(scores)//2]
        second_half = scores[len(scores)//2:]
        
        first_avg = sum(first_half) / len(first_half) if first_half else 0
        second_avg = sum(second_half) / len(second_half) if second_half else 0
        
        improvement = second_avg - first_avg
        improvement_percent = (improvement / first_avg * 100) if first_avg > 0 else 0
        
        # Calculate velocity (rate of improvement)
        velocity = improvement / (days / len(records)) if len(records) > 0 else 0
        
        # Determine trend
        if improvement > 1:
            trend = "improving"
            trend_icon = "📈"
        elif improvement < -1:
            trend = "declining"
            trend_icon = "📉"
        else:
            trend = "stable"
            trend_icon = "➡️"
        
        return {
            "trend": trend,
            "trend_icon": trend_icon,
            "improvement_score": round(improvement, 2),
            "improvement_percent": round(improvement_percent, 1),
            "velocity": round(velocity, 3),
            "first_period_avg": round(first_avg, 1),
            "second_period_avg": round(second_avg, 1),
            "data_points": len(records),
            "days_analyzed": days,
            "recommendation": self._get_trend_recommendation(trend, improvement_percent)
        }
    
    async def detect_weak_areas(
        self,
        user_id: str,
        min_frequency: int = 3
    ) -> Dict[str, Any]:
        """
        Detects and ranks user's weak areas
        Returns: heatmap, priority levels, recommendations
        """
        
        # Get error patterns
        patterns = list(await self.db.error_patterns.find(
            {"user_id": ObjectId(user_id)},
            sort=[("frequency", -1)]
        ).to_list(length=20))
        
        weak_areas = []
        total_errors = sum(p.get("frequency", 0) for p in patterns)
        
        for pattern in patterns:
            error_type = pattern.get("error_type", "Unknown")
            frequency = pattern.get("frequency", 0)
            percentage = (frequency / total_errors * 100) if total_errors > 0 else 0
            
            # Determine priority
            if percentage > 30:
                priority = "critical"
            elif percentage > 15:
                priority = "high"
            elif percentage > 5:
                priority = "medium"
            else:
                priority = "low"
            
            weak_areas.append({
                "category": error_type,
                "frequency": frequency,
                "percentage": round(percentage, 1),
                "priority": priority,
                "last_occurred": pattern.get("last_occurred")
            })
        
        # Create heatmap visualization data
        heatmap = {
            "categories": [w["category"] for w in weak_areas],
            "frequencies": [w["frequency"] for w in weak_areas],
            "priorities": [w["priority"] for w in weak_areas],
            "max_frequency": max([w["frequency"] for w in weak_areas]) if weak_areas else 0
        }
        
        return {
            "weak_areas": weak_areas,
            "heatmap": heatmap,
            "total_errors": total_errors,
            "critical_areas": [w for w in weak_areas if w["priority"] == "critical"],
            "focus_recommendation": weak_areas[0] if weak_areas else None
        }
    
    async def classify_skill_level(self, user_id: str) -> Dict[str, Any]:
        """
        Classifies user's overall writing skill level
        Based on: accuracy, speed, vocabulary, consistency
        """
        
        user = await self.db.users.find_one({"_id": ObjectId(user_id)})
        
        # Get recent scores
        records = list(await self.db.practice_records.find(
            {"user_id": ObjectId(user_id)},
            sort=[("submitted_at", -1)],
            limit=20
        ).to_list(length=20))
        
        if not records:
            return {
                "level": "Beginner",
                "confidence": 0.0,
                "based_on": "Insufficient data"
            }
        
        scores = [r.get("score", 0) for r in records]
        avg_score = statistics.mean(scores)
        score_variance = statistics.stdev(scores) if len(scores) > 1 else 0
        
        # Consistency (low variance = more consistent)
        consistency = max(0, 10 - score_variance)
        
        # Classify skill level
        if avg_score >= 8.5:
            level = "Expert"
            description = "Excellent writing with minimal errors"
        elif avg_score >= 7.5:
            level = "Advanced"
            description = "Strong writing with good accuracy"
        elif avg_score >= 6.5:
            level = "Intermediate"
            description = "Competent writing with room for improvement"
        elif avg_score >= 5.5:
            level = "Elementary"
            description = "Developing writer with several areas to improve"
        else:
            level = "Beginner"
            description = "Early stage learner, building foundations"
        
        return {
            "level": level,
            "description": description,
            "average_score": round(avg_score, 1),
            "consistency": round(consistency, 1),
            "confidence": min(1.0, len(records) / 20),  # More data = higher confidence
            "total_submissions": len(records),
            "certification_ready": avg_score >= 8.0,
            "next_milestone": self._get_next_milestone(level)
        }
    
    async def predict_next_score(self, user_id: str) -> Dict[str, Any]:
        """
        Predicts user's likely next practice score
        Based on trend and variance
        """
        
        records = list(await self.db.practice_records.find(
            {"user_id": ObjectId(user_id)},
            sort=[("submitted_at", -1)],
            limit=10
        ).to_list(length=10))
        
        if len(records) < 3:
            return {"prediction": "Unknown", "confidence": 0.0}
        
        scores = [r.get("score", 0) for r in records]
        scores.reverse()  # Chronological order
        
        # Simple trend-based prediction
        recent_avg = statistics.mean(scores[-5:])
        trend = scores[-1] - scores[0]  # Last vs first
        
        if trend > 0:
            predicted = min(10.0, recent_avg + (trend * 0.3))
        elif trend < 0:
            predicted = max(0.0, recent_avg + (trend * 0.3))
        else:
            predicted = recent_avg
        
        confidence = min(0.8, len(records) / 15)
        
        return {
            "predicted_score": round(predicted, 1),
            "confidence": round(confidence, 2),
            "trend": "improving" if trend > 0.5 else ("declining" if trend < -0.5 else "stable"),
            "advice": "Keep practicing! You're on the right track." if predicted > recent_avg else "Focus on consistent practice."
        }
    
    async def generate_performance_report(self, user_id: str) -> Dict[str, Any]:
        """
        Generates comprehensive performance report
        """
        
        trend = await self.compute_improvement_trend(user_id, 30)
        weak_areas = await self.detect_weak_areas(user_id)
        skill_level = await self.classify_skill_level(user_id)
        prediction = await self.predict_next_score(user_id)
        
        # Get practice statistics
        records = list(await self.db.practice_records.find(
            {"user_id": ObjectId(user_id)}
        ).to_list(length=1000))
        
        total_practices = len(records)
        avg_score = statistics.mean([r.get("score", 0) for r in records]) if records else 0
        
        return {
            "generated_at": datetime.utcnow(),
            "user_id": user_id,
            "overview": {
                "total_practices": total_practices,
                "average_score": round(avg_score, 1),
                "skill_level": skill_level,
                "streak": await self._get_current_streak(user_id)
            },
            "improvement": trend,
            "weak_areas": weak_areas,
            "predictions": prediction,
            "recommendations": await self._generate_recommendations(user_id, weak_areas, trend),
            "visualization_data": {
                "score_history": [r.get("score") for r in records[-30:]],
                "weak_area_distribution": weak_areas.get("heatmap")
            }
        }
    
    async def _get_current_streak(self, user_id: str) -> Dict[str, int]:
        """Get current practice streak"""
        
        records = list(await self.db.practice_records.find(
            {"user_id": ObjectId(user_id)},
            sort=[("submitted_at", -1)],
            limit=30
        ).to_list(length=30))
        
        if not records:
            return {"days": 0, "practice_count": 0}
        
        streak_days = 0
        streak_practices = 0
        
        today = datetime.utcnow().date()
        current_date = today
        
        for record in records:
            record_date = record.get("submitted_at").date()
            
            if record_date == current_date or record_date == (current_date - timedelta(days=streak_days)):
                streak_days += 1
                streak_practices += 1
                current_date = record_date
            else:
                break
        
        return {"days": max(1, streak_days), "practice_count": streak_practices}
    
    async def _generate_recommendations(
        self,
        user_id: str,
        weak_areas: Dict,
        trend: Dict
    ) -> List[str]:
        """Generate actionable recommendations"""
        
        recommendations = []
        
        # Based on weak areas
        if weak_areas.get("critical_areas"):
            critical = weak_areas["critical_areas"][0]
            recommendations.append(
                f"Focus on improving {critical['category']} - "
                f"this accounts for {critical['percentage']}% of your errors"
            )
        
        # Based on trend
        if trend.get("trend") == "declining":
            recommendations.append(
                "Your scores are declining. Try taking shorter, focused practice sessions."
            )
        elif trend.get("trend") == "improving":
            recommendations.append(
                f"Great! You're improving at {trend['improvement_percent']}% - keep up the momentum!"
            )
        
        # General recommendations
        recommendations.append("Complete one lesson from your recommended learn path")
        recommendations.append("Review error explanations from recent corrections")
        
        return recommendations[:3]
    
    def _get_trend_recommendation(self, trend: str, improvement_percent: float) -> str:
        """Get recommendation based on trend"""
        
        if trend == "improving":
            return f"Excellent! Your performance improved by {improvement_percent}%. Keep practicing!"
        elif trend == "declining":
            return f"Your performance declined by {abs(improvement_percent)}%. Focus on consolidating concepts."
        else:
            return "Your performance is stable. Try new types of practice to improve."
    
    def _get_next_milestone(self, current_level: str) -> str:
        """Get next skill milestone"""
        
        milestones = {
            "Beginner": "Elementary",
            "Elementary": "Intermediate",
            "Intermediate": "Advanced",
            "Advanced": "Expert"
        }
        
        return milestones.get(current_level, "Master Edition")
