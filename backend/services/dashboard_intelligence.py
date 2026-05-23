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
        Generate daily goals from analytics without an API call.
        
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
            weak_areas = await self.analytics_engine.detect_weak_areas(user_id)
            weak_list = [w['category'] for w in weak_areas.get('weak_areas', [])[:3]]
            skill_level = await self.analytics_engine.classify_skill_level(user_id)

            goal_templates = {
                'spelling': {"goal": "Spelling Practice", "focus": "Common misspellings", "estimated_time": 10},
                'grammar': {"goal": "Grammar Drill", "focus": "Sentence structure", "estimated_time": 15},
                'punctuation': {"goal": "Punctuation Review", "focus": "Commas and periods", "estimated_time": 10},
                'word_choice': {"goal": "Vocabulary Builder", "focus": "Word precision", "estimated_time": 15},
                'style': {"goal": "Style Improvement", "focus": "Concise writing", "estimated_time": 15},
            }
            default_goals = [
                {"goal": "Complete a lesson", "focus": "Learning path", "difficulty": 3, "estimated_time": 15},
                {"goal": "Free writing practice", "focus": "Creative expression", "difficulty": 2, "estimated_time": 15},
                {"goal": "Review past corrections", "focus": "Error patterns", "difficulty": 2, "estimated_time": 10},
            ]
            difficulty_by_level = {
                'Beginner': 2,
                'Elementary': 2,
                'Intermediate': 3,
                'Advanced': 4,
                'Expert': 4,
            }
            base_difficulty = difficulty_by_level.get(skill_level.get('level', 'Intermediate'), 3)

            goals: List[Dict[str, Any]] = []
            for area in weak_list:
                template = goal_templates.get(area)
                if template:
                    goals.append({**template, "difficulty": base_difficulty})

            for default_goal in default_goals:
                if len(goals) >= 4:
                    break
                if default_goal not in goals:
                    goals.append(default_goal)

            goals = goals[:4]
            await self._save_daily_goals(user_id, goals)

            difficulties = [goal.get('difficulty', 3) for goal in goals]
            distribution = {
                'easy': sum(1 for value in difficulties if value <= 2),
                'medium': sum(1 for value in difficulties if 3 <= value <= 4),
                'hard': sum(1 for value in difficulties if value >= 5),
            }

            reason = (
                f"Based on your weak areas: {', '.join(weak_list)}"
                if weak_list else
                "Based on your recent activity and current level"
            )
            tip = (
                "Focus on accuracy first, then speed."
                if skill_level.get('level') in {'Beginner', 'Elementary'}
                else "Tackle the hardest goal first while your attention is fresh."
            )

            return {
                'goals': goals,
                'daily_target': 45,
                'reason': reason,
                'tip': tip,
                'difficulty_distribution': distribution,
                'generated_at': datetime.utcnow(),
                'confidence': 1.0
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
        Get personalized recommendations based on:
        - Weak areas
        - Performance trends
        - Learning speed
        - Next skills to learn
        """
        try:
            weak_areas = await self.analytics_engine.detect_weak_areas(user_id)
            trend = await self.analytics_engine.compute_improvement_trend(user_id, days=7)
            skill_level = await self.analytics_engine.classify_skill_level(user_id)

            lesson_map = {
                'spelling': ['Common Spelling Patterns', 'Homophones Mastery'],
                'grammar': ['Subject-Verb Agreement', 'Sentence Fragments'],
                'punctuation': ['Comma Rules', 'Semicolon Usage'],
                'word_choice': ['Precise Vocabulary', 'Avoiding Redundancy'],
                'style': ['Concise Writing', 'Active Voice'],
            }

            focus_categories = [w['category'] for w in weak_areas.get('weak_areas', [])[:3]]
            lessons: List[str] = []
            for area in focus_categories:
                lessons.extend(lesson_map.get(area, []))

            next_lessons: List[str] = []
            for lesson in lessons:
                if lesson not in next_lessons:
                    next_lessons.append(lesson)
                if len(next_lessons) == 3:
                    break

            practice_focus = focus_categories[:2] or ['general writing']
            skill_to_develop = (
                weak_areas.get('focus_recommendation', {}) or {}
            ).get('category', 'general writing')

            trend_name = trend.get('trend', 'stable')
            if trend_name == 'improving':
                estimated_time = '1-2 weeks of steady practice'
                why = 'Your progress is moving in the right direction, so targeted repetition should unlock the next level.'
            elif trend_name == 'declining':
                estimated_time = '1 week of short focused review sessions'
                why = 'A recent dip suggests reviewing fundamentals before adding harder exercises.'
            else:
                estimated_time = '2 weeks of consistent mixed practice'
                why = 'A stable trend suggests you will benefit most from focused variety and repetition.'

            return {
                'next_lessons': next_lessons,
                'practice_focus': practice_focus,
                'skill_to_develop': skill_to_develop,
                'estimated_time': estimated_time,
                'why': why,
                'confidence': 1.0,
                'generated_at': datetime.utcnow()
            }
        
        except Exception as e:
            return {'error': str(e)}
    
    async def get_weekly_summary(self, user_id: str) -> Dict[str, Any]:
        """Get a weekly learning summary without using an API call."""
        try:
            week_ago = datetime.utcnow() - timedelta(days=7)
            activities = await self.db.user_interactions.count_documents({
                'user_id': ObjectId(user_id),
                'timestamp': {'$gte': week_ago}
            })
            trend = await self.analytics_engine.compute_improvement_trend(user_id, days=7)
            weak_areas = await self.analytics_engine.detect_weak_areas(user_id)

            trend_type = trend.get('trend', 'stable')
            improvement_pct = trend.get('improvement_percent', 0)
            top_areas = [item['category'] for item in weak_areas.get('weak_areas', [])[:2]]

            summary_templates = {
                'improving': {
                    'title': f'Great Week! +{improvement_pct}% improvement',
                    'motivational_message': 'Keep this momentum going with another focused week.',
                },
                'stable': {
                    'title': 'Consistent Practice',
                    'motivational_message': 'Consistency is paying off. Try one new exercise type next week.',
                },
                'declining': {
                    'title': 'Room to Grow',
                    'motivational_message': 'A lighter reset week with short sessions can help you bounce back.',
                },
                'insufficient_data': {
                    'title': 'Your Weekly Progress',
                    'motivational_message': 'Complete a few more activities and your weekly trends will become clearer.',
                },
            }
            template = summary_templates.get(trend_type, summary_templates['stable'])

            achievements = []
            if activities:
                achievements.append(f'Completed {activities} learning activities this week')
            if trend_type == 'improving':
                achievements.append(f'Raised your average performance by {improvement_pct}%')
            if not achievements:
                achievements.append('Started building a fresh practice baseline')

            areas_worked_on = top_areas or ['general writing']
            next_week_focus = top_areas[0] if top_areas else 'consistent daily practice'

            return {
                'title': template['title'],
                'achievements': achievements,
                'areas_worked_on': areas_worked_on,
                'next_week_focus': next_week_focus,
                'motivational_message': template['motivational_message'],
                'activities_count': activities,
                'trend': trend_type,
                'generated_at': datetime.utcnow()
            }
        
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
