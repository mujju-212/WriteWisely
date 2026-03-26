# ⚙️ WriteWisely — Backend Development Plan

> Python FastAPI + MongoDB + OpenRouter LLM | Serves React Frontend

---

## 📁 File Structure

```
backend/
├── main.py                    # FastAPI app entry point, CORS, route registration
├── config.py                  # MongoDB connection, JWT config, env variables
├── requirements.txt           # pip dependencies
├── .env                       # Secret keys (not committed)
│
├── routes/                    # API endpoints (grouped by feature)
│   ├── __init__.py
│   ├── auth.py                # Signup, login, OTP, reset, profile, assessment
│   ├── learning.py            # Lessons, quizzes, assignments
│   ├── practice.py            # Practice templates, submissions
│   ├── project.py             # CRUD documents
│   ├── chat.py                # AI chat endpoint
│   ├── checker.py             # Spell/grammar check (shared by practice + project)
│   └── analytics.py           # Analytics data + dashboard stats
│
├── models/                    # Pydantic models (request/response validation)
│   ├── __init__.py
│   ├── user.py                # User, signup, login, profile models
│   └── schemas.py             # All other models (learning, practice, project, etc.)
│
├── services/                  # Business logic
│   ├── __init__.py
│   ├── llm_service.py         # OpenRouter API calls
│   ├── checker_service.py     # Spell/grammar check logic (LLM + fallback)
│   ├── email_service.py       # SMTP OTP email sending
│   └── pattern_service.py     # Save + analyze error patterns, credits, badges
│
├── prompts/                   # LLM prompt templates
│   ├── __init__.py
│   └── templates.py           # All prompts: checker, practice, coach, chat
│
├── middleware/                # Auth middleware
│   ├── __init__.py
│   └── auth_middleware.py     # JWT verification + current_user dependency
│
└── data/                      # Static content (JSON files)
    ├── assessment_questions.json
    ├── practice_templates.json
    ├── lessons/
    │   ├── level_01.json ... level_05.json
    └── quizzes/
        ├── quiz_01.json ... quiz_05.json
```

---

## 🔌 main.py — App Entry Point

```python
# WHAT IT DOES:
# 1. Creates FastAPI app
# 2. Adds CORS middleware (allow frontend origin)
# 3. Connects to MongoDB on startup
# 4. Registers all route files
# 5. Runs with: uvicorn main:app --reload

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import connect_db
from routes import auth, learning, practice, project, chat, checker, analytics

app = FastAPI(title="WriteWisely API")

# CORS — allow frontend (localhost:5173 for Vite dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect DB on startup
@app.on_event("startup")
async def startup():
    await connect_db()

# Register routes
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(learning.router, prefix="/api/learning", tags=["Learning"])
app.include_router(practice.router, prefix="/api/practice", tags=["Practice"])
app.include_router(project.router, prefix="/api/project", tags=["Project"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(checker.router, prefix="/api/checker", tags=["Checker"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
```

---

## ⚙️ config.py — Single Config File

```python
# WHAT IT DOES:
# 1. Loads .env variables
# 2. MongoDB connection (Motor async client)
# 3. JWT settings (secret key, algorithm, expiry)
# 4. Password hashing (bcrypt via passlib)

# KEY VARIABLES:
MONGODB_URL = os.getenv("MONGODB_URL")
JWT_SECRET = os.getenv("JWT_SECRET")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

# EXPORTS:
# - db → MongoDB database object (async)
# - create_jwt_token(user_id) → returns JWT string
# - verify_jwt_token(token) → returns user_id or raises error
# - hash_password(password) → returns bcrypt hash
# - verify_password(plain, hashed) → returns True/False
# - connect_db() → initializes Motor client
```

---

## 🛡️ middleware/auth_middleware.py

```python
# WHAT IT DOES:
# Provides a dependency function `get_current_user` for protected routes

# HOW:
# 1. Extracts JWT from Authorization header (Bearer token)
# 2. Decodes token using config.verify_jwt_token()
# 3. Queries DB for user
# 4. Returns user document (without password_hash)
# 5. If invalid/expired → raises HTTPException 401

# USAGE IN ROUTES:
#   @router.get("/profile")
#   async def profile(user = Depends(get_current_user)):
#       return user
```

---

## 🗃️ MongoDB Database Schema

### Database Name: `writewisely`

