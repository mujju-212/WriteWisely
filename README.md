# WriteWisely

WriteWisely is an AI-powered writing coach that combines structured learning, live grammar support, personal progress analytics, and contextual chat guidance in one platform.

Suggested repository description:
AI-powered writing coach with learning paths, live grammar feedback, contextual chat, project editing, and progress analytics.

## What It Does

- Learning mode with level-based lessons, quizzes, and assignment review
- Practice mode with two workflows:
	- live hint mode while typing
	- full analysis mode with scoring and corrections
- Project editor for longer writing documents with save/update workflow
- AI chat coach that uses user progress and uploaded document context
- Analytics dashboard with overview cards, trends, errors, achievements, and comparisons
- Gamification via credits, streaks, and badges
- OTP-based account verification and password reset

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 18 + Vite 5 + CSS + Font Awesome + Lucide + Recharts |
| Backend | FastAPI + Pydantic + Motor/PyMongo |
| Database | MongoDB |
| Auth | JWT + bcrypt |
| LLM Providers | Gemini (primary), OpenRouter (fallback), Hugging Face (fallback) |
| File Context | PDF/Text upload support for chat document context |
| Email/OTP | MailerSend (with optional dev fallback) |

## Architecture Overview

- Frontend app shell:
	- `src/App.jsx` switches between auth app and authenticated dashboard
	- `src/Auth.jsx` handles login/signup/otp/reset flows
	- `src/pages/Dashboard.jsx` hosts major authenticated tabs
- Backend API entry:
	- `backend/main.py` registers all route modules under `/api/*`
	- MongoDB connection and fallback behavior are in `backend/config.py`
- Core backend route groups:
	- `auth`, `learning`, `practice`, `project`, `chat`, `checker`, `analytics`, `notifications`

## Project Structure

```text
WriteWisely/
├─ backend/
│  ├─ main.py
│  ├─ config.py
│  ├─ routes/
│  ├─ services/
│  ├─ models/
│  ├─ middleware/
│  ├─ prompts/
│  ├─ data/
│  │  ├─ lessons/
│  │  ├─ quizzes/
│  │  ├─ practice_templates.json
│  │  └─ assessment_questions.json
│  ├─ seed_demo_account.py
│  └─ backfill_analytics.py
├─ frontend/
│  ├─ package.json
│  ├─ vite.config.js
│  └─ src/
│     ├─ App.jsx
│     ├─ Auth.jsx
│     ├─ pages/
│     ├─ components/
│     ├─ services/
│     ├─ hooks/
│     └─ utils/
└─ README.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm
- MongoDB (local service or Atlas)

## Quick Start

### 1) Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

Vite is configured to proxy `/api` to `http://localhost:8000` in `frontend/vite.config.js`.

## Environment Configuration

Create `backend/.env` with at least these values:

```env
# Core
MONGODB_URL=mongodb://localhost:27017/writewisely
JWT_SECRET=change-this-secret
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24

# LLM providers (set one or more)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash

OPENROUTER_API_KEY=
LLM_MODEL=google/gemma-3-12b-it:free

HF_API_KEY=
HF_MODEL=meta-llama/Llama-3.2-1B-Instruct

# OTP/Email
MAILERSEND_API_KEY=
MAILERSEND_DOMAIN=
SENDER_EMAIL=
SENDER_NAME=WriteWisely
ALLOW_OTP_DEV_FALLBACK=true

# Local Mongo recovery behavior
AUTO_START_LOCAL_MONGO=true
LOCAL_MONGO_DBPATH=
```

Notes:

- If `MONGODB_URL` points to localhost and Mongo is down, backend can auto-start local `mongod` in dev.
- If `LOCAL_MONGO_DBPATH` is set, that directory is used for local auto-start; otherwise it prefers `.mongo-data-recovered` then `.mongo-data`.

## API Surface (High-Level)

Base prefix: `/api`

- Auth (`/auth`)
	- `POST /signup`
	- `POST /verify-otp`
	- `POST /resend-otp`
	- `POST /login`
	- `POST /logout`
	- `POST /forgot-password`
	- `POST /verify-reset-otp`
	- `POST /reset-password`
	- `GET /profile`
	- `PUT /profile`
	- `PUT /change-password`
	- `GET /assessment-questions`
	- `POST /submit-assessment`
	- `DELETE /delete-account`
- Learning (`/learning`)
	- `GET /levels`
	- `GET /levels/{level_id}`
	- `POST /lesson/{level_id}/complete`
	- `POST /quiz/{level_id}`
	- `POST /assignment/{level_id}`
- Practice (`/practice`)
	- `GET /templates`
	- `GET /templates/{task_id}`
	- `POST /check`
	- `POST /submit`
	- `GET /history`
- Projects (`/project`)
	- `GET /list`
	- `POST /create`
	- `GET /{project_id}`
	- `PUT /{project_id}`
	- `DELETE /{project_id}`
- Chat (`/chat`)
	- `POST /upload-document`
	- `GET /documents`
	- `DELETE /documents/{document_id}`
	- `GET /history`
	- `POST /send`
	- `DELETE /clear`
- Checker (`/checker`)
	- `POST /check`
- Analytics (`/analytics`)
	- `GET /dashboard`
	- `GET /overview`
	- `PUT /settings`
	- `GET /export`
- Notifications (`/notifications`)
	- `GET /`
	- `PATCH /mark-read`
	- `PATCH /mark-all-read`

Swagger UI is available at `http://localhost:8000/docs`.

## Data and Content

- Lessons, quizzes, and templates are JSON-driven in `backend/data/`.
- Learning currently supports level scaffolding from 1 to 30; content files can be extended by adding more JSON entries in `data/lessons` and `data/quizzes`.

## Developer Utilities

- Seed a full demo account:

```bash
cd backend
python seed_demo_account.py
```

- Backfill analytics from existing historical records:

```bash
cd backend
python backfill_analytics.py
```

- Chat flow smoke test script:

```bash
cd backend
python _chat_e2e_stdlib.py
```

- Comprehensive backend integration test run:

```bash
cd backend
python test_backend_full.py
```

## Troubleshooting

### 401 on login

Common causes:

- wrong email/password
- account exists but `email_verified=false`
- backend connected to wrong local Mongo data directory

Check active users quickly:

```bash
cd backend
python -c "from pymongo import MongoClient; db=MongoClient('mongodb://localhost:27017/writewisely').get_default_database(); print(db.users.count_documents({}))"
```

### MongoDB connection refused (WinError 10061)

- Ensure MongoDB service is running or allow backend local auto-start.
- Verify `MONGODB_URL` and local dbpath settings.
- Check backend logs for connection attempts and selected local dbpath.

### API returns 503 database unavailable

- MongoDB is unreachable or startup failed.
- Confirm port and connection string, then restart backend.

## Security Notes

- Do not commit real API keys or secrets.
- Rotate keys immediately if they were exposed.
- Use production-grade JWT secret and secure database credentials.

## License

This repository currently has no explicit LICENSE file at root. Add one if you intend public reuse (for example MIT).
