"""
API Dependencies
----------------
Shared dependencies for API routes including authentication.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..db.session import get_db
from ..core.security import decode_access_token
from ..models.user import User


# HTTP Bearer token security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user.
    
    Validates the JWT token and returns the user object.
    Raises 401 if token is invalid or user not found.
    
    Args:
        credentials: Bearer token from Authorization header
        db: Database session
        
    Returns:
        User object for the authenticated user
        
    Raises:
        HTTPException: 401 if authentication fails
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode the token
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise credentials_exception
    
    # Extract user ID from token
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Fetch user from database
    try:
        result = await db.execute(
            select(User).where(User.user_id == user_id)
        )
        user = result.scalar_one_or_none()
    except Exception:
        raise credentials_exception
    
    if user is None:
        raise credentials_exception
    
    return user
