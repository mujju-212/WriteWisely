"""
routes/auth.py — Authentication & User Routes
Signup, Login, OTP, Password Reset, Profile, Assessment
"""

from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from datetime import datetime
import json

from config import get_db, hash_password, verify_password, create_jwt_token
from middleware.auth_middleware import get_current_user
from services.email_service import generate_otp, save_otp, verify_otp as verify_otp_db, send_otp_email
from services.pattern_service import update_streak
from models.user import (
    SignupRequest, LoginRequest, OtpVerifyRequest, ResendOtpRequest,
    ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest,
    UpdateProfileRequest, DeleteAccountRequest, SubmitAssessmentRequest,
    UserProfile, UserSettings
)

router = APIRouter()


# ─── Signup ───────────────────────────────────────────────────
@router.post("/signup")
async def signup(data: SignupRequest):
    db = get_db()
    
    # Check if email already exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_doc = {
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "password_hash": hash_password(data.password),
        "role": data.role,
        "email_verified": False,
        "created_at": datetime.utcnow(),
        "last_login": None,
        "profile": UserProfile().model_dump(),
        "settings": UserSettings().model_dump(),
    }
    
    await db.users.insert_one(user_doc)
    
    # Generate and send OTP
    otp = generate_otp()
    await save_otp(data.email, otp, "signup")
    send_otp_email(data.email, otp, "signup")
    
    return {"message": "Signup successful! OTP sent to your email."}


# ─── Verify OTP ───────────────────────────────────────────────
@router.post("/verify-otp")
async def verify_otp_endpoint(data: OtpVerifyRequest):
    db = get_db()
    
    # Verify OTP
    is_valid = await verify_otp_db(data.email, data.otp)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Mark email as verified
    await db.users.update_one(
        {"email": data.email},
        {"$set": {"email_verified": True}}
    )
    
    # Get user and generate token
    user = await db.users.find_one({"email": data.email})
    token = create_jwt_token(str(user["_id"]))
    
    return {
        "token": token,
        "user": _format_user(user),
        "message": "Email verified successfully!"
    }


# ─── Resend OTP ───────────────────────────────────────────────
@router.post("/resend-otp")
async def resend_otp(data: ResendOtpRequest):
    db = get_db()
    
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    
    otp = generate_otp()
    await save_otp(data.email, otp, "signup")
    send_otp_email(data.email, otp, "signup")
    
    return {"message": "OTP resent successfully!"}


# ─── Login ────────────────────────────────────────────────────
@router.post("/login")
async def login(data: LoginRequest):
    db = get_db()
    
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("email_verified", False):
        raise HTTPException(status_code=403, detail="Please verify your email first")
    
    # Update last login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Update streak
    await update_streak(str(user["_id"]))
    
    token = create_jwt_token(str(user["_id"]))
    
    return {
        "token": token,
        "user": _format_user(user)
    }


# ─── Forgot Password ─────────────────────────────────────────
@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    db = get_db()
    
    user = await db.users.find_one({"email": data.email})
    if not user:
        # Don't reveal if email exists
        return {"message": "If this email is registered, a reset code has been sent."}
    
    otp = generate_otp()
    await save_otp(data.email, otp, "forgot_password")
    send_otp_email(data.email, otp, "forgot_password")
    
    return {"message": "If this email is registered, a reset code has been sent."}


# ─── Reset Password ──────────────────────────────────────────
@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    db = get_db()
    
    is_valid = await verify_otp_db(data.email, data.otp)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    await db.users.update_one(
        {"email": data.email},
        {"$set": {"password_hash": hash_password(data.new_password)}}
    )
    
    return {"message": "Password reset successful! Please login with your new password."}


# ─── Get Profile ──────────────────────────────────────────────
@router.get("/profile")
async def get_profile(user=Depends(get_current_user)):
    return {"user": user}


# ─── Update Profile ───────────────────────────────────────────
@router.put("/profile")
async def update_profile(data: UpdateProfileRequest, user=Depends(get_current_user)):
    db = get_db()
    
    update_fields = {}
    if data.name is not None:
        update_fields["name"] = data.name
    if data.phone is not None:
        update_fields["phone"] = data.phone
    if data.role is not None:
        update_fields["role"] = data.role
    
    if update_fields:
        await db.users.update_one(
            {"_id": ObjectId(user["id"])},
            {"$set": update_fields}
        )
    
    updated_user = await db.users.find_one({"_id": ObjectId(user["id"])})
    return {"user": _format_user(updated_user)}


