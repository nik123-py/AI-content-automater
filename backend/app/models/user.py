"""
User Model
----------
Represents application users with authentication data.
"""

import uuid
from sqlalchemy import Column, String, DateTime, CHAR
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db.base import Base


class User(Base):
    """
    User entity for authentication and content ownership.
    
    Attributes:
        user_id: Unique identifier (UUID stored as CHAR(36))
        name: User's display name
        email: Unique email address for login
        password_hash: Bcrypt hashed password
        created_at: Account creation timestamp
        updated_at: Last update timestamp
    """
    
    __tablename__ = "users"
    
    # Primary Key (UUID stored as CHAR(36) for MySQL)
    user_id = Column(
        CHAR(36), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    
    # User Information
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    contents = relationship(
        "Content", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<User {self.email}>"
