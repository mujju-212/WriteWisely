"""
Dashboard Intelligence Service
Generates:
- AI-based daily goals
- Streak tracking and motivation
- Personalized recommendations
- Progress insights and milestones
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import json
from .llm_service import LLMService
from .analytics_intelligence import AnalyticsIntelligenceEngine


class DashboardIntelligenceEngine:
    """Generate personalized dashboard content"""
    
    def __init__(
        self, 
        db: AsyncIOMotorDatabase, 
        llm_service: LLMService,
        analytics_engine: AnalyticsIntelligenceEngine
    ):
        self.db = db
        self.llm_service = llm_service
        self.analytics_engine = analytics_engine
    
    async def generate_daily_goals(self, user_id: str) -> Dict[str, Any]:
        """
        Generate AI-based daily goals for the user
        
        Returns:
            {
                'goals': [
                    {'goal': 'Practice grammar', 'focus': 'Subject-verb agreement', 'difficulty': 3},
                    ...
                ],
                'daily_target': 45,
                'reason': 'Based on your weak areas',
                'difficulty_distribution': {'easy': 1, 'medium': 2, 'hard': 1}
            }
        """
        try:
            # Get user data
            user = await self.db.users.find_one({'_id': ObjectId(user_id)})
            
            # Get weak areas
            weak_areas = await self.analytics_engine.detect_weak_areas(user_id)
            weak_list = [w['category'] for w in weak_areas.get('weak_areas', [])[:3]]
            
            # Get user level
            skill_level = await self.analytics_engine.classify_skill_level(user_id)
            
            prompt = f"""Create 4 personalized daily goals for a {skill_level['level']} writer.

User Weak Areas: {', '.join(weak_list)}

Create goals that:
1. Target their weak areas
2. Build on previous progress
3. Are achievable in 45 minutes
4. Include mix of difficulty levels