### Collection: `users`
```json
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "john@email.com",
  "phone": "+1234567890",
  "password_hash": "$2b$12$...",
  "email_verified": true,
  "role": "student",
  "created_at": "2025-01-15T10:00:00Z",
  "last_login": "2025-01-20T10:00:00Z",
  "profile": {
    "current_level": 14,
    "assessment_score": 6,
    "strengths": ["spelling", "basic_grammar"],
    "weaknesses": ["homophones", "punctuation"],
    "total_credits": 450,
    "current_streak": 5,
    "best_streak": 12,
    "rank": "Grammar Enthusiast",
    "last_active": "2025-01-20T10:00:00Z"
  },
  "settings": {
    "theme": "dark",
    "font_size": "medium",
    "notifications_enabled": true,
    "email_notifications": true,
    "reminder_time": "09:00"
  }
}
```
**Indexes:** `email` (unique)

---

### Collection: `otp_store`
```json
{
  "_id": "ObjectId",
  "email": "john@email.com",
  "otp": "482910",
  "purpose": "signup | forgot_password",
  "created_at": "2025-01-20T10:00:00Z",
  "expires_at": "2025-01-20T10:10:00Z"
}
```
**Indexes:** `email`, `expires_at` (TTL index — auto-delete after expiry)

---

### Collection: `learning_progress`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref → users)",
  "level_number": 14,
  "topic": "commonly_confused_words",
  "status": "completed",
  "started_at": "2025-01-20T10:00:00Z",
  "completed_at": "2025-01-20T11:00:00Z",
  "quiz_scores": [
    { "quiz_id": "q1", "score": 4, "total": 5, "time_taken_sec": 120 }
  ],
  "assignment": {
    "submitted": true,
    "text": "The effect of...",
    "score": 2,
    "total": 3,
    "review": [
      {
        "sentence": "The medicine had a good affect on me.",
        "correct": false,
        "error": "affect → effect",
        "explanation": "Here you need a noun (result). Effect is the noun."
      }
    ]
  },
  "credits_earned": 25
}
```
**Indexes:** `user_id`, `level_number`

---

### Collection: `error_patterns`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref → users)",
  "error_type": "spelling | grammar | punctuation | word_choice | style",
  "error_subtype": "letter_swap | homophone | double_letter | ...",
  "original_word": "Reqeust",
  "correct_word": "Request",
  "context": "noun_needed | verb_needed | ...",
  "frequency": 3,
  "last_occurred": "2025-01-20T14:30:00Z",
  "source": "learning | practice | project",
  "resolved": false
}
```
**Indexes:** `user_id`, `error_type`, `frequency` (descending)
**Purpose:** This drives Analytics + AI Chat personalization + re-learning suggestions

---

### Collection: `practice_records`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref → users)",
  "task_type": "email",
  "task_prompt": "Write an email to your manager requesting a day off...",
  "submitted_text": "Subject: Reqeust for Day Off...",
  "mode": "after_analysis",
  "submitted_at": "2025-01-20T14:30:00Z",
  "analysis": {
    "overall_score": 6.5,
    "category_scores": {
      "spelling": 7,
      "grammar": 5,
      "sentence_structure": 7,
      "tone": 6,
      "completeness": 8
    },
    "errors": [
      {
        "type": "spelling",
        "subtype": "letter_swap",
        "original": "Reqeust",
        "correction": "Request",
        "explanation": "Letters 'e' and 'u' are swapped",
        "position": { "start": 9, "end": 15 },
        "severity": "minor"
      }
    ],
    "total_errors": 5,
    "improved_version": "Subject: Request for Day Off...",
    "strengths": ["Good opening", "Clear purpose"],
    "areas_to_improve": ["Spelling accuracy", "Preposition usage"]
  },
  "credits_earned": 20,
  "llm_response_raw": {},
  "fallback_used": false
}
```
**Indexes:** `user_id`, `submitted_at` (descending)

---

### Collection: `projects`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref → users)",
  "title": "Research Paper - Climate Change",
  "content": "Climate change is one of the most pressing...",
  "doc_type": "research",
  "word_count": 156,
  "errors_history": [
    {
      "checked_at": "2025-01-20T15:00:00Z",
      "errors_count": 5,
      "types": { "spelling": 3, "grammar": 2 }
    }
  ],
  "created_at": "2025-01-20T14:00:00Z",
  "updated_at": "2025-01-20T15:30:00Z"
}
```
**Indexes:** `user_id`, `updated_at` (descending)

