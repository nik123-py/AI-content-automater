"""
Trending Content Routes
-----------------------
API endpoints for fetching trending content ideas using Gemini AI.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
import json

from ...db.session import get_db
from ...models.user import User
from ...core.gemini import gemini_client
from ..deps import get_current_user


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class ViralContentRequest(BaseModel):
    """Request body for viral content generation."""
    topic: str
    platform: str = "linkedin"
    style: str = "engaging"


router = APIRouter(prefix="/trending", tags=["Trending"])


# ============================================================================
# GET TRENDING CONTENT
# ============================================================================

@router.get("")
async def get_trending_content(
    platform: str = "general",
    current_user: User = Depends(get_current_user)
):
    """
    Get trending content ideas for a specific platform.
    
    Args:
        platform: Target platform (linkedin, twitter, instagram, youtube, general)
        current_user: Authenticated user
        
    Returns:
        List of trending topics with content suggestions
    """
    print(f"[TRENDING] Fetching trends for platform: {platform}")
    
    # Get trending content from Gemini
    result = await gemini_client.get_trending_content(platform)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to fetch trending content. Please check Gemini API configuration."
        )
    
    # Try to parse as JSON
    try:
        # Clean up the response - remove markdown code blocks if present
        cleaned = result.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        trends = json.loads(cleaned)
        
        return {
            "platform": platform,
            "trends": trends,
            "generated_at": __import__("datetime").datetime.utcnow().isoformat()
        }
    except json.JSONDecodeError:
        # Return raw text if not valid JSON
        return {
            "platform": platform,
            "trends": result,
            "generated_at": __import__("datetime").datetime.utcnow().isoformat(),
            "raw": True
        }


# ============================================================================
# GENERATE VIRAL CONTENT
# ============================================================================

@router.post("/generate")
async def generate_viral_content(
    request: Optional[ViralContentRequest] = None,
    topic: Optional[str] = None,
    platform: str = "linkedin",
    style: str = "engaging",
    current_user: User = Depends(get_current_user)
):
    """
    Generate viral-optimized content for a specific topic.
    Accepts both JSON body and query parameters.
    
    Args:
        request: Optional JSON body with topic, platform, and style
        topic: Topic as query parameter (fallback)
        platform: Platform as query parameter (fallback)
        style: Style as query parameter (fallback)
        current_user: Authenticated user
        
    Returns:
        Generated viral content
    """
    # Get values from body or query params
    final_topic = request.topic if request else topic
    final_platform = request.platform if request else platform
    final_style = request.style if request else style
    
    if not final_topic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Topic is required"
        )
    
    print(f"[TRENDING] Generating viral content for: {final_topic} on {final_platform} ({final_style})")
    
    result = await gemini_client.generate_viral_content(
        final_topic, 
        final_platform, 
        final_style
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to generate content. Please check Gemini API configuration."
        )
    
    return {
        "topic": final_topic,
        "platform": final_platform,
        "style": final_style,
        "content": result,
        "generated_at": __import__("datetime").datetime.utcnow().isoformat()
    }


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def check_gemini_health():
    """
    Check if Gemini AI service is available.
    
    Returns:
        Health status of Gemini API
    """
    is_healthy = await gemini_client.check_health()
    
    return {
        "gemini_available": is_healthy,
        "model": gemini_client.model,
        "api_configured": bool(gemini_client.api_key)
    }
