"""
INTEGRATION GUIDE — How to Use AI Intelligence Services in Routes
This file shows how to integrate all new services into existing API routes
"""

# ─── EXAMPLE 1: Enhanced Checker Route with Context ─────────────
"""
FROM: routes/checker.py
ENHANCEMENT: Inject user context into AI requests, use fallback mechanism
"""

CHECKER_EXAMPLE = """
from fastapi import APIRouter, Depends, HTTPException
from services.ai_context_engine import UserContextEngine, inject_user_context
from services.advanced_prompts import PromptSelector
from services.explanation_engine import ExplanationEngine
from services.fallback_mechanism import FallbackStrategy, EditDistanceSpellChecker
from services.practice_intelligence import PracticeScorer
from middleware.auth_middleware import get_current_user
from config import get_db

router = APIRouter()

@router.post("/check-text")
async def check_text_enhanced(
    text: str,
    db = Depends(get_db),
    user = Depends(get_current_user)
):
    # Step 1: Build personalized context
    context_engine = UserContextEngine(db)
    user_context = await context_engine.build_full_context(str(user["_id"]))
    
    # Step 2: Create personalized prompt with context injection
    base_prompt = PromptSelector.select_prompt(
        "grammar",
        text=text,
        weak_areas=[w["category"] for w in user_context.get("weak_areas", [])],
        user_level=user_context.get("learning_level")
    )
    
    # Step 3: Inject user context into prompt
    personalized_prompt = await inject_user_context(db, str(user["_id"]), base_prompt)
    
    # Step 4: Try LLM with fallback
    spell_checker = EditDistanceSpellChecker()
    fallback = FallbackStrategy(llm_service, spell_checker)
    
    ai_response = await fallback.check_with_fallback(text, personalized_prompt)
    
    # Step 5: Generate explanations for each error
    explanation_engine = ExplanationEngine(db)
    errors_with_explanations = []
    
    for error in ai_response.get("errors", []):
        explanation = await explanation_engine.generate_error_explanation(
            error_type=error.get("error_type"),
            original_text=error.get("original"),
            corrected_text=error.get("corrected"),
            user_level=user_context.get("learning_level")
        )
        errors_with_explanations.append(explanation)
    
    # Step 6: Calculate practice score
    scorer = PracticeScorer(db)
    score_data = await scorer.score_submission(
        str(user["_id"]),
        text,
        errors_with_explanations,
        practice_type="general"
    )
    
    return {
        "errors": errors_with_explanations,
        "score": score_data,
        "method": ai_response.get("method"),
        "personalization": {
            "user_weak_areas": user_context.get("weak_areas", [])[:3],
            "user_level": user_context.get("learning_level")
        }
    }
"""


# ─── EXAMPLE 2: Enhanced Chat Route with Learning Context ──────
"""
FROM: routes/chat.py
ENHANCEMENT: Use AI coach persona with full user history
"""

CHAT_EXAMPLE = """
from fastapi import APIRouter, Depends
from services.ai_context_engine import UserContextEngine
from services.advanced_prompts import AdvancedPromptEngine, PromptSelector
from services.learning_adaptation_engine import LearningAdaptationEngine
from middleware.auth_middleware import get_current_user
from config import get_db

router = APIRouter()

@router.post("/send-message")
async def send_message_enhanced(
    question: str,
    db = Depends(get_db),
    user = Depends(get_current_user)
):
    # Step 1: Get user context (weak areas, history)
    context_engine = UserContextEngine(db)
    user_context = await context_engine.build_full_context(str(user["_id"]))
    chat_context = await context_engine.build_chat_context(str(user["_id"]))
    
    # Step 2: Get chat history
    history = list(await db.chat_history.find(
        {"user_id": ObjectId(user["_id"])},
        sort=[("created_at", -1)],
        limit=3
    ).to_list(length=3))
    
    # Step 3: Create AI coach prompt with context
    coach_prompt = PromptSelector.select_prompt(
        "coaching",
        user_context=chat_context,
        user_question=question,
        conversation_history=history
    )
    
    # Step 4: Call LLM
    response = await call_llm_chat(coach_prompt)
    
    # Step 5: Save to chat history
    await db.chat_history.insert_one({
        "user_id": ObjectId(user["_id"]),
        "question": question,
        "answer": response,
        "created_at": datetime.utcnow()
    })
    
    return {
        "response": response,
        "user_context_used": {
            "learning_level": user_context.get("learning_level"),
            "weak_areas": [w["category"] for w in user_context.get("weak_areas", [])[:2]],
            "recent_accuracy": user_context.get("performance_metrics", {}).get("accuracy_rate")
        }
    }
"""


