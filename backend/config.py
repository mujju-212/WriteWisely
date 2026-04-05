"""
config.py — Single config file for WriteWisely Backend
Handles: Environment variables, MongoDB connection, JWT, Password hashing
"""

import os
import asyncio
import subprocess
import shutil
from datetime import datetime, timedelta
import uuid
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from jose import JWTError, jwt
from fastapi import HTTPException

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
AUTO_START_LOCAL_MONGO = _env_bool("AUTO_START_LOCAL_MONGO", True)
LOCAL_MONGO_DBPATH = _env("LOCAL_MONGO_DBPATH", "")

# ─── MongoDB Connection ───────────────────────────────────────
client: AsyncIOMotorClient = None
db = None
_local_mongo_process = None


def _is_localhost_mongo_url(url: str) -> bool:
    """Return true when DB url points to localhost MongoDB."""
    lower = (url or "").strip().lower()
    return lower.startswith("mongodb://localhost") or lower.startswith("mongodb://127.0.0.1")


def _find_mongod_executable() -> str | None:
    """Locate mongod executable from PATH or common Windows install locations."""
    from_path = shutil.which("mongod")
    if from_path:
        return from_path

    if os.name == "nt":
        mongo_server_root = Path("C:/Program Files/MongoDB/Server")
        if mongo_server_root.exists():
            candidates = sorted(mongo_server_root.glob("*/bin/mongod.exe"), reverse=True)
            if candidates:
                return str(candidates[0])

    return None


def _resolve_local_mongo_dbpath() -> Path:
    """Resolve the dbpath for local mongod auto-start.

    Order:
    1) LOCAL_MONGO_DBPATH env (absolute or relative to backend dir)
    2) backend/.mongo-data-recovered when present
    3) backend/.mongo-data
    """
    if LOCAL_MONGO_DBPATH:
        candidate = Path(LOCAL_MONGO_DBPATH)
        if not candidate.is_absolute():
            candidate = BASE_DIR / candidate
        return candidate

    recovered_candidate = BASE_DIR / ".mongo-data-recovered"
    if recovered_candidate.exists():
        return recovered_candidate

    return BASE_DIR / ".mongo-data"


async def _wait_for_mongo_ready(url: str, attempts: int = 10, delay_seconds: float = 0.5) -> bool:
    """Poll MongoDB until ping succeeds or attempts are exhausted."""
    for _ in range(attempts):
        probe_client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=1500)
        try:
            await probe_client.admin.command("ping")
            probe_client.close()
            return True
        except Exception:
            probe_client.close()
            await asyncio.sleep(delay_seconds)
    return False


async def _try_start_local_mongo() -> bool:
    """Start a local mongod process for dev if localhost Mongo is unavailable."""
    global _local_mongo_process

    if not AUTO_START_LOCAL_MONGO:
        return False
    if not _is_localhost_mongo_url(MONGODB_URL):
        return False

    # If Mongo is already up, treat as success.
    if await _wait_for_mongo_ready(MONGODB_URL, attempts=1, delay_seconds=0):
        return True

    mongod_executable = _find_mongod_executable()
    if not mongod_executable:
        print("[WARN] mongod executable not found; cannot auto-start local MongoDB.")
        return False

    data_dir = _resolve_local_mongo_dbpath()
    log_dir = BASE_DIR / ".mongo-log"
    log_path = log_dir / "mongod-local.log"
    data_dir.mkdir(parents=True, exist_ok=True)
    log_dir.mkdir(parents=True, exist_ok=True)

    command = [
        mongod_executable,
        "--dbpath", str(data_dir),
        "--logpath", str(log_path),
        "--bind_ip", "127.0.0.1",
        "--port", "27017",
    ]

    creationflags = 0
    if os.name == "nt":
        creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)

    try:
        _local_mongo_process = subprocess.Popen(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=creationflags,
        )
    except Exception as e:
        print(f"[WARN] Failed to launch local mongod process: {e}")
        return False

    ready = await _wait_for_mongo_ready(MONGODB_URL, attempts=12, delay_seconds=0.5)
    if ready:
        print(f"[INFO] Auto-started local MongoDB using {mongod_executable}")
        print(f"[INFO] Local MongoDB dbpath: {data_dir}")
        return True

    print("[WARN] Local mongod process started but did not become ready.")
    return False


async def connect_db():
    """Connect to MongoDB on app startup — retries 3 times with 2s delay."""
    global client, db
    attempted_local_autostart = False

    for attempt in range(1, 4):
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
            await db.chat_history.create_index([("user_id", 1), ("updated_at", -1)])
            await db.chat_history.create_index([("user_id", 1), ("title", 1)])
            await db.badges.create_index("user_id")
            await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
            await db.notifications.create_index([("user_id", 1), ("read", 1)])
            await db.daily_stats.create_index([("user_id", 1), ("date", 1)], unique=True, background=True)
            await db.weekly_stats.create_index([("user_id", 1), ("week_start", 1)], unique=True, background=True)
            await db.monthly_stats.create_index([("user_id", 1), ("month", 1), ("year", 1)], unique=True, background=True)

            print("[OK] Connected to MongoDB")
            return  # success — stop retrying
        except Exception as e:
            print(f"[WARN] MongoDB connection attempt {attempt}/3 failed: {e}")

            if not attempted_local_autostart:
                attempted_local_autostart = True
                started = await _try_start_local_mongo()
                if started:
                    print("[INFO] Retrying MongoDB connection after local auto-start.")
                    continue

            if attempt < 3:
                await asyncio.sleep(2)

    print("[ERROR] Could not connect to MongoDB after 3 attempts. API will return 503 for DB operations.")
    db = None


async def close_db():
    """Close MongoDB connection on app shutdown."""
    global client
    if client:
        client.close()
        print("[INFO] MongoDB connection closed")


def get_db():
    """Get database instance. Raises HTTP 503 if DB is not connected."""
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable. Please try again in a moment."
        )
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
