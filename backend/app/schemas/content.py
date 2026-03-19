"""
Content Schemas
---------------
Pydantic models for content-related requests and responses.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class ContentCreate(BaseModel):
    """Schema for creating new content."""
    
    title: Optional[str] = Field(None, max_length=255, description="Optional title")
    original_text: str = Field(..., min_length=50, description="The content to repurpose")
    source_url: Optional[str] = Field(None, description="Source URL if applicable")
    language: str = Field(default="English", description="Source language")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "My Blog Post",
                "original_text": "This is a long-form blog post about AI and content creation...",
                "source_url": "https://myblog.com/post",
                "language": "English"
            }
        }


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class ContentResponse(BaseModel):
    """Schema for content data in responses."""
    
    content_id: str
    user_id: str
    title: Optional[str]
    original_text: str
    source_url: Optional[str]
    language: str
    created_at: datetime
    job_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


class ContentList(BaseModel):
    """Schema for paginated content list."""
    
    items: List[ContentResponse]
    total: int
    page: int
    page_size: int
    has_more: bool
