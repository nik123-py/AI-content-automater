"""
Database Session Management
---------------------------
Async database engine and session factory configuration.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from .base import Base
from ..core.config import settings


# Create async engine with connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    pool_pre_ping=True,   # Verify connections before use
    pool_size=5,          # Connection pool size
    max_overflow=10       # Max additional connections
)


# Session factory for creating database sessions
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def get_db() -> AsyncSession:
    """
    Dependency that provides a database session.
    Automatically closes session after request completes.
    
    Yields:
        AsyncSession: Database session for the request
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Initialize database tables.
    Creates all tables defined in models if they don't exist.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """
    Close database connections.
    Call this on application shutdown.
    """
    await engine.dispose()
