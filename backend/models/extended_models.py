"""
Extended Data Models for Advanced Features

New collections and schemas for:
- Version history (project versions)
- Chat history (messages and conversations)
- Streak tracking
- Daily goals
- Mentor interactions
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime


# ============= PROJECT VERSION HISTORY =============

class ProjectVersion(BaseModel):
    """Project version history record"""
    project_id: str = Field(..., description="Project ID")
    content: str = Field(..., description="Full content at this version")
    change_type: str = Field(..., description="Type: AUTO_SAVE, AI_CONTINUATION, AI_IMPROVEMENT, MANUAL_EDIT, USER_RESTORE")
    description: str = Field(..., description="Description of change")
    word_count: int = Field(..., description="Word count at this version")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "project123",
                "content": "This is the project content...",
                "change_type": "AI_IMPROVEMENT",
                "description": "Improved clarity of paragraph 2",
                "word_count": 450,
                "timestamp": "2024-03-30T10:30:00"
            }
        }


# ============= CHAT SYSTEM =============

class ChatMessage(BaseModel):
    """Individual chat message"""
    conversation_id: str = Field(..., description="Conversation ID")
    user_id: str = Field(..., description="User ID")
    sender: str = Field(..., description="'user' or 'mentor'")
    message: str = Field(..., description="Message content")
    message_type: str = Field(..., description="Type: general_query, mistake_explanation, practice_request, progress_query, writing_advice")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "conversation_id": "conv123",
                "user_id": "user456",
                "sender": "user",
                "message": "Can you explain subject-verb agreement?",
                "message_type": "writing_advice",
                "timestamp": "2024-03-30T10:30:00"
            }
        }


class ChatConversation(BaseModel):
    """Chat conversation thread"""
    user_id: str = Field(..., description="User ID")
    message_count: int = Field(default=0, description="Number of messages in conversation")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    topic: Optional[str] = Field(None, description="Auto-detected conversation topic (optional)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user456",
                "message_count": 5,
                "created_at": "2024-03-30T10:00:00",
                "updated_at": "2024-03-30T10:30:00",
                "topic": "Grammar Fundamentals"
            }
        }


# ============= STREAK & MOTIVATION =============

class UserStreak(BaseModel):
    """Track user's learning streak"""
    user_id: str = Field(..., description="User ID")
    current_streak: int = Field(default=0, description="Current consecutive days")
    longest_streak: int = Field(default=0, description="Longest streak ever achieved")
    last_activity: Optional[datetime] = Field(None, description="Last activity timestamp")
    streak_start: Optional[datetime] = Field(None, description="When current streak started")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user456",
                "current_streak": 7,
                "longest_streak": 15,
                "last_activity": "2024-03-30T10:00:00",
                "streak_start": "2024-03-24T08:00:00"
            }
        }


# ============= DAILY GOALS =============

class DailyGoal(BaseModel):
    """Daily learning goal"""
    goal: str = Field(..., description="Goal description")
    focus: str = Field(..., description="Specific focus area")
    difficulty: int = Field(..., description="Difficulty 1-5")
    estimated_time: int = Field(..., description="Estimated minutes to complete")
    completed: bool = Field(default=False, description="Whether goal was completed")


class DailyGoalsRecord(BaseModel):
    """Collection of daily goals for a specific user/day"""
    user_id: str = Field(..., description="User ID")
    date: str = Field(..., description="Date (YYYY-MM-DD)")
    goals: List[DailyGoal] = Field(default=[], description="List of daily goals")
    completed_count: int = Field(default=0, description="Number of completed goals")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed: bool = Field(default=False, description="All goals completed for the day")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user456",
                "date": "2024-03-30",
                "goals": [
                    {
                        "goal": "Practice grammar",
                        "focus": "Subject-verb agreement",
                        "difficulty": 3,
                        "estimated_time": 15,
                        "completed": True
                    }
                ],
                "completed_count": 1,
                "completed": False
            }
        }