---

### Collection: `chat_history`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref → users)",
  "messages": [
    {
      "role": "user",
      "content": "How am I doing with my learning?",
      "timestamp": "2025-01-20T16:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Great question! Here's your summary...",
      "context_used": {
        "level": 14,
        "top_errors": ["affect/effect"],
        "recent_scores": [6.5, 7, 8]
      },
      "timestamp": "2025-01-20T16:00:01Z"
    }
  ]
}
```
**Indexes:** `user_id`
**Note:** One document per user, messages are pushed into the array.

---

### Collection: `badges`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref → users)",
  "badge_id": "bookworm",
  "badge_name": "📖 Bookworm",
  "description": "Complete 10 lessons",
  "earned_at": "2025-01-18T10:00:00Z",
  "credits_at_earn": 100
}
```
**Indexes:** `user_id`

---

## 📡 API Endpoints — Complete Reference

### AUTH Routes — `routes/auth.py`

| Method | Endpoint | Auth | Request Body | Response | Logic |
|--------|----------|:----:|-------------|----------|-------|
| POST | `/api/auth/signup` | ❌ | `{name, email, phone, password, role}` | `{message}` | Hash password → save user (email_verified=false) → generate OTP → save to otp_store → send email via email_service |
| POST | `/api/auth/verify-otp` | ❌ | `{email, otp}` | `{token, user}` | Check otp_store → verify match + not expired → set email_verified=true → generate JWT → return |
| POST | `/api/auth/resend-otp` | ❌ | `{email}` | `{message}` | Generate new OTP → update otp_store → send email |
| POST | `/api/auth/login` | ❌ | `{email, password}` | `{token, user}` | Find user → verify password → check email_verified → update last_login → generate JWT → return |
| POST | `/api/auth/forgot-password` | ❌ | `{email}` | `{message}` | Check user exists → generate OTP → save to otp_store (purpose="forgot_password") → send email |
| POST | `/api/auth/reset-password` | ❌ | `{email, otp, new_password}` | `{message}` | Verify OTP → hash new password → update user → delete OTP |
| GET | `/api/auth/profile` | ✅ | — | `{user}` | Return current user (without password_hash) |
| PUT | `/api/auth/profile` | ✅ | `{name?, phone?, role?}` | `{user}` | Update user fields |
| PUT | `/api/auth/change-password` | ✅ | `{current_password, new_password}` | `{message}` | Verify current → hash new → update |
| GET | `/api/auth/assessment-questions` | ❌ | — | `{questions}` | Read from `data/assessment_questions.json` |
| POST | `/api/auth/submit-assessment` | ✅ | `{answers: [{question_id, selected}]}` | `{level, score, strengths, weaknesses}` | Score answers → determine level (0-3=beginner, 4-6=intermediate, 7-10=advanced) → update user profile |
| DELETE | `/api/auth/delete-account` | ✅ | `{password}` | `{message}` | Verify password → delete all user data from all collections |

---

### LEARNING Routes — `routes/learning.py`

| Method | Endpoint | Auth | Request Body | Response | Logic |
|--------|----------|:----:|-------------|----------|-------|
| GET | `/api/learning/levels` | ✅ | — | `[{level_id, title, topic, status, score}]` | Read all level definitions from lesson JSON files → join with user's learning_progress → return status per level |
| GET | `/api/learning/levels/:id` | ✅ | — | `{lesson_content, quiz, assignment_prompt}` | Read from `data/lessons/level_XX.json` → return lesson content |
| POST | `/api/learning/quiz/:id` | ✅ | `{answers: [{q_id, selected}]}` | `{results, score, total, credits}` | Compare answers with correct → save to learning_progress → award credits via pattern_service → return detailed results |
| POST | `/api/learning/assignment/:id` | ✅ | `{text}` | `{review, score, credits}` | Send text to checker_service → get analysis → save to learning_progress → extract errors → save to error_patterns → award credits → return review |

**Level Status Logic:**
```
- Level 1: always "available"
- Level N: "available" if level N-1 is "completed"
- Level with quiz_score > 0 but not all done: "in_progress"
- Level with assignment submitted: "completed"
```

---

### PRACTICE Routes — `routes/practice.py`

