"""
Database Base Configuration
---------------------------
SQLAlchemy base class and common model utilities.
"""

from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, DateTime
from datetime import datetime


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.
    Provides common functionality and metadata.
    """
    pass


class TimestampMixin:
    """
    Mixin class that adds created_at and updated_at timestamps.
    Use this in models that need automatic timestamp tracking.
    """
    created_at = Column(
        DateTime, 
        default=datetime.utcnow, 
        nullable=False
    )
    updated_at = Column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow,
        nullable=True
    )
