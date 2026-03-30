"""
config.py — Single config file for WriteWisely Backend
Handles: Environment variables, MongoDB connection, JWT, Password hashing
"""

import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from jose import JWTError, jwt
from passlib.context import CryptContext

# Load .env
load_dotenv()

# ─── Environment Variables ────────────────────────────────────
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen/qwen3-next-80b-a3b-instruct:free")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
MAILERSEND_API_KEY = os.getenv("MAILERSEND_API_KEY", "")
MAILERSEND_DOMAIN = os.getenv("MAILERSEND_DOMAIN", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "")
SENDER_NAME = os.getenv("SENDER_NAME", "WriteWisely")

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
def create_jwt_token(user_id: str) -> str:
    """Create a JWT token for a user."""
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt_token(token: str) -> str:
    """Verify JWT token and return user_id. Raises JWTError if invalid."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise JWTError("No user_id in token")
        return user_id
    except JWTError:
        raise


# ─── Password Hashing ─────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)