| Method | Endpoint | Auth | Request Body | Response | Logic |
|--------|----------|:----:|-------------|----------|-------|
| GET | `/api/practice/templates` | ✅ | `?level=intermediate` | `[{task_id, type, title, prompt, credits}]` | Read from `data/practice_templates.json` → filter by user's level |
| POST | `/api/practice/submit` | ✅ | `{task_id, text, mode}` | `{score, category_scores, errors, improved_version, credits}` | Call checker_service with practice_analysis prompt → save to practice_records → extract errors → save to error_patterns → calculate credits → return full analysis |

---

### CHECKER Routes — `routes/checker.py`

| Method | Endpoint | Auth | Request Body | Response | Logic |
|--------|----------|:----:|-------------|----------|-------|
| POST | `/api/checker/check` | ✅ | `{text, mode, context?}` | `{errors: [{type, word, position, hint, correction, explanation, severity, color}]}` | See Checker Service flow below |

**Mode determines response detail:**
- `mode = "practice_live"`: errors have `hint` only (type of error, not the answer)
- `mode = "practice_analysis"`: full analysis with scores and improved version
- `mode = "project"`: full corrections + explanations + style suggestions

---

### PROJECT Routes — `routes/project.py`

| Method | Endpoint | Auth | Request Body | Response | Logic |
|--------|----------|:----:|-------------|----------|-------|
| GET | `/api/project/list` | ✅ | — | `[{id, title, type, word_count, updated_at}]` | Query projects collection for user |
| GET | `/api/project/:id` | ✅ | — | `{title, content, doc_type, word_count}` | Get single project |
| POST | `/api/project/create` | ✅ | `{title, doc_type}` | `{id}` | Create new empty project document |
| PUT | `/api/project/:id` | ✅ | `{content}` | `{message}` | Update content + word_count + updated_at |
| DELETE | `/api/project/:id` | ✅ | — | `{message}` | Delete project |

---

### CHAT Routes — `routes/chat.py`

| Method | Endpoint | Auth | Request Body | Response | Logic |
|--------|----------|:----:|-------------|----------|-------|
| GET | `/api/chat/history` | ✅ | — | `[{role, content, timestamp}]` | Get last 20 messages from chat_history |
| POST | `/api/chat/send` | ✅ | `{message}` | `{response}` | See Context Injection Flow below |

**Context Injection Flow (how AI "remembers" the user):**
```
1. Receive user message
2. Query DB for user context:
   - users → name, level, credits, streak, strengths, weaknesses
   - error_patterns → top 5 most frequent errors
   - practice_records → last 3 practice scores
   - learning_progress → lessons completed count
3. Build context JSON (NO credentials!)
4. Get chat history → last 6 messages
5. Construct system prompt using prompts/templates.py (chat_coach)
6. Call LLM via llm_service
7. Save both messages to chat_history
8. Return AI response
```

---

### ANALYTICS Routes — `routes/analytics.py`

| Method | Endpoint | Auth | Request Body | Response | Logic |
|--------|----------|:----:|-------------|----------|-------|
| GET | `/api/analytics/dashboard` | ✅ | — | `{user_stats, current_lesson, recent_activity, weekly_stats}` | Aggregate from users + learning_progress + practice_records |
| GET | `/api/analytics/overview` | ✅ | `?period=weekly` | `{stats, accuracy_graph, error_patterns, performance, badges}` | See Analytics Logic below |

**Analytics Data Sources (all from DB, no extra API calls):**
```
- Accuracy: calculated from quiz scores + practice scores
- Error patterns: from error_patterns collection (grouped by type)
- Accuracy graph: from practice_records + learning_progress over time
- Performance: lesson completion rate, avg time, practice avg score
- Badges: from badges collection
- Streak: from users.profile.current_streak
- Credits: from users.profile.total_credits
```

---

## 🔧 Services — Business Logic

