"""
Application Configuration
-------------------------
Central configuration management using Pydantic Settings.
All environment variables are loaded and validated here.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "AI Content Repurposer"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database (MySQL)
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Ollama AI (Local)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama2-uncensored"
    OLLAMA_TIMEOUT: int = 120  # seconds
    
    # Gemini AI (Google) with Search Grounding
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Uses LRU cache to avoid re-reading env file on every call.
    """
    return Settings()


settings = get_settings()
