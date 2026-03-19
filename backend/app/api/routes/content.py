"""
Content Routes
--------------
CRUD operations for user content.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from typing import Optional

from ...db.session import get_db
from ...models.user import User
from ...models.content import Content
from ...models.repurpose_job import RepurposeJob
from ...schemas.content import ContentCreate, ContentResponse, ContentList
from ..deps import get_current_user


router = APIRouter(prefix="/content", tags=["Content"])


# ============================================================================
# CREATE CONTENT
# ============================================================================

@router.post("", response_model=ContentResponse, status_code=status.HTTP_201_CREATED)
async def create_content(
    content_data: ContentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create new content for repurposing.
    
    Args:
        content_data: Content details (text, title, language)
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Created content object
    """
    new_content = Content(
        user_id=current_user.user_id,
        title=content_data.title,
        original_text=content_data.original_text,
        source_url=content_data.source_url,
        language=content_data.language
    )
    
    db.add(new_content)
    await db.flush()
    await db.refresh(new_content)
    
    print(f"[CONTENT] Created content {new_content.content_id} for user {current_user.email}")
    
    response = ContentResponse.model_validate(new_content)
    response.job_count = 0
    
    return response


# ============================================================================
# LIST CONTENT
# ============================================================================

@router.get("", response_model=ContentList)
async def list_content(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in title"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List user's content with pagination.
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page
        search: Optional title search
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Paginated list of content
    """
    # Base query
    query = select(Content).where(Content.user_id == current_user.user_id)
    count_query = select(func.count()).select_from(Content).where(
        Content.user_id == current_user.user_id
    )
    
    # Apply search filter
    if search:
        query = query.where(Content.title.ilike(f"%{search}%"))
        count_query = count_query.where(Content.title.ilike(f"%{search}%"))
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Content.created_at.desc()).offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    contents = result.scalars().all()
    
    # Get job counts for each content
    items = []
    for content in contents:
        job_count_result = await db.execute(
            select(func.count()).select_from(RepurposeJob).where(
                RepurposeJob.content_id == content.content_id
            )
        )
        job_count = job_count_result.scalar()
        
        response = ContentResponse.model_validate(content)
        response.job_count = job_count
        items.append(response)
    
    return ContentList(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + len(items)) < total
    )


# ============================================================================
# GET SINGLE CONTENT
# ============================================================================

@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(
    content_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific content by ID.
    
    Args:
        content_id: Content UUID
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Content object
        
    Raises:
        HTTPException: 404 if not found
    """
    result = await db.execute(
        select(Content).where(
            Content.content_id == content_id,
            Content.user_id == current_user.user_id
        )
    )
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    # Get job count
    job_count_result = await db.execute(
        select(func.count()).select_from(RepurposeJob).where(
            RepurposeJob.content_id == content.content_id
        )
    )
    job_count = job_count_result.scalar()
    
    response = ContentResponse.model_validate(content)
    response.job_count = job_count
    
    return response


# ============================================================================
# DELETE CONTENT
# ============================================================================

@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a content and all associated jobs/outputs.
    
    Args:
        content_id: Content UUID
        db: Database session
        current_user: Authenticated user
        
    Raises:
        HTTPException: 404 if not found
    """
    # Verify ownership
    result = await db.execute(
        select(Content).where(
            Content.content_id == content_id,
            Content.user_id == current_user.user_id
        )
    )
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    # Delete content (cascades to jobs and outputs)
    await db.delete(content)
    
    print(f"[CONTENT] Deleted content {content_id} for user {current_user.email}")
    
    return None