# ============= MENTOR INTERACTIONS =============

class MentorInteraction(BaseModel):
    """Track interactions with mentor system"""
    user_id: str = Field(..., description="User ID")
    interaction_type: str = Field(..., description="Type: progress_summary, exercise_generated, correction_requested, etc.")
    context: Optional[dict] = Field(None, description="Additional context about interaction")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user456",
                "interaction_type": "progress_summary",
                "context": {"period": 7, "days_active": 5},
                "timestamp": "2024-03-30T10:30:00"
            }
        }


# ============= EXTENDED USER PROFILE =============

class ExtendedUserProfile(BaseModel):
    """Extended user profile with learning metadata"""
    user_id: str = Field(..., description="User ID")
    learning_challenges: List[str] = Field(default=[], description="Self-identified learning challenges")
    preferred_exercise_type: Optional[str] = Field(None, description="Preferred exercise format")
    notification_preferences: dict = Field(
        default={"daily_goals": True, "streak_updates": True, "milestone_achievements": True},
        description="User notification settings"
    )
    learning_goals: List[dict] = Field(default=[], description="User's stated learning goals")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user456",
                "learning_challenges": ["grammar", "punctuation"],
                "preferred_exercise_type": "multiple_choice",
                "notification_preferences": {
                    "daily_goals": True,
                    "streak_updates": True,
                    "milestone_achievements": True
                },
                "learning_goals": [
                    {"goal": "Improve punctuation", "target_date": "2024-06-30"}
                ]
            }
        }


# ============= LEARNING PROGRESS EXTENDED =============

class LearningProgressExtended(BaseModel):
    """Extended learning progress tracking"""
    user_id: str = Field(..., description="User ID")
    lesson_id: str = Field(..., description="Lesson ID")
    status: str = Field(..., description="in_progress, completed, skipped")
    completion_time: Optional[int] = Field(None, description="Time spent in minutes")
    quiz_score: Optional[float] = Field(None, description="Quiz score 0-100")
    assignment_score: Optional[float] = Field(None, description="Assignment score 0-100")
    mistakes_made: List[str] = Field(default=[], description="Types of mistakes encountered")
    concepts_mastered: List[str] = Field(default=[], description="Concepts demonstrated understanding")
    notes: Optional[str] = Field(None, description="User or system notes")
    completed_at: Optional[datetime] = Field(None, description="Completion timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user456",
                "lesson_id": "lesson_01",
                "status": "completed",
                "completion_time": 35,
                "quiz_score": 85.5,
                "assignment_score": 92.0,
                "mistakes_made": ["subject_verb_agreement", "comma_splice"],
                "concepts_mastered": ["present_tense", "basic_punctuation"],
                "completed_at": "2024-03-30T10:30:00"
            }
        }


# ============= ERROR PATTERN TRACKING =============

class ErrorPattern(BaseModel):
    """Track and analyze error patterns"""
    user_id: str = Field(..., description="User ID")
    error_type: str = Field(..., description="Type of error (grammar, spelling, punctuation, clarity, etc.)")
    category: str = Field(..., description="Category (e.g., 'subject_verb_agreement', 'comma_splice')")
    frequency: int = Field(default=1, description="How many times this error occurred")
    last_occurrence: datetime = Field(default_factory=datetime.utcnow)
    contexts: List[str] = Field(default=[], description="Example contexts where error occurred")
    correction_attempts: int = Field(default=0, description="Times user attempted to correct this")
    mastered: bool = Field(default=False, description="Whether user has demonstrated mastery")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user456",
                "error_type": "grammar",
                "category": "subject_verb_agreement",
                "frequency": 5,
                "last_occurrence": "2024-03-30T10:00:00",
                "contexts": ["The team are working", "A group of students were"],
                "correction_attempts": 3,
                "mastered": False
            }
        }
