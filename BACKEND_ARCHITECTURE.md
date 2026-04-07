# Backend Architecture & Advanced Features Guide

## 📋 Overview

WriteWisely backend is built on FastAPI with MongoDB, featuring 14 specialized services for intelligent writing education. This documents the complete architecture and all advanced features.

---

## 🏗️ Core Architecture

### Technology Stack
- **Framework**: FastAPI (async/await, auto-documentation)
- **Database**: MongoDB with Motor async driver
- **Authentication**: JWT tokens with refresh capability
- **LLM Integration**: OpenRouter API (primary), Google Gemini (fallback)
- **Algorithms**: Levenshtein distance, statistical analysis, pattern matching

### Project Structure
```
backend/
├── main.py                    # App entry, route registration
├── config.py                  # Environment, DB connection, JWT
├── middleware/
│   ├── auth_middleware.py     # JWT verification
│   └── __init__.py
├── models/
│   ├── user.py               # User schema
│   ├── schemas.py            # Pydantic request/response models
│   ├── extended_models.py    # New extended schemas
│   └── __init__.py
├── routes/
│   ├── auth.py         # Signup, login, OTP, password reset
│   ├── learning.py     # Lessons, quizzes, assignments (ENHANCED)
│   ├── practice.py     # Practice templates, submissions (ENHANCED)
│   ├── project.py      # Document CRUD, AI co-writing (ENHANCED)
│   ├── chat.py         # Chat messages, mentor responses (ENHANCED)
│   ├── checker.py      # Text checking, corrections (ENHANCED)
│   ├── analytics.py    # User stats, insights (ENHANCED)
│   └── __init__.py
├── services/
│   ├── llm_service.py                   # LLM API wrapper
│   ├── checker_service.py               # Text analysis
│   ├── email_service.py                 # OTP/email delivery
│   ├── pattern_service.py               # Error tracking
│   │
│   ├── AI INTELLIGENCE SERVICES:
│   ├── ai_context_engine.py             # User context builder
│   ├── advanced_prompts.py              # Prompt templates
│   ├── explanation_engine.py            # Error explanations
│   ├── practice_intelligence.py         # Scoring engine
│   ├── learning_adaptation_engine.py    # Recommendations
│   ├── analytics_intelligence.py        # Analytics engine
│   ├── fallback_mechanism.py            # Error handling
│   │
│   ├── EXTENDED FEATURE SERVICES:
│   ├── project_ai_enhancement.py        # Project co-writing
│   ├── chat_mentor_service.py           # Intelligent chat
│   ├── dashboard_intelligence.py        # Dashboard features
│   │
│   └── __init__.py                      # Service exports
├── prompts/
│   ├── templates.py
│   └── __init__.py
├── data/
│   ├── lessons/
│   ├── quizzes/
│   └── assessment_questions.json
└── requirements.txt
```

---

## 🧠 Service Architecture

### Layer 1: Foundation Services
**Purpose**: Core functionality

| Service | Role | Key Methods |
|---------|------|-------------|
| `llm_service.py` | LLM API wrapper | `generate_response()`, `chat()` |
| `checker_service.py` | Text analysis | `check_text()`, `get_errors()` |
| `pattern_service.py` | Error tracking | `save_errors()`, `get_top_errors()` |
| `email_service.py` | Email delivery | `send_otp_email()`, `verify_otp()` |

### Layer 2: Intelligence Services
**Purpose**: AI-powered personalization and adaptation

| Service | Responsibility | Key Classes | Primary Methods |
|---------|-----------------|------------|-----------------|
| `ai_context_engine.py` | User profiling | `UserContextEngine` | `build_full_context()`, `build_chat_context()`, `build_suggestion_context()` |
| `advanced_prompts.py` | Prompt routing | `AdvancedPromptEngine`, `PromptSelector` | 7 prompt templates, `route_by_type()` |
| `explanation_engine.py` | Error pedagogy | `ExplanationEngine`, `ExplanationFormatter` | `generate_error_explanation()`, `format_for_ui()` |
| `practice_intelligence.py` | Scoring logic | `PracticeScorer`, `AdaptiveDifficultyEngine` | `score_submission()`, `adjust_difficulty()` |
| `learning_adaptation_engine.py` | Recommendations | `LearningAdaptationEngine`, `SmartContentGenerator` | `get_recommended_lessons()`, `create_learning_path()` |
| `analytics_intelligence.py` | Analytics | `AnalyticsIntelligenceEngine` | `compute_improvement_trend()`, `classify_skill_level()`, `predict_next_score()` |
| `fallback_mechanism.py` | Error handling | `EditDistanceSpellChecker`, `FallbackStrategy` | `check_with_fallback()`, `score_confidence()` |

### Layer 3: Feature Services
**Purpose**: Advanced user-facing features