### llm_service.py
```python
# WHAT: Makes API calls to OpenRouter (or any LLM provider)
# 
# FUNCTION: call_llm(system_prompt, user_message, json_mode=True)
#
# HOW:
#   1. Constructs request to OpenRouter API
#   2. Sends system prompt + user message
#   3. Requests JSON response format
#   4. Parses and returns response
#   5. If API fails → raises exception (caught by checker_service)
#
# CONFIG:
#   - API URL: https://openrouter.ai/api/v1/chat/completions
#   - API Key: from .env (OPENROUTER_API_KEY)
#   - Model: configurable (e.g., "openai/gpt-3.5-turbo")
#   - Timeout: 15 seconds
#
# REQUEST FORMAT:
#   POST https://openrouter.ai/api/v1/chat/completions
#   Headers: { Authorization: Bearer {key} }
#   Body: {
#     model: "openai/gpt-3.5-turbo",
#     messages: [
#       { role: "system", content: system_prompt },
#       { role: "user", content: user_message }
#     ],
#     response_format: { type: "json_object" }
#   }
```

### checker_service.py
```python
# WHAT: Main spell/grammar check logic
# USED BY: Practice editor, Project editor, Assignment review
#
# FUNCTION: check_text(text, mode, context, user_level)
#
# FLOW:
#   1. Build prompt from prompts/templates.py based on mode
#   2. Try LLM check via llm_service.call_llm()
#   3. If LLM succeeds → parse JSON response → format errors
#   4. If LLM fails → use fallback (basic Levenshtein spell check)
#   5. Save errors to error_patterns via pattern_service
#   6. Return formatted errors list
#
# MODES:
#   "practice_live" → send checker prompt → return hints only (no solutions)
#   "practice_analysis" → send analysis prompt → return full scores + errors + improved version
#   "project" → send checker prompt → return full corrections + explanations
#
# FALLBACK (if LLM fails):
#   - Split text into words
#   - Compare each word against dictionary using Levenshtein distance
#   - If distance <= 2 → suggest correction
#   - Cannot detect grammar errors (only spelling)
#   - Returns basic error list with type="spelling" only
```

### email_service.py
```python
# WHAT: Sends OTP emails via SMTP
#
# FUNCTION: send_otp_email(email, otp, purpose)
#
# HOW:
#   1. Connects to SMTP server (Gmail or Resend)
#   2. Constructs HTML email with OTP code
#   3. Sends email
#   4. purpose: "signup" → "Verify your email"
#              "forgot_password" → "Reset your password"
#
# OTP GENERATION:
#   - 6 random digits
#   - Saved to otp_store collection with 10-minute expiry
#   - TTL index auto-deletes expired OTPs
```

### pattern_service.py
```python
# WHAT: Saves error patterns + manages credits + checks badge eligibility
# This is the "intelligence" that makes analytics and AI chat personalized
#
# FUNCTION: save_errors(user_id, errors, source)
#   - For each error: upsert into error_patterns
#   - If error already exists for this user → increment frequency
#   - If new error → insert with frequency=1
#   - source: "learning" | "practice" | "project"
#
# FUNCTION: add_credits(user_id, amount, reason)
#   - Increment users.profile.total_credits by amount
#   - Update rank based on new total
#   - Check if any new badges unlocked
#   - If badge earned → insert into badges collection
#
# FUNCTION: update_streak(user_id)
#   - Check last_active date
#   - If yesterday → increment current_streak
#   - If today → no change
#   - If older → reset to 1
#   - Update best_streak if current > best
#   - Award streak bonus credits (7-day = +50, 30-day = +200)
#
# FUNCTION: get_user_analytics(user_id, period)
#   - Aggregate error_patterns by type → bar chart data
#   - Aggregate practice_records by date → accuracy line chart
#   - Count lessons completed, quizzes passed
#   - Calculate avg scores, time spent
#   - Fetch badges
#   - Return complete analytics object
#
# CREDIT VALUES:
#   Complete lesson: +10
#   Pass quiz (>70%): +15
#   Perfect quiz (100%): +25
#   Submit assignment: +15
#   Perfect assignment: +30
#   Practice task: +20 to +60 (based on difficulty)
#   Practice score 9-10: +20 bonus
#   Daily login: +5
#   7-day streak: +50 bonus
#   30-day streak: +200 bonus
#   500+ word document: +30
#   Fix all errors in doc: +15
#
# RANKS:
#   0-99: Beginner Writer
#   100-299: Grammar Learner
#   300-499: Grammar Enthusiast
#   500-999: Skilled Writer
#   1000-1999: Grammar Expert
#   2000+: Language Master
#
# BADGES:
#   first_steps (10 credits): Complete first lesson
#   bookworm (100 credits): Complete 10 lessons
#   writer (250 credits): Complete 10 practice tasks
#   on_fire (300 credits): 7-day streak
#   sharpshooter (400 credits): 5 perfect quiz scores
#   scholar (500 credits): Reach Level 15
#   perfectionist (750 credits): 3 practice scores of 10/10
#   champion (1000 credits): Reach Level 25
#   master (2000 credits): Complete all 30 levels
#   legend (5000 credits): All badges + 90% accuracy
```

