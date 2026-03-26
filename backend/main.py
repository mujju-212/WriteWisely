"""
main.py — WriteWisely Backend Entry Point
Run: uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import connect_db, close_db
from routes import auth, learning, practice, project, chat, checker, analytics

# ─── Create App ────────────────────────────────────────────────
app = FastAPI(
    title="WriteWisely API",
    description="Contextual Spell & Grammar Coach - Backend API",
    version="1.0.0"
)

# ─── CORS Middleware ───────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    # Vite dev server
        "http://localhost:3000",    # Alternative dev port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Startup & Shutdown Events ─────────────────────────────────
@app.on_event("startup")
async def startup():
    await connect_db()


@app.on_event("shutdown")
async def shutdown():
    await close_db()


# ─── Register Routes ──────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(learning.router, prefix="/api/learning", tags=["Learning"])
app.include_router(practice.router, prefix="/api/practice", tags=["Practice"])
app.include_router(project.router, prefix="/api/project", tags=["Project"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(checker.router, prefix="/api/checker", tags=["Checker"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])


# ─── Health Check ──────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "app": "WriteWisely API",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
