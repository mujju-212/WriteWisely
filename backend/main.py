"""
main.py — WriteWisely Backend Entry Point
Run: uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from pymongo.errors import PyMongoError
from config import connect_db, close_db
from routes import auth, learning, practice, project, chat, checker, analytics, notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    try:
        yield
    finally:
        await close_db()

# ─── Create App ────────────────────────────────────────────────
app = FastAPI(
    title="WriteWisely API",
    description="Contextual Spell & Grammar Coach - Backend API",
    version="1.0.0",
    lifespan=lifespan,
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

@app.exception_handler(PyMongoError)
async def mongo_exception_handler(request: Request, exc: PyMongoError):
    return JSONResponse(
        status_code=503,
        content={"detail": "Database unavailable. Please ensure MongoDB is running and retry."}
    )


# ─── Register Routes ──────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(learning.router, prefix="/api/learning", tags=["Learning"])
app.include_router(practice.router, prefix="/api/practice", tags=["Practice"])
app.include_router(project.router, prefix="/api/project", tags=["Project"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(checker.router, prefix="/api/checker", tags=["Checker"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])


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


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
