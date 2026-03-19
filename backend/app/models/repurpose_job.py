"""
Repurpose Job Model
-------------------
Represents a content repurposing task for a specific platform.
"""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, CHAR
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db.base import Base


# Job status constants
class JobStatus:
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# Supported platforms
class Platform:
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    INSTAGRAM = "instagram"
    EMAIL = "email"
    YOUTUBE_SCRIPT = "youtube_script"
    YOUTUBE_SHORTS = "youtube_shorts"
    
    @classmethod
    def all(cls):
        return [
            cls.LINKEDIN, cls.TWITTER, cls.INSTAGRAM,
            cls.EMAIL, cls.YOUTUBE_SCRIPT, cls.YOUTUBE_SHORTS
        ]


class RepurposeJob(Base):
    """
    Repurpose job entity tracking content transformation tasks.
    
    Attributes:
        job_id: Unique identifier (UUID stored as CHAR(36))
        content_id: Source content (FK to contents)
        target_platform: Platform to generate content for
        target_language: Output language
        status: Current job status (pending/processing/completed/failed)
        created_at: Job creation timestamp
        completed_at: Job completion timestamp
    """
    
    __tablename__ = "repurpose_jobs"
    
    # Primary Key (UUID stored as CHAR(36) for MySQL)
    job_id = Column(
        CHAR(36), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    
    # Foreign Key
    content_id = Column(
        CHAR(36), 
        ForeignKey("contents.content_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Job Configuration
    target_platform = Column(String(50), nullable=False)
    target_language = Column(String(50), default="English", nullable=False)
    status = Column(String(20), default=JobStatus.PENDING, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    content = relationship("Content", back_populates="repurpose_jobs")
    outputs = relationship(
        "GeneratedOutput", 
        back_populates="job",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<RepurposeJob {self.job_id} - {self.target_platform}>"
