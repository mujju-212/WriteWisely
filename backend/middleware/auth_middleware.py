"""
middleware/auth_middleware.py — JWT Authentication Dependency
Usage: user = Depends(get_current_user) in any protected route
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from bson.errors import InvalidId
from config import verify_jwt_token, get_db
from jose import JWTError
from pymongo.errors import PyMongoError

security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Extract and verify JWT token from Authorization header.
    Returns the user document (without password_hash).
    Raises 401 if token is invalid or user not found.
    """
    token = credentials.credentials
    
    # Verify token
    try:
        payload = verify_jwt_token(token)
        user_id = payload.get("sub")
        session_id = payload.get("sid")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        object_id = ObjectId(user_id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from DB
    db = get_db()
    try:
        user = await db.users.find_one({"_id": object_id})
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable. Please ensure MongoDB is running and retry.",
        )
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    active_session_id = user.get("active_session_id")
    if not active_session_id or active_session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified",
        )
    
    # Remove sensitive fields
    user["id"] = str(user.pop("_id"))
    user.pop("password_hash", None)
    
    return user
