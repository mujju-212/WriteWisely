"""
models/schemas.py — Pydantic models for Learning, Practice, Project, Chat, Analytics
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ─── Learning Models ──────────────────────────────────────────

class QuizAnswer(BaseModel):
    question_id: str
    selected: int


class SubmitQuizRequest(BaseModel):
    answers: List[QuizAnswer]


class SubmitAssignmentRequest(BaseModel):
    text: str = Field(..., min_length=10)


class QuizResult(BaseModel):
    question_id: str
    selected: int
    correct: int
    is_correct: bool
    explanation: str


class AssignmentReview(BaseModel):
    sentence: str
    correct: bool
    error: Optional[str] = None
    explanation: Optional[str] = None


class LevelInfo(BaseModel):
    level_id: int
    title: str
    topic: str
    category: str
    status: str  # locked, available, in_progress, completed
    score: Optional[int] = None
    credits_earned: int = 0


# ─── Practice Models ─────────────────────────────────────────

class SubmitPracticeRequest(BaseModel):
    task_id: str
    text: str = Field(..., min_length=10)
    mode: str = Field(..., pattern="^(live|after_analysis)$")
    attempt_number: int = Field(default=1, ge=1)  # 1=full credits, 2=50%, 3+=0


class PracticeError(BaseModel):
    type: str  # spelling, grammar, punctuation, word_choice, style
    subtype: Optional[str] = None
    original: str
    correction: str
    explanation: str
    position: Optional[Dict[str, int]] = None
    severity: str = "minor"  # minor, moderate, major


class CategoryScores(BaseModel):
    spelling: float = 0
    grammar: float = 0
    sentence_structure: float = 0
    tone: float = 0
    completeness: float = 0


class PracticeAnalysis(BaseModel):
    overall_score: float
    category_scores: CategoryScores
    errors: List[PracticeError]
    improved_version: str = ""
    strengths: List[str] = []
    areas_to_improve: List[str] = []
    credits_earned: int = 0


# ─── Checker Models ──────────────────────────────────────────

class CheckTextRequest(BaseModel):
    text: str = Field(..., min_length=1)
    mode: str = Field(..., pattern="^(practice_live|practice_analysis|project)$")
    context: str = "general"  # email, letter, report, essay, etc.


class CheckError(BaseModel):
    type: str
    word: str
    hint: Optional[str] = None
    correction: Optional[str] = None
    explanation: Optional[str] = None
    position: Optional[Dict[str, int]] = None
    severity: str = "minor"
    color: str = "red"  # red for spelling, yellow for grammar


class CheckResponse(BaseModel):
    errors: List[CheckError]
    score: Optional[float] = None
    suggestions: List[str] = []
    fallback_used: bool = False


# ─── Project Models ───────────────────────────────────────────

class CreateProjectRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    doc_type: str = Field(default="other", pattern="^(journal|research|letter|email|other)$")


class UpdateProjectRequest(BaseModel):
    content: str
    title: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    title: str
    doc_type: str
    content: str
    word_count: int
    created_at: datetime
    updated_at: datetime


class ProjectListItem(BaseModel):
    id: str
    title: str
    doc_type: str
    word_count: int
    updated_at: datetime


# ─── Chat Models ──────────────────────────────────────────────

class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    document_ids: List[str] = Field(default_factory=list)
    conversation_id: Optional[str] = None
    reference_conversation_ids: Optional[List[str]] = None


class ChatMessage(BaseModel):
    role: str  # user, assistant
    content: str
    timestamp: datetime


class ChatResponse(BaseModel):
    response: str


# ─── Analytics Models ─────────────────────────────────────────

class AnalyticsStats(BaseModel):
    level: int
    total_levels: int = 30
    accuracy: float
    current_streak: int
    best_streak: int
    total_credits: int
    rank: str


class ErrorPatternItem(BaseModel):
    error_type: str
    count: int
    accuracy: float


class PerformanceMetrics(BaseModel):
    lessons_completed: int
    quizzes_passed: int
    assignments_done: int
    avg_time_per_lesson: Optional[str] = None
    practice_tasks_done: int
    avg_practice_score: float
    best_practice_score: float
    improvement_rate: Optional[str] = None


class BadgeItem(BaseModel):
    badge_id: str
    badge_name: str
    description: str
    earned_at: Optional[datetime] = None
    earned: bool = False


class AnalyticsOverview(BaseModel):
    stats: AnalyticsStats
    accuracy_graph: List[Dict[str, Any]] = []
    error_patterns: List[ErrorPatternItem] = []
    performance: PerformanceMetrics
    badges: List[BadgeItem] = []


# ─── Settings Models ──────────────────────────────────────────

class UpdateSettingsRequest(BaseModel):
    theme: Optional[str] = None
    font_size: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    email_notifications: Optional[bool] = None
    reminder_time: Optional[str] = None
    language: Optional[str] = None
