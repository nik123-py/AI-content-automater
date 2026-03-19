"""
Content Model
-------------
Represents original content submitted by users for repurposing.
"""

import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, CHAR
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db.base import Base


class Content(Base):
    """
    Original content entity that users submit for AI repurposing.
    
    Attributes:
        content_id: Unique identifier (UUID stored as CHAR(36))
        user_id: Owner of the content (FK to users)
        title: Optional title for the content
        original_text: The full original content text
        source_url: Optional URL if content was fetched from web
        language: Source language of the content
        created_at: Submission timestamp
    """
    
    __tablename__ = "contents"
    
    # Primary Key (UUID stored as CHAR(36) for MySQL)
    content_id = Column(
        CHAR(36), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    
    # Foreign Key
    user_id = Column(
        CHAR(36), 
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Content Data
    title = Column(String(255), nullable=True)
    original_text = Column(Text, nullable=False)
    source_url = Column(String(2048), nullable=True)
    language = Column(String(50), default="English", nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="contents")
    repurpose_jobs = relationship(
        "RepurposeJob", 
        back_populates="content",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<Content {self.content_id}>"
