"""
User Schemas
------------
Pydantic models for user-related requests and responses.
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class UserCreate(BaseModel):
    """Schema for user registration."""
    
    name: str = Field(..., min_length=2, max_length=100, description="User's display name")
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, max_length=100, description="User's password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john@example.com",
                "password": "securepassword123"
            }
        }


class UserLogin(BaseModel):
    """Schema for user login."""
    
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "john@example.com",
                "password": "securepassword123"
            }
        }


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class UserResponse(BaseModel):
    """Schema for user data in responses."""
    
    user_id: str
    name: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response."""
    
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Schema for decoded token data."""
    
    user_id: Optional[str] = None
    email: Optional[str] = None
