"""
middleware/auth_middleware.py — JWT Authentication Dependency
Usage: user = Depends(get_current_user) in any protected route
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from config import verify_jwt_token, get_db
from jose import JWTError

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
        user_id = verify_jwt_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from DB
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
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