Format response as JSON:
{{
    "goals": [
        {{"goal": "goal name", "focus": "specific area", "difficulty": 1-5, "estimated_time": 15}}
    ],
    "daily_target": 45,
    "reason": "why these goals",
    "tip": "motivational tip"
}}"""
            
            response = await self.llm_service.generate_response(prompt)
            
            try:
                result = json.loads(response.get('response', '{}'))
                
                # Save goals
                await self._save_daily_goals(user_id, result.get('goals', []))
                
                return {
                    'goals': result.get('goals', []),
                    'daily_target': result.get('daily_target', 45),
                    'reason': result.get('reason', ''),
                    'tip': result.get('tip', ''),
                    'generated_at': datetime.utcnow(),
                    'confidence': response.get('confidence', 0.85)
                }
            except json.JSONDecodeError:
                return {
                    'goals': [],
                    'daily_target': 45,
                    'error': 'Could not parse goals'
                }
        
        except Exception as e:
            return {'error': str(e), 'goals': []}
    
    async def track_streak(self, user_id: str) -> Dict[str, Any]:
        """
        Track and update user's practice streak
        
        Returns:
            {
                'current_streak': 7,
                'longest_streak': 15,
                'last_activity': '2024-03-30',
                'streak_status': 'active' | 'broken',
                'next_milestone': 10,
                'motivational_message': '...'
            }
        """
        try:
            # Get user streak data
            user_streak = await self.db.user_streaks.find_one({
                'user_id': ObjectId(user_id)
            })
            
            if not user_streak:
                # Create new streak record
                user_streak = {
                    'user_id': ObjectId(user_id),
                    'current_streak': 0,
                    'longest_streak': 0,
                    'last_activity': None,
                    'streak_start': None
                }
                await self.db.user_streaks.insert_one(user_streak)
            
            # Check if streak should be updated
            last_activity = user_streak.get('last_activity')
            today = datetime.utcnow().date()
            
            current_streak = user_streak.get('current_streak', 0)
            longest_streak = user_streak.get('longest_streak', 0)
            
            if last_activity:
                last_activity_date = last_activity.date() if hasattr(last_activity, 'date') else last_activity
                days_since = (today - last_activity_date).days
                
                # Update streak
                if days_since == 0:
                    # Already logged today
                    pass
                elif days_since == 1:
                    # Streak continues
                    current_streak += 1
                    if current_streak > longest_streak:
                        longest_streak = current_streak
                else:
                    # Streak broken
                    current_streak = 1
            else:
                # First activity
                current_streak = 1
            
            # Save updated streak
            await self.db.user_streaks.update_one(
                {'user_id': ObjectId(user_id)},
                {
                    '$set': {
                        'current_streak': current_streak,
                        'longest_streak': longest_streak,
                        'last_activity': datetime.utcnow(),
                        'streak_start': user_streak.get('streak_start') or datetime.utcnow()
                    }
                }
            )
            
            # Generate motivational message
            motivational_msg = self._get_streak_message(current_streak)
            
            # Find next milestone
            milestones = [5, 10, 15, 20, 30, 50, 100]
            next_milestone = next((m for m in milestones if m > current_streak), milestones[-1])
            
            return {
                'current_streak': current_streak,
                'longest_streak': longest_streak,
                'last_activity': datetime.utcnow(),
                'streak_status': 'active' if current_streak > 0 else 'broken',
                'next_milestone': next_milestone,
                'days_to_milestone': next_milestone - current_streak,
                'motivational_message': motivational_msg,
                'milestone_reward': f'{next_milestone} day streak bonus'
            }
        
        except Exception as e:
            return {'error': str(e)}
    
    def _get_streak_message(self, streak_days: int) -> str:
        """Get motivational message based on streak"""
        if streak_days == 0:
            return "Start your learning streak today! 🚀"
        elif streak_days == 1:
            return "Great start! Keep it going tomorrow! 💪"
        elif streak_days < 5:
            return f"You're on a {streak_days} day streak. Stay consistent! 🔥"
        elif streak_days < 10:
            return f"Amazing! {streak_days} days of learning. Close to a milestone! 🌟"
        elif streak_days < 30:
            return f"Incredible! {streak_days} days of dedication. You're unstoppable! ⭐"
        else:
            return f"Legendary! {streak_days} days of learning. You're a writing master! 👑"
    
    async def get_personalized_recommendations(
        self, 
        user_id: str
    ) -> Dict[str, List[Any]]:
        """
        Get AI-powered personalized recommendations based on:
        - Weak areas
        - Performance trends
        - Learning speed
        - Next skills to learn
        """
        try:
            # Get analytics
            weak_areas = await self.analytics_engine.detect_weak_areas(user_id)
            trend = await self.analytics_engine.compute_improvement_trend(user_id, days=7)
            skill_level = await self.analytics_engine.classify_skill_level(user_id)
            
            prompt = f"""Generate personalized learning recommendations.

Weak Areas: {weak_areas.get('weak_areas', [])}
Skill Level: {skill_level.get('level')}
Trend: {trend.get('trend')}

Provide recommendations in JSON:
{{
    "next_lessons": ["lesson 1", "lesson 2", "lesson 3"],
    "practice_focus": ["focus 1", "focus 2"],
    "skill_to_develop": "next skill to work on",
    "estimated_time": "time to master",
    "why": "reason for this recommendation"
}}"""
            
            response = await self.llm_service.generate_response(prompt)
            
            try:
                result = json.loads(response.get('response', '{}'))
                return {
                    'next_lessons': result.get('next_lessons', []),
                    'practice_focus': result.get('practice_focus', []),
                    'skill_to_develop': result.get('skill_to_develop', ''),
                    'estimated_time': result.get('estimated_time', ''),
                    'why': result.get('why', ''),
                    'confidence': response.get('confidence', 0.85),
                    'generated_at': datetime.utcnow()
                }
            except json.JSONDecodeError:
                return {'error': 'Could not parse recommendations'}
        
        except Exception as e:
            return {'error': str(e)}
    
    async def get_weekly_summary(self, user_id: str) -> Dict[str, Any]:
        """Get AI-generated weekly learning summary"""
        try:
            # Get weekly stats
            week_ago = datetime.utcnow() - timedelta(days=7)
            
            # Count activities
            activities = await self.db.user_interactions.count_documents({
                'user_id': ObjectId(user_id),
                'timestamp': {'$gte': week_ago}
            })
            
            # Get improvement trend
            trend = await self.analytics_engine.compute_improvement_trend(user_id, days=7)
            
            prompt = f"""Create a motivating weekly learning summary.