---

## 📝 prompts/templates.py — LLM Prompts

```python
# All predefined prompts with placeholders

PROMPTS = {

    "spell_grammar_check": """
    You are a grammar and spelling checker.
    Analyze this text: "{text}"
    Context: User is writing a {context_type}
    User Level: {user_level}
    
    Return JSON:
    {{
      "errors": [
        {{
          "type": "spelling|grammar|punctuation|word_choice|style",
          "original": "wrong word",
          "correction": "correct version",
          "explanation": "brief friendly explanation",
          "position": {{"start": 0, "end": 5}},
          "severity": "minor|moderate|major"
        }}
      ],
      "overall_feedback": "brief comment",
      "score": 7.5
    }}
    
    Rules:
    - Be precise with positions
    - Explanations should teach, not just correct
    - Adjust complexity to {user_level}
    """,

    "practice_live_hints": """
    Check this {context_type} for errors:
    "{text}"
    User Level: {user_level}
    
    Return JSON with ONLY hints (not corrections):
    {{
      "errors": [
        {{
          "type": "spelling|grammar",
          "word": "the wrong word",
          "hint": "type of error (e.g., 'double letter issue')",
          "position": {{"start": 0, "end": 5}},
          "color": "red|yellow"
        }}
      ]
    }}
    
    Rules:
    - red = spelling errors, yellow = grammar errors
    - Hints describe the ERROR TYPE, NOT the solution
    - This is practice — user should figure out the answer
    """,

    "practice_analysis": """
    Analyze this {task_type} written by a {user_level} student:
    Task prompt: {task_prompt}
    Text: "{submitted_text}"
    
    Return detailed JSON:
    {{
      "overall_score": 7.5,
      "category_scores": {{
        "spelling": 8, "grammar": 6,
        "sentence_structure": 7, "tone": 7, "completeness": 8
      }},
      "errors": [{{"type": "", "original": "", "correction": "",
                   "explanation": "", "position": {{}}, "severity": ""}}],
      "improved_version": "the corrected full text",
      "strengths": ["list of what they did well"],
      "areas_to_improve": ["list of areas to work on"]
    }}
    """,

    "chat_coach": """
    You are a friendly grammar coach for {user_name}.
    
    STUDENT PROFILE:
    - Level: {level} / 30
    - Credits: {credits}
    - Streak: {streak} days
    - Strengths: {strengths}
    - Weaknesses: {weaknesses}
    - Recent errors: {recent_errors}
    - Practice scores: {practice_scores}
    - Lessons completed: {lessons_completed}
    
    RULES:
    - Address them by name
    - Reference their SPECIFIC data
    - Be encouraging even about mistakes
    - Suggest specific lessons or practice tasks
    - Give examples when explaining rules
    - NEVER mention email, password, or personal info
    - Keep responses concise and helpful
    - If asked unrelated questions, redirect to learning
    """
}
```

---

## 🔄 Key Backend Flows

### Flow 1: Signup + OTP Verification
```
POST /api/auth/signup
  → Validate input (email format, password strength)
  → Check email not already registered
  → Hash password with bcrypt
  → Save user to DB (email_verified = false)
  → Generate 6-digit OTP
  → Save OTP to otp_store (10 min expiry)
  → Send OTP email via email_service
  → Return success message

POST /api/auth/verify-otp
  → Find OTP in otp_store by email
  → Check OTP matches and not expired
  → Set user.email_verified = true
  → Delete OTP from otp_store
  → Generate JWT token
  → Return token + user data
```

### Flow 2: Text Checking (Practice + Project)
```
POST /api/checker/check { text, mode, context }
  │
  ├─→ Build prompt from templates.py based on mode
  │
  ├─→ TRY: llm_service.call_llm(prompt, text)
  │     │
  │     ├── SUCCESS: Parse JSON response
  │     │     → Format errors with positions
  │     │     → Add color: red (spelling), yellow (grammar)
  │     │     → If mode="practice_live": strip corrections, keep hints only
  │     │
  │     └── FAIL (timeout/API error):
  │           → Use fallback: Levenshtein distance check
  │           → Only catches spelling (no grammar)
  │           → Set fallback_used = true
  │
  ├─→ Save errors to error_patterns (via pattern_service)
  │     → Don't call API again — reuse this data for analytics!
  │
  └─→ Return formatted response
```