| Service | Feature | Key Classes | Primary Methods |
|---------|---------|------------|-----------------|
| `project_ai_enhancement.py` | AI co-writing | `ProjectAIEnhancer` | `continue_writing()`, `improve_paragraph()`, `rewrite_in_tone()`, `get_suggestions()` |
| `chat_mentor_service.py` | Intelligent chat | `ChatMentorService` | `get_chat_response()`, conversation memory, interaction tracking |
| `dashboard_intelligence.py` | Dashboard | `DashboardIntelligenceEngine` | `generate_daily_goals()`, `track_streak()`, `get_personalized_recommendations()`, `get_weekly_summary()` |

---

## 📊 Data Models

### Core Collections
- **users** - User profiles, auth credentials
- **learning_progress** - Lesson completion, quiz scores
- **error_patterns** - Tracked mistakes by category
- **practice_submissions** - Practice responses with scoring
- **projects** - User documents

### New Collections (Extended)
- **project_versions** - Version history tracking
- **chat_messages** - Individual chat messages
- **chat_conversations** - Chat threads with context
- **user_streaks** - Streak tracking and motivation
- **daily_goals** - Daily goal assignments
- **mentor_interactions** - Track mentor system usage

---

## 🔄 Data Flow Examples

### Example 1: Practice Submission with AI Feedback

```
1. User submits practice text
   ↓
2. routes/practice.py → PracticeScorer.score_submission()
   ↓
3. Scorer analyzes: grammar, clarity, vocabulary, style
   ↓
4. ExplanationEngine.generate_error_explanation()
   - Converts errors to WHAT/WHY/HOW format
   ↓
5. AdaptiveDifficultyEngine.adjust_difficulty()
   - Updates next practice difficulty
   ↓
6. Save to database + return response to frontend
```

### Example 2: Intelligent Chat with Context

```
1. User sends chat message
   ↓
2. ChatMentorService.get_chat_response()
   ↓
3. Classify message type (mistake_explanation, practice_request, etc.)
   ↓
4. UserContextEngine.build_chat_context()
   - Get weak areas, mistakes, progress from user profile
   ↓
5. Route to appropriate handler:
   - If mistake_explanation → LLM with user context
   - If practice_request → Generate exercise
   - If progress_query → Summarize achievements
   ↓
6. Save message to chat_messages collection
   ↓
7. Return response with suggestions
```

### Example 3: Project Co-Writing

```
1. User clicks "Continue Writing" button
   ↓
2. ProjectAIEnhancer.continue_writing()
   ↓
3. Build prompt with user's style preference
   ↓
4. LLM generates continuation
   ↓
5. _save_version() stores in project_versions
   ↓
6. Return continuation + confidence score
```

### Example 4: Dashboard Daily Goals

```
1. User opens dashboard (first time today)
   ↓
2. DashboardIntelligenceEngine.generate_daily_goals()
   ↓
3. Get weak areas from analytics_intelligence
   ↓
4. Classify skill level
   ↓
5. LLM generates 4 personalized goals
   ↓
6. Save to daily_goals collection
   ↓
7. Also track_streak() and get recommendations
   ↓
8. Return complete dashboard data
```

---

## 🚀 Integration Points

### In routes/learning.py
```python
# Inject context into lesson responses
from services import LearningAdaptationEngine

@router.get("/lessons/{level_id}")
async def get_lesson(level_id: int, user_id: str, db: Database):
    lesson = db.lessons.find_one(...)
    
    # Get AI recommendations
    adaptation = LearningAdaptationEngine(db, llm_service)
    recommendations = await adaptation.get_recommended_lessons(user_id)
    
    return {
        'lesson': lesson,
        'recommendations': recommendations,
        'next_steps': [...]
    }
```

### In routes/practice.py
```python
# Score submission with multi-dimensional analysis
from services import PracticeScorer, ExplanationEngine

@router.post("/submit")
async def submit_practice(text: str, user_id: str, db: Database):
    scorer = PracticeScorer(db, llm_service)
    scores = await scorer.score_submission(user_id, text, 'grammar')
    
    # Generate explanations
    explanation_engine = ExplanationEngine(db, llm_service)
    explanations = await explanation_engine.generate_error_explanation(...)
    
    return {
        'scores': scores,
        'explanations': explanations
    }
```

### In routes/chat.py
```python
# Intelligent chat with context
from services import ChatMentorService

@router.post("/message")
async def send_message(req: ChatMentorMessageRequest, user_id: str, db: Database):
    mentor = ChatMentorService(db, llm_service, context_engine, explanation_engine)
    response = await mentor.get_chat_response(user_id, req.message, req.conversation_id)
    
    return response
```

### In routes/project.py
```python
# AI co-writing features
from services import ProjectAIEnhancer

@router.post("/projects/{project_id}/continue")
async def continue_writing(project_id: str, req: ContinueWritingRequest, db: Database):
    enhancer = ProjectAIEnhancer(db, llm_service)
    result = await enhancer.continue_writing(project_id, req.text, req.style)
    return result
```