# ─── EXAMPLE 3: Enhanced Learning Route with Recommendations ───
"""
FROM: routes/learning.py
ENHANCEMENT: AI-powered lesson recommendations
"""

LEARNING_EXAMPLE = """
from fastapi import APIRouter, Depends
from services.learning_adaptation_engine import LearningAdaptationEngine
from services.analytics_intelligence import AnalyticsIntelligenceEngine
from middleware.auth_middleware import get_current_user
from config import get_db

router = APIRouter()

@router.get("/recommended-lessons")
async def get_recommended_lessons(
    db = Depends(get_db),
    user = Depends(get_current_user)
):
    # Step 1: Get learning recommendations
    adaptation_engine = LearningAdaptationEngine(db)
    recommendations = await adaptation_engine.get_recommended_lessons(
        str(user["_id"]),
        limit=5
    )
    
    # Step 2: Create personalized learning path
    path = await adaptation_engine.create_learning_path(
        str(user["_id"]),
        duration_days=30
    )
    
    return {
        "recommended_lessons": recommendations,
        "learning_path": path,
        "message": "These lessons are personalized based on your weak areas"
    }

@router.get("/learning-analytics")
async def get_learning_analytics(
    db = Depends(get_db),
    user = Depends(get_current_user)
):
    # Step 1: Generate comprehensive report
    analytics_engine = AnalyticsIntelligenceEngine(db)
    report = await analytics_engine.generate_performance_report(str(user["_id"]))
    
    return report
"""


# ─── EXAMPLE 4: Enhanced Practice Route with Adaptive Difficulty ──
"""
FROM: routes/practice.py
ENHANCEMENT: Scoring, feedback, adaptive difficulty
"""

PRACTICE_EXAMPLE = """
from fastapi import APIRouter, Depends
from services.practice_intelligence import PracticeScorer, AdaptiveDifficultyEngine
from services.explanation_engine import ExplanationEngine, ExplanationFormatter
from middleware.auth_middleware import get_current_user
from config import get_db

router = APIRouter()

@router.post("/submit-practice")
async def submit_practice_enhanced(
    practice_id: str,
    text: str,
    db = Depends(get_db),
    user = Depends(get_current_user)
):
    # Step 1: Get errors from checker
    errors = await check_text(text)  # From checker service
    
    # Step 2: Score submission
    scorer = PracticeScorer(db)
    score_data = await scorer.score_submission(
        str(user["_id"]),
        text,
        errors,
        practice_type="general"
    )
    
    # Step 3: Generate explanations for each error
    explanation_engine = ExplanationEngine(db)
    detailed_errors = []
    
    for error in errors:
        explanation = await explanation_engine.generate_error_explanation(
            error_type=error.get("type"),
            original_text=error.get("original"),
            corrected_text=error.get("corrected"),
            user_level="Intermediate"
        )
        detailed_errors.append(explanation)
    
    # Step 4: Adjust difficulty for next practice
    difficulty_engine = AdaptiveDifficultyEngine(db)
    recent_scores = [7.5, 8.0, 7.3]  # Get from DB
    new_difficulty = await difficulty_engine.adjust_difficulty(
        str(user["_id"]),
        recent_scores,
        current_difficulty=5
    )
    
    # Step 5: Save practice record
    await db.practice_records.insert_one({
        "user_id": ObjectId(user["_id"]),
        "practice_id": practice_id,
        "text": text,
        "score": score_data["scores"]["overall"],
        "errors": detailed_errors,
        "submitted_at": datetime.utcnow(),
        "difficulty_level": new_difficulty
    })
    
    return {
        "score": score_data,
        "detailed_errors": [
            ExplanationFormatter.format_for_ui(e) for e in detailed_errors
        ],
        "next_difficulty": new_difficulty,
        "feedback": score_data["feedback"]
    }
"""


