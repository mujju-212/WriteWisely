"""
models/user.py — Pydantic models for User, Auth, Profile
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ─── Auth Request Models ──────────────────────────────────────

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=8)
    role: str = Field(..., pattern="^(student|professional|writer|teacher|other)$")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OtpVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class ResendOtpRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None


class DeleteAccountRequest(BaseModel):
    password: str


# ─── Assessment Models ────────────────────────────────────────

class AssessmentAnswer(BaseModel):
    question_id: str
    selected: int  # Index of selected option


class SubmitAssessmentRequest(BaseModel):
    answers: List[AssessmentAnswer]


# ─── User Profile (embedded in user document) ────────────────

class UserProfile(BaseModel):
    current_level: int = 1
    assessment_score: int = 0
    strengths: List[str] = []
    weaknesses: List[str] = []
    total_credits: int = 0
    current_streak: int = 0
    best_streak: int = 0
    rank: str = "Beginner Writer"
    last_active: Optional[datetime] = None


class UserSettings(BaseModel):
    theme: str = "light"
    font_size: str = "medium"
    notifications_enabled: bool = True
    email_notifications: bool = True
    reminder_time: str = "09:00"


# ─── Response Models ──────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    email_verified: bool
    profile: UserProfile
    settings: UserSettings
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class MessageResponse(BaseModel):
    message: str


class AssessmentResult(BaseModel):
    level: str
    level_number: int
    score: int
    total: int
    strengths: List[str]
    weaknesses: List[str]
