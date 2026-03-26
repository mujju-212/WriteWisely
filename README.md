# ✍️ WriteWisely — Contextual Spell & Grammar Coach

> Not just a spell checker — a **personal language tutor** that learns your patterns and helps you write better.

## 🎯 Features

- **Learning Mode** — 30 structured levels with lessons, quizzes & assignments
- **Practice Mode** — Write emails, letters, essays with live hints or detailed analysis (scored 1-10)
- **Project Mode** — Full document editor with real-time coaching sidebar
- **AI Chat** — Personal grammar coach that knows your learning history
- **Analytics** — Track accuracy, error patterns, streaks & achievements
- **Gamification** — Credits, badges, ranks & shareable certificates

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TailwindCSS |
| Backend | Python FastAPI |
| Database | MongoDB |
| AI/LLM | OpenRouter API (with edit-distance fallback) |
| Email | SMTP (OTP verification) |

## 📁 Project Structure

```
WriteWisely/
├── frontend/
│   └── src/
│       ├── pages/        # All pages (Login, Dashboard, Lesson, etc.)
│       ├── components/   # Reusable UI (Sidebar, TextEditor, etc.)
│       ├── services/     # API calls (api.js, authService, dataService)
│       ├── context/      # Auth & Theme providers
│       ├── hooks/        # useDebounce
│       └── utils/        # constants & helpers
│
├── backend/
│   ├── main.py           # FastAPI entry point
│   ├── config.py         # DB, JWT, settings (single file)
│   ├── routes/           # API endpoints
│   ├── models/           # user.py + schemas.py
│   ├── services/         # LLM, checker, email, pattern
│   ├── prompts/          # All LLM prompt templates
│   ├── middleware/       # JWT auth
│   └── data/             # Lessons, quizzes, templates
│
└── README.md
```

## 🚀 Getting Started

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `.env` in both `frontend/` and `backend/`:

**backend/.env**
```
MONGODB_URL=mongodb+srv://...
JWT_SECRET=your-secret-key
OPENROUTER_API_KEY=your-key
SMTP_EMAIL=your-email
SMTP_PASSWORD=your-app-password
```

**frontend/.env**
```
VITE_API_URL=http://localhost:8000/api
```

## 👥 Team

Built for hackathon prototype.

## 📄 License

MIT