# ─── Change Password ─────────────────────────────────────────
@router.put("/change-password")
async def change_password(data: ChangePasswordRequest, user=Depends(get_current_user)):
    db = get_db()
    
    full_user = await db.users.find_one({"_id": ObjectId(user["id"])})
    
    if not verify_password(data.current_password, full_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {"password_hash": hash_password(data.new_password)}}
    )
    
    return {"message": "Password changed successfully!"}


# ─── Assessment Questions ────────────────────────────────────
@router.get("/assessment-questions")
async def get_assessment_questions():
    try:
        with open("data/assessment_questions.json", "r") as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Assessment questions not found")


# ─── Submit Assessment ────────────────────────────────────────
@router.post("/submit-assessment")
async def submit_assessment(data: SubmitAssessmentRequest, user=Depends(get_current_user)):
    db = get_db()
    
    # Load questions
    try:
        with open("data/assessment_questions.json", "r") as f:
            questions_data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Assessment questions not found")
    
    questions = {q["id"]: q for q in questions_data.get("questions", [])}
    
    # Score answers
    correct = 0
    total = len(data.answers)
    strengths = []
    weaknesses = []
    category_scores = {}
    
    for answer in data.answers:
        q = questions.get(answer.question_id)
        if q and answer.selected == q["correct"]:
            correct += 1
            cat = q.get("category", "general")
            category_scores[cat] = category_scores.get(cat, 0) + 1
        elif q:
            cat = q.get("category", "general")
            weaknesses.append(cat)
    
    # Determine level
    score_pct = (correct / total * 100) if total > 0 else 0
    if score_pct >= 70:
        level_number = 21  # Advanced start
        level_name = "advanced"
    elif score_pct >= 40:
        level_number = 11  # Intermediate start
        level_name = "intermediate"
    else:
        level_number = 1   # Beginner start
        level_name = "beginner"
    
    # Get strengths (categories with good scores)
    for cat, score in category_scores.items():
        if score > 0:
            strengths.append(cat)
    
    # Deduplicate weaknesses
    weaknesses = list(set(weaknesses))
    
    # Update user profile
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {
            "profile.current_level": level_number,
            "profile.assessment_score": correct,
            "profile.strengths": strengths,
            "profile.weaknesses": weaknesses,
        }}
    )
    
    return {
        "level": level_name,
        "level_number": level_number,
        "score": correct,
        "total": total,
        "strengths": strengths,
        "weaknesses": weaknesses
    }


# ─── Delete Account ───────────────────────────────────────────
@router.delete("/delete-account")
async def delete_account(data: DeleteAccountRequest, user=Depends(get_current_user)):
    db = get_db()
    
    full_user = await db.users.find_one({"_id": ObjectId(user["id"])})
    if not verify_password(data.password, full_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect password")
    
    user_id = user["id"]
    
    # Delete all user data
    await db.users.delete_one({"_id": ObjectId(user_id)})
    await db.learning_progress.delete_many({"user_id": user_id})
    await db.error_patterns.delete_many({"user_id": user_id})
    await db.practice_records.delete_many({"user_id": user_id})
    await db.projects.delete_many({"user_id": user_id})
    await db.chat_history.delete_many({"user_id": user_id})
    await db.badges.delete_many({"user_id": user_id})
    
    return {"message": "Account deleted successfully. We're sorry to see you go!"}


# ─── Helper ───────────────────────────────────────────────────
def _format_user(user_doc: dict) -> dict:
    """Format MongoDB user document for API response."""
    return {
        "id": str(user_doc["_id"]),
        "name": user_doc["name"],
        "email": user_doc["email"],
        "phone": user_doc.get("phone", ""),
        "role": user_doc.get("role", "student"),
        "email_verified": user_doc.get("email_verified", False),
        "profile": user_doc.get("profile", {}),
        "settings": user_doc.get("settings", {}),
        "created_at": user_doc.get("created_at", datetime.utcnow()).isoformat()
    }
