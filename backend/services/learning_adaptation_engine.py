"""
learning_adaptation_engine.py — AI-Driven Learning Recommendations
Recommends lessons based on weak areas and mistakes
Generates personalized learning paths
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from bson import ObjectId

# ─── Learning Recommendation Engine ────────────────────────────
class LearningAdaptationEngine:
    """Provides intelligent learning recommendations based on user data"""
    
    def __init__(self, db):
        self.db = db
    
    async def get_recommended_lessons(
        self,
        user_id: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Recommends lessons based on:
        1. Weak areas from error patterns
        2. Recent mistakes
        3. User's learning level
        Returns: List of lesson recommendations with rationale
        """
        
        weak_areas = await self._get_weak_areas(user_id)
        user_level = await self._get_user_level(user_id)
        completed_lessons = await self._get_completed_lessons(user_id)
        
        recommendations = []
        
        for weak_area in weak_areas[:limit]:
            lesson = await self._find_lesson_for_area(weak_area, user_level, completed_lessons)
            if lesson:
                recommendation = {
                    "lesson_id": lesson.get("_id"),
                    "title": lesson.get("title"),
                    "topic": lesson.get("topic"),
                    "reason": f"You've made {weak_area['frequency']} mistakes in {weak_area['category']}",
                    "priority": "high" if weak_area["frequency"] > 5 else "medium",
                    "estimated_time": lesson.get("estimated_time", 15),
                    "difficulty": lesson.get("difficulty_level"),
                    "relevance_score": weak_area["frequency"] / 10  # Normalize to 0-1
                }
                recommendations.append(recommendation)
        
        # Sort by relevance
        recommendations.sort(key=lambda x: x["relevance_score"], reverse=True)
        return recommendations[:limit]
    
    async def get_micro_lesson(
        self,
        topic: str,
        user_level: str,
        weak_area: str = None
    ) -> Dict[str, Any]:
        """
        Generate or retrieve a micro-lesson (5-10 min)
        from LLM if needed
        """
        
        # Check if micro-lesson exists in cache
        cached = await self.db.micro_lessons.find_one({
            "topic": topic,
            "level": user_level
        })
        
        if cached:
            return cached
        
        # Would call LLM to generate micro-lesson
        # Placeholder for actual LLM integration
        return {
            "topic": topic,
            "level": user_level,
            "content": f"Micro-lesson on {topic} for {user_level} learners",
            "estimated_time": 7,
            "key_points": ["Point 1", "Point 2", "Point 3"],
            "examples": ["Example 1", "Example 2"]
        }
    
    async def _get_weak_areas(self, user_id: str) -> List[Dict]:
        """Get user's weak areas from error patterns"""
        errors = list(await self.db.error_patterns.find(
            {"user_id": ObjectId(user_id)},
            sort=[("frequency", -1)],
            limit=10
        ).to_list(length=10))
        
        return [
            {
                "category": e.get("error_type"),
                "frequency": e.get("frequency", 0),
                "examples": e.get("examples", [])
            }
            for e in errors
        ]
    
    async def _get_user_level(self, user_id: str) -> str:
        """Get user's learning level"""
        user = await self.db.users.find_one(
            {"_id": ObjectId(user_id)},
            {"current_level": 1}
        )
        
        level = user.get("current_level", 1) if user else 1
        
        if level <= 10:
            return "Beginner"
        elif level <= 20:
            return "Intermediate"
        else:
            return "Advanced"
    
    async def _get_completed_lessons(self, user_id: str) -> List[int]:
        """Get list of completed lesson IDs"""
        progress = list(await self.db.learning_progress.find(
            {"user_id": ObjectId(user_id), "completed": True},
            {"level_number": 1}
        ).to_list(length=30))
        
        return [p.get("level_number") for p in progress]
    
    async def _find_lesson_for_area(
        self,
        weak_area: Dict,
        user_level: str,
        completed_lessons: List[int]
    ) -> Optional[Dict]:
        """Find appropriate lesson for weak area"""
        
        # Map error types to lesson topics
        topic_map = {
            "grammar": "Advanced Grammar Rules",
            "spelling": "Common Spelling Patterns",
            "punctuation": "Punctuation Mastery",
            "tense": "Verb Tenses Explained",
            "vocabulary": "Vocabulary Expansion",
            "clarity": "Writing for Clarity"
        }
        
        topic = topic_map.get(weak_area["category"], "General Writing")
        
        # Find uncompleted lesson with this topic
        # This would search your lessons database
        # Placeholder implementation:
        return {
            "_id": 1,
            "title": f"Lesson: {topic}",
            "topic": topic,
            "difficulty_level": user_level,
            "estimated_time": 20
        }
    
    async def create_learning_path(
        self,
        user_id: str,
        duration_days: int = 30
    ) -> Dict[str, Any]:
        """
        Creates a personalized learning path for next N days
        Based on weak areas and pace
        """
        
        weak_areas = await self._get_weak_areas(user_id)
        user_level = await self._get_user_level(user_id)
        
        path = {
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "duration_days": duration_days,
            "focus_areas": [w["category"] for w in weak_areas[:3]],
            "milestones": []
        }
        
        # Create weekly milestones
        weeks = duration_days // 7
        for week in range(1, weeks + 1):
            milestone = {
                "week": week,
                "goals": [
                    f"Reduce {weak_areas[0]['category']} errors by 20%" if weak_areas else "Improve writing",
                    f"Complete 5 practice sessions",
                    f"Master one new {weak_areas[0].get('category', 'writing')} concept"
                ],
                "recommended_lessons": await self.get_recommended_lessons(user_id, limit=3),
                "practice_count": 15,
                "target_score": 7.5
            }
            path["milestones"].append(milestone)
        
        return path


# ─── Smart Content Generation ───────────────────────────────────
class SmartContentGenerator:
    """Generates personalized practice content based on weak areas"""
    
    def __init__(self, db, llm_service):
        self.db = db
        self.llm_service = llm_service
    
    async def generate_practice_exercise(
        self,
        user_id: str,
        error_type: str,
        difficulty: int = 5
    ) -> Dict[str, Any]:
        """
        Generate a customized practice exercise
        Focuses on user's specific weak area
        """
        
        user_context = await self.db.users.find_one({"_id": ObjectId(user_id)})
        
        # Build exercise prompt based on error type and difficulty
        prompt = self._build_exercise_prompt(error_type, difficulty)
        
        # Call LLM to generate exercise
        # response = await self.llm_service.call_llm(prompt)
        
        # Placeholder
        exercise = {
            "type": error_type,
            "difficulty": difficulty,
            "task": f"Practice: Write about your weekend, focusing on {error_type}",
            "constraints": [
                "At least 100 words",
                "Use past tense",
                f"Avoid common {error_type} mistakes"
            ],
            "rubric": {
                error_type: 0.5,
                "clarity": 0.3,
                "completeness": 0.2
            }
        }
        
        return exercise
    
    def _build_exercise_prompt(self, error_type: str, difficulty: int) -> str:
        """Build LLM prompt to generate exercise"""
        
        return f"""
Generate a writing practice exercise focused on: {error_type}
Difficulty level: {difficulty}/10
Task type: Short writing prompt (50-100 words)

EXERCISE FORMAT:
- Task description
- 2-3 constraints or requirements
- Example of what a good response looks like
- Common mistakes to avoid
"""
