"""
config.py — Single config file for WriteWisely Backend
Handles: Environment variables, MongoDB connection, JWT, Password hashing
"""

import os
from datetime import datetime, timedelta
import uuid
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from jose import JWTError, jwt

# Load .env (prefer backend/.env, then workspace root .env)
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")


def _env(name: str, default: str = "") -> str:
    value = os.getenv(name, default)
    if isinstance(value, str):
        return value.strip()
    return value


def _env_bool(name: str, default: bool = False) -> bool:
    raw = _env(name, "true" if default else "false").lower()
    return raw in {"1", "true", "yes", "on"}

# ─── Environment Variables ────────────────────────────────────
MONGODB_URL = _env("MONGODB_URL", "mongodb://localhost:27017")
JWT_SECRET = _env("JWT_SECRET", "dev-secret-key")
JWT_ALGORITHM = _env("JWT_ALGORITHM", "HS256")
JWT_EXPIRY_HOURS = int(_env("JWT_EXPIRY_HOURS", "24"))
OPENROUTER_API_KEY = _env("OPENROUTER_API_KEY", "")
LLM_MODEL = _env("LLM_MODEL", "google/gemma-3-12b-it:free")
GEMINI_API_KEY = _env("GEMINI_API_KEY", "")
GEMINI_MODEL = _env("GEMINI_MODEL", "gemini-2.0-flash")
HF_API_KEY = _env("HF_API_KEY", "")
HF_MODEL = _env("HF_MODEL", "meta-llama/Llama-3.2-1B-Instruct")
MAILERSEND_API_KEY = _env("MAILERSEND_API_KEY", "")
MAILERSEND_DOMAIN = _env("MAILERSEND_DOMAIN", "")
SENDER_EMAIL = _env("SENDER_EMAIL", "")
SENDER_NAME = _env("SENDER_NAME", "WriteWisely")
ALLOW_OTP_DEV_FALLBACK = _env_bool("ALLOW_OTP_DEV_FALLBACK", True)

# ─── MongoDB Connection ───────────────────────────────────────
client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Connect to MongoDB on app startup."""
    global client, db
    try:
        client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        db = client.writewisely
        
        # Test connection
        await client.admin.command('ping')
        
        # Create indexes
        await db.users.create_index("email", unique=True)
        await db.otp_store.create_index("email")
        await db.otp_store.create_index("expires_at", expireAfterSeconds=0)  # TTL
        await db.learning_progress.create_index([("user_id", 1), ("level_number", 1)])
        await db.error_patterns.create_index([("user_id", 1), ("frequency", -1)])
        await db.practice_records.create_index([("user_id", 1), ("submitted_at", -1)])
        await db.projects.create_index([("user_id", 1), ("updated_at", -1)])
        await db.chat_history.create_index("user_id")
        await db.badges.create_index("user_id")
        await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
        await db.notifications.create_index([("user_id", 1), ("read", 1)])
        
        print("✅ Connected to MongoDB")
    except Exception as e:
        print(f"⚠️ MongoDB connection failed: {e}")
        print("⚠️ Server running without database — update .env with valid MONGODB_URL")


async def close_db():
    """Close MongoDB connection on app shutdown."""
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed")


def get_db():
    """Get database instance."""
    return db


# ─── JWT Token Management ─────────────────────────────────────
def generate_session_id() -> str:
    """Generate a unique session identifier."""
    return uuid.uuid4().hex


def create_jwt_token(user_id: str, session_id: str) -> str:
    """Create a JWT token for a user session."""
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    payload = {
        "sub": str(user_id),
        "sid": session_id,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt_token(token: str) -> dict:
    """Verify JWT token and return decoded payload. Raises JWTError if invalid."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        session_id = payload.get("sid")
        if user_id is None:
            raise JWTError("No user_id in token")
        if session_id is None:
            raise JWTError("No session_id in token")
        return payload
    except JWTError:
        raise


# ─── Password Hashing ─────────────────────────────────────────
import bcrypt


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )
