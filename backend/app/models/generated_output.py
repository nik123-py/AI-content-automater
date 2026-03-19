"""
Generated Output Model
----------------------
Represents AI-generated content for a specific platform.
"""

import uuid
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, CHAR
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db.base import Base


class GeneratedOutput(Base):
    """
    Generated output entity storing AI-created content.
    
    Attributes:
        output_id: Unique identifier (UUID stored as CHAR(36))
        job_id: Parent job (FK to repurpose_jobs)
        output_text: The generated content text
        format_type: Content format (post, thread, script, etc.)
        is_edited: Whether user has modified the output
        created_at: Generation timestamp
        updated_at: Last edit timestamp
    """
    
    __tablename__ = "generated_outputs"
    
    # Primary Key (UUID stored as CHAR(36) for MySQL)
    output_id = Column(
        CHAR(36), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    
    # Foreign Key
    job_id = Column(
        CHAR(36), 
        ForeignKey("repurpose_jobs.job_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Output Data
    output_text = Column(Text, nullable=False)
    format_type = Column(String(50), nullable=False)
    is_edited = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    job = relationship("RepurposeJob", back_populates="outputs")
    
    def __repr__(self):
        return f"<GeneratedOutput {self.output_id}>"