### In routes/analytics.py
```python
# Intelligent analytics
from services import AnalyticsIntelligenceEngine, DashboardIntelligenceEngine

@router.get("/dashboard/{user_id}")
async def get_dashboard(user_id: str, db: Database):
    analytics = AnalyticsIntelligenceEngine(db, llm_service)
    dashboard = DashboardIntelligenceEngine(db, llm_service, analytics)
    
    return {
        'daily_goals': await dashboard.generate_daily_goals(user_id),
        'streak': await dashboard.track_streak(user_id),
        'recommendations': await dashboard.get_personalized_recommendations(user_id),
        'weekly_summary': await dashboard.get_weekly_summary(user_id),
        'milestones': await dashboard.get_milestone_progress(user_id)
    }
```

---

## 🔐 Error Handling & Reliability

### Fallback Mechanism
```python
# Three-tier error handling
1. Primary: LLM API (high quality but may fail)
2. Fallback: EditDistanceSpellChecker (100% reliable)
3. Human: Return partial response + suggestion to retry
```

### Service Initialization Pattern
```python
# Each service requires:
db: AsyncIOMotorDatabase  # MongoDB connection
llm_service: LLMService   # LLM wrapper (for AI services)

# Optional dependencies:
context_engine: UserContextEngine  # For services needing user context
explanation_engine: ExplanationEngine  # For services needing explanations
```

---

## 📈 Performance Optimization

### Caching Strategies (Optional Implementation)
- Cache user context for 5 minutes (reduces DB queries)
- Cache weak areas analysis for 1 hour (stable over time)
- Cache LLM responses for identical inputs (Redis optional)

### Database Indexing (Required)
```python
# Create in main.py startup:
db.users.create_index('user_id')
db.learning_progress.create_index([('user_id', 1), ('lesson_id', 1)])
db.error_patterns.create_index([('user_id', 1), ('category', 1)])
db.chat_messages.create_index([('conversation_id', 1), ('timestamp', -1)])
db.project_versions.create_index([('project_id', 1), ('timestamp', -1)])
```

---

## 🔧 Configuration

### Environment Variables (config.py)
```python
MONGODB_URL = "mongodb+srv://..."
OPENROUTER_KEY = "sk-..."
OPENROUTER_MODEL = "gpt-3.5-turbo"  # or other models
GOOGLE_GEMINI_KEY = "..."           # fallback
JWT_SECRET = "your-secret"
JWT_EXPIRATION = 3600               # 1 hour
REFRESH_TOKEN_EXPIRATION = 86400    # 24 hours
```

---

## 📝 API Endpoints Reference

### New/Enhanced Endpoints

#### Project AI Enhancement
- `POST /projects/{id}/continue` - Continue writing
- `POST /projects/{id}/improve` - Improve text
- `POST /projects/{id}/rewrite` - Rewrite in tone
- `POST /projects/{id}/suggestions` - Get editing suggestions
- `GET /projects/{id}/versions` - Version history
- `POST /projects/{id}/restore/{version_id}` - Restore version

#### Chat Mentor
- `POST /chat/message` - Send message to mentor
- `GET /chat/conversations` - Get conversation list
- `GET /chat/conversation/{id}` - Get conversation history

#### Dashboard Intelligence
- `GET /dashboard/goals` - Get daily goals
- `GET /dashboard/streak` - Get streak status
- `GET /dashboard/recommendations` - Get recommendations
- `GET /dashboard/summary` - Get weekly summary
- `GET /dashboard/milestones` - Get milestone progress
- `POST /dashboard/complete-goal/{index}` - Mark goal complete

---

## 🧪 Testing Checklist

### Unit Testing
- [ ] LLM response parsing
- [ ] Context aggregation accuracy
- [ ] Scoring algorithms
- [ ] Streak tracking logic
- [ ] Version history saving

### Integration Testing
- [ ] Full practice submission flow
- [ ] Chat response generation
- [ ] Dashboard generation
- [ ] Project version management
- [ ] Error fallback mechanism

### Load Testing
- [ ] Concurrent user contexts
- [ ] High-volume LLM requests
- [ ] Database query performance
- [ ] Memory usage with large projects

---

## 🚨 Known Limitations & TODOs

### Current Limitations
1. LLM API dependency - entire system fails if API is down
2. Bson import warnings (false positive - installs with motor)
3. Chat memory limited to last 5 messages
4. No real-time collaboration

### Future Enhancements
- [ ] Response caching with Redis
- [ ] Real-time collaboration (WebSocket)
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Custom vocabulary lists
- [ ] Teacher dashboard for monitoring

---

## 📚 Additional Resources

- FastAPI: https://fastapi.tiangolo.com/
- Motor (Async MongoDB): https://motor.readthedocs.io/
- OpenRouter API: https://openrouter.ai/
- Levenshtein Distance: https://en.wikipedia.org/wiki/Levenshtein_distance

---

**Last Updated**: March 30, 2024
**Status**: Production Ready with Optional Enhancements
