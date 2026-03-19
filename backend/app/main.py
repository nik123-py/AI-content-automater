"""
AI Content Repurposer - FastAPI Application
-------------------------------------------
Main application entry point with all route registrations.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.config import settings
from .db.session import init_db, close_db
from .api.routes import auth, content, repurpose, trending


# ============================================================================
# LIFESPAN MANAGEMENT
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    print(f"[STARTUP] Initializing {settings.APP_NAME} v{settings.APP_VERSION}")
    await init_db()
    print("[STARTUP] Database initialized")
    
    yield
    
    # Shutdown
    print("[SHUTDOWN] Closing database connections")
    await close_db()
    print("[SHUTDOWN] Application stopped")


# ============================================================================
# APPLICATION FACTORY
# ============================================================================

def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        Configured FastAPI instance
    """
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Transform long-form content into social media posts, emails, and video scripts using AI",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan
    )
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Register routes
    app.include_router(auth.router, prefix="/api")
    app.include_router(content.router, prefix="/api")
    app.include_router(repurpose.router, prefix="/api")
    app.include_router(trending.router, prefix="/api")
    
    return app


# Create application instance
app = create_app()


# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/")
async def root():
    """
    Root endpoint - API information.
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME
    }