# ─── EXAMPLE 5: Analytics Route Enhancement ────────────────────
"""
FROM: routes/analytics.py
ENHANCEMENT: Intelligent insights and predictions
"""

ANALYTICS_EXAMPLE = """
from fastapi import APIRouter, Depends
from services.analytics_intelligence import AnalyticsIntelligenceEngine
from middleware.auth_middleware import get_current_user
from config import get_db

router = APIRouter()

@router.get("/dashboard-insights")
async def get_dashboard_insights(
    db = Depends(get_db),
    user = Depends(get_current_user)
):
    analytics = AnalyticsIntelligenceEngine(db)
    
    # Get all insights
    trend = await analytics.compute_improvement_trend(str(user["_id"]), 30)
    weak_areas = await analytics.detect_weak_areas(str(user["_id"]))
    skill = await analytics.classify_skill_level(str(user["_id"]))
    prediction = await analytics.predict_next_score(str(user["_id"]))
    
    return {
        "improvement_trend": trend,
        "weak_areas": weak_areas,
        "skill_classification": skill,
        "score_prediction": prediction,
        "dashboard_summary": {
            "headline": trend.get("trend"),
            "key_metric": f"{trend['improvement_percent']}% improvement",
            "critical_area": weak_areas["critical_areas"][0] if weak_areas["critical_areas"] else None
        }
    }

@router.get("/weakness-heatmap")
async def get_weakness_heatmap(
    db = Depends(get_db),
    user = Depends(get_current_user)
):
    analytics = AnalyticsIntelligenceEngine(db)
    weak_areas = await analytics.detect_weak_areas(str(user["_id"]))
    
    return weak_areas.get("heatmap")
"""


# ─── IMPLEMENTATION CHECKLIST ──────────────────────────────────
IMPLEMENTATION_CHECKLIST = """
✅ INTEGRATION STEPS:

1. UPDATE EXISTING ROUTES:
   □ routes/checker.py - Add context injection + fallback
   □ routes/chat.py - Add learning context to AI coach
   □ routes/learning.py - Add recommendations engine
   □ routes/practice.py - Add scoring + explanations
   □ routes/analytics.py - Add intelligence engine

2. DATABASE UPDATES:
   □ teaching_points collection - for explanations
   □ micro_lessons collection - for generated content
   □ analytics collection - performance metrics
   □ Add indexes for fast queries

3. CONFIGURATION:
   □ Update .env with LLM settings
   □ Configure MongoDB connection
   □ Set API keys for OpenRouter/Gemini

4. TESTING:
   □ Test context injection in prompts
   □ Verify fallback mechanism works
   □ Test explanation generation
   □ Verify scoring calculations
   □ Test analytics computations

5. DEPLOYMENT:
   □ Deploy new services to production
   □ Monitor LLM API usage
   □ Setup error logging
   □ Create health checks for fallback mechanism
"""


# ─── KEY INTEGRATION PATTERNS ────────────────────────────────
KEY_PATTERNS = """
PATTERN 1: Always Build Context First
────────────────────────────────────
context_engine = UserContextEngine(db)
user_context = await context_engine.build_full_context(user_id)
# Then use context in prompts, scoring, recommendations

PATTERN 2: Use Prompts for All AI Calls
───────────────────────────────────────
prompt = PromptSelector.select_prompt(
    request_type="grammar",  # or evaluation, coaching, etc
    **parameters
)
response = await llm_service.call_llm(prompt)

PATTERN 3: Always Generate Explanations
────────────────────────────────────────
explanation_engine = ExplanationEngine(db)
explanation = await explanation_engine.generate_error_explanation(
    error_type, original, corrected
)

PATTERN 4: Score All Practice
─────────────────────────────
scorer = PracticeScorer(db)
scores = await scorer.score_submission(user_id, text, errors)
# Returns: {grammar, clarity, vocabulary, style, overall}

PATTERN 5: Intelligent Recommendations
──────────────────────────────────────
adaptation = LearningAdaptationEngine(db)
lessons = await adaptation.get_recommended_lessons(user_id)
# Returns personalized lessons based on weak areas
"""