Activities this week: {activities}
Improvement trend: {trend.get('trend')}
Improvement percentage: {trend.get('improvement_percentage')}%

Generate summary in JSON:
{{
    "title": "summary title",
    "achievements": ["achievement 1", "achievement 2"],
    "areas_worked_on": ["area 1", "area 2"],
    "next_week_focus": "focus area",
    "motivational_message": "encouraging message"
}}"""
            
            response = await self.llm_service.generate_response(prompt)
            
            try:
                result = json.loads(response.get('response', '{}'))
                return {
                    'title': result.get('title', 'Your Weekly Progress'),
                    'achievements': result.get('achievements', []),
                    'areas_worked_on': result.get('areas_worked_on', []),
                    'next_week_focus': result.get('next_week_focus', ''),
                    'motivational_message': result.get('motivational_message', ''),
                    'activities_count': activities,
                    'trend': trend.get('trend'),
                    'generated_at': datetime.utcnow()
                }
            except json.JSONDecodeError:
                return {'error': 'Could not parse summary'}
        
        except Exception as e:
            return {'error': str(e)}
    
    async def get_milestone_progress(self, user_id: str) -> Dict[str, Any]:
        """Track progress toward learning milestones"""
        try:
            # Get user's level and progress
            current_level = await self.db.users.find_one(
                {'_id': ObjectId(user_id)},
                {'level': 1}
            )
            
            level = current_level.get('level', 1) if current_level else 1
            
            # Calculate progress to next level
            lessons_completed = await self.db.learning_progress.count_documents({
                'user_id': ObjectId(user_id),
                'status': 'completed'
            })
            
            # Milestones: 10 courses, 50 exercises, 100 corrections, 1000 words
            milestones = [
                {'name': 'First Steps', 'target': 10, 'current': lessons_completed, 'type': 'lessons'},
                {'name': 'Practice Master', 'target': 50, 'current': lessons_completed * 5, 'type': 'exercises'},
                {'name': 'Grammar Expert', 'target': 100, 'current': lessons_completed * 2, 'type': 'corrections'},
                {'name': 'Prolific Writer', 'target': 1000, 'current': lessons_completed * 100, 'type': 'words'},
            ]
            
            return {
                'current_level': level,
                'milestones': [
                    {
                        'name': m['name'],
                        'target': m['target'],
                        'current': m['current'],
                        'progress_percentage': int((m['current'] / m['target']) * 100) if m['target'] > 0 else 0,
                        'remaining': max(0, m['target'] - m['current'])
                    }
                    for m in milestones
                ],
                'generated_at': datetime.utcnow()
            }
        
        except Exception as e:
            return {'error': str(e)}
    
    async def _save_daily_goals(
        self, 
        user_id: str, 
        goals: List[Dict[str, Any]]
    ) -> bool:
        """Save daily goals to database"""
        try:
            today = datetime.utcnow().date()
            
            await self.db.daily_goals.update_one(
                {
                    'user_id': ObjectId(user_id),
                    'date': today
                },
                {
                    '$set': {
                        'goals': goals,
                        'created_at': datetime.utcnow(),
                        'completed': False
                    }
                },
                upsert=True
            )
            
            return True
        
        except Exception:
            return False
    
    async def complete_daily_goal(
        self, 
        user_id: str, 
        goal_index: int
    ) -> bool:
        """Mark a daily goal as completed"""
        try:
            today = datetime.utcnow().date()
            
            result = await self.db.daily_goals.update_one(
                {
                    'user_id': ObjectId(user_id),
                    'date': today
                },
                {
                    '$set': {f'goals.{goal_index}.completed': True},
                    '$inc': {'completed_count': 1}
                }
            )
            
            return result.modified_count > 0
        
        except Exception:
            return False
