"""
Authentication Routes
---------------------
Handles user registration, login, and token management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...db.session import get_db
from ...models.user import User
from ...schemas.user import UserCreate, UserLogin, UserResponse, Token
from ...core.security import get_password_hash, verify_password, create_access_token
from ..deps import get_current_user


router = APIRouter(prefix="/auth", tags=["Authentication"])


# ============================================================================
# REGISTRATION
# ============================================================================

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user account.
    
    Creates a new user with hashed password and returns JWT token.
    
    Args:
        user_data: Registration data (name, email, password)
        db: Database session
        
    Returns:
        JWT token and user data
        
    Raises:
        HTTPException: 400 if email already registered
    """
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)
    
    # Generate token
    access_token = create_access_token(data={"sub": str(new_user.user_id)})
    
    print(f"[AUTH] New user registered: {new_user.email}")
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )


# ============================================================================
# LOGIN
# ============================================================================

@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return JWT token.
    
    Args:
        credentials: Login credentials (email, password)
        db: Database session
        
    Returns:
        JWT token and user data
        
    Raises:
        HTTPException: 401 if credentials invalid
    """
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == credentials.email)
    )
    user = result.scalar_one_or_none()
    
    # Verify credentials
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    access_token = create_access_token(data={"sub": str(user.user_id)})
    
    print(f"[AUTH] User logged in: {user.email}")
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


# ============================================================================
# CURRENT USER
# ============================================================================

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user's profile.
    
    Args:
        current_user: Authenticated user from token
        
    Returns:
        User profile data
    """
    return UserResponse.model_validate(current_user)