### Flow 3: AI Chat with Context Injection
```
POST /api/chat/send { message }
  │
  ├─→ Query DB (NOT credentials!):
  │     users → name, level, credits, streak, strengths, weaknesses
  │     error_patterns → top 5 by frequency
  │     practice_records → last 3 scores
  │     learning_progress → completed count
  │
  ├─→ Build context JSON
  │
  ├─→ Get chat_history → last 6 messages
  │
  ├─→ Construct prompt:
  │     system = templates["chat_coach"].format(context)
  │     messages = [system] + last_6_messages + [new_message]
  │
  ├─→ Call LLM via llm_service
  │
  ├─→ Save both messages to chat_history
  │
  └─→ Return AI response
```

### Flow 4: Analytics Generation
```
GET /api/analytics/overview?period=weekly
  │
  ├─→ All data comes from DB (no API calls):
  │
  ├── error_patterns → group by type → bar chart data
  ├── practice_records → filter by date range → scores over time
  ├── learning_progress → count completed, avg quiz scores
  ├── users.profile → level, credits, streak, rank
  ├── badges → earned badges with dates
  │
  └─→ Calculate:
       - Accuracy = avg of all quiz + practice scores
       - Improvement = compare current week vs previous
       - Time spent = sum of time_taken fields
       - Completion rate = completed / started lessons
```

---

## 📦 requirements.txt

```
fastapi==0.109.0
uvicorn==0.27.0
motor==3.3.0             # Async MongoDB driver
pymongo==4.6.0
python-jose[cryptography]==3.3.0   # JWT tokens
passlib[bcrypt]==1.7.4    # Password hashing
python-multipart==0.0.6   # Form data parsing
httpx==0.26.0             # Async HTTP client (for OpenRouter)
python-dotenv==1.0.0      # Load .env file
pydantic==2.5.0           # Data validation
python-Levenshtein==0.23.0  # Edit distance (spell fallback)
```

---

## 🔐 .env File (Template)

```env
# MongoDB
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/writewisely

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24

# OpenRouter LLM
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
LLM_MODEL=openai/gpt-3.5-turbo

# Email (Gmail SMTP)
SMTP_EMAIL=your.email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

---

## 📊 Data Files

### data/assessment_questions.json
```json
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "category": "homophones",
      "question": "Choose the correct sentence:",
      "options": [
        "Their going to the store",
        "They're going to the store",
        "There going to the store"
      ],
      "correct": 1,
      "difficulty": "beginner"
    }
  ]
}
```
*10 questions, mix of difficulties, covering: spelling, grammar, homophones, punctuation, tenses*

### data/lessons/level_01.json
```json
{
  "level": 1,
  "title": "Basic Spelling Rules",
  "category": "beginner",
  "content": {
    "sections": [
      {
        "heading": "Silent E Rule",
        "explanation": "When a word ends in silent 'e', drop the 'e' before adding...",
        "examples": [
          { "correct": "writing", "wrong": "writeing", "rule": "drop the e" }
        ],
        "memory_tip": "The 'e' is silent because it already did its job!"
      }
    ]
  },
  "quiz": {
    "questions": [
      { "id": "l1q1", "question": "...", "options": [...], "correct": 0 }
    ]
  },
  "assignment": {
    "prompt": "Write 3 sentences using words that follow the silent-e rule",
    "hints": ["Try words like: make/making, write/writing"]
  },
  "credits": { "lesson": 10, "quiz_pass": 15, "quiz_perfect": 25, "assignment": 15 }
}
```
*5 lesson files for hackathon (one per major topic area)*

### data/practice_templates.json
```json
{
  "templates": [
    {
      "task_id": "email_01",
      "type": "email",
      "title": "Professional Email",
      "prompt": "Write an email to your manager requesting a day off next Friday for a medical appointment.",
      "level": "intermediate",
      "credits": 30
    }
  ]
}
```
*6 templates: email, letter, report, conversation, article, essay*
