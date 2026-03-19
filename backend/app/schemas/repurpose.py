"""
Repurpose Schemas
-----------------
Pydantic models for repurposing jobs and generated outputs.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum


# ============================================================================
# ENUMS
# ============================================================================

class PlatformType(str, Enum):
    """Supported output platforms."""
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    INSTAGRAM = "instagram"
    EMAIL = "email"
    YOUTUBE_SCRIPT = "youtube_script"
    YOUTUBE_SHORTS = "youtube_shorts"


class JobStatusType(str, Enum):
    """Job processing status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class RepurposeRequest(BaseModel):
    """Schema for creating a repurpose job."""
    
    content_id: str = Field(..., description="ID of content to repurpose")
    platforms: List[PlatformType] = Field(
        ..., 
        min_length=1,
        description="Target platforms for repurposing"
    )
    target_language: str = Field(default="English", description="Output language")
    
    class Config:
        json_schema_extra = {
            "example": {
                "content_id": "123e4567-e89b-12d3-a456-426614174000",
                "platforms": ["linkedin", "twitter", "email"],
                "target_language": "English"
            }
        }


class OutputUpdate(BaseModel):
    """Schema for updating generated output."""
    
    output_text: str = Field(..., min_length=1, description="Updated output text")
    
    class Config:
        json_schema_extra = {
            "example": {
                "output_text": "Updated content text here..."
            }
        }


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class GeneratedOutputResponse(BaseModel):
    """Schema for generated output data."""
    
    output_id: str
    job_id: str
    output_text: str
    format_type: str
    is_edited: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class RepurposeJobResponse(BaseModel):
    """Schema for repurpose job data."""
    
    job_id: str
    content_id: str
    target_platform: str
    target_language: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    outputs: List[GeneratedOutputResponse] = []
    
    class Config:
        from_attributes = True


class RepurposeResult(BaseModel):
    """Schema for batch repurpose result."""
    
    content_id: str
    jobs: List[RepurposeJobResponse]
    total_generated: int
    failed_platforms: List[str] = []
