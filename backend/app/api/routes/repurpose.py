"""
Repurpose Routes
----------------
AI content repurposing endpoints using Ollama.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import List

from ...db.session import get_db
from ...models.user import User
from ...models.content import Content
from ...models.repurpose_job import RepurposeJob, JobStatus
from ...models.generated_output import GeneratedOutput
from ...schemas.repurpose import (
    RepurposeRequest, 
    RepurposeJobResponse, 
    GeneratedOutputResponse,
    OutputUpdate,
    RepurposeResult
)
from ...core.ollama import ollama_client
from ..deps import get_current_user


router = APIRouter(prefix="/repurpose", tags=["Repurpose"])


# ============================================================================
# CREATE REPURPOSE JOB
# ============================================================================

@router.post("", response_model=RepurposeResult)
async def create_repurpose_job(
    request: RepurposeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create repurpose jobs for selected platforms.
    
    Sends content to Ollama AI for each platform and saves results.
    
    Args:
        request: Repurpose request with content ID and platforms
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Result with all generated outputs
        
    Raises:
        HTTPException: 404 if content not found
    """
    # Verify content ownership
    result = await db.execute(
        select(Content).where(
            Content.content_id == request.content_id,
            Content.user_id == current_user.user_id
        )
    )
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    print(f"[REPURPOSE] Starting repurpose for content {content.content_id}")
    print(f"[REPURPOSE] Platforms: {[p.value for p in request.platforms]}")
    
    jobs = []
    failed_platforms = []
    
    # Process each platform
    for platform in request.platforms:
        print(f"[REPURPOSE] Processing platform: {platform.value}")
        
        # Create job record
        job = RepurposeJob(
            content_id=content.content_id,
            target_platform=platform.value,
            target_language=request.target_language,
            status=JobStatus.PROCESSING
        )
        db.add(job)
        await db.flush()
        
        # Call Ollama AI
        try:
            generated_text = await ollama_client.repurpose_content(
                content=content.original_text,
                platform=platform.value,
                language=request.target_language
            )
            
            if generated_text:
                # Create output record
                output = GeneratedOutput(
                    job_id=job.job_id,
                    output_text=generated_text,
                    format_type=platform.value
                )
                db.add(output)
                
                # Update job status
                job.status = JobStatus.COMPLETED
                job.completed_at = datetime.utcnow()
                
                print(f"[REPURPOSE] Successfully generated {platform.value}")
            else:
                job.status = JobStatus.FAILED
                failed_platforms.append(platform.value)
                print(f"[REPURPOSE] Failed to generate {platform.value}")
                
        except Exception as e:
            job.status = JobStatus.FAILED
            failed_platforms.append(platform.value)
            print(f"[REPURPOSE] Error generating {platform.value}: {e}")
        
        await db.flush()
        await db.refresh(job)
        
        # Load outputs for response
        outputs_result = await db.execute(
            select(GeneratedOutput).where(GeneratedOutput.job_id == job.job_id)
        )
        job_outputs = outputs_result.scalars().all()
        
        job_response = RepurposeJobResponse(
            job_id=job.job_id,
            content_id=job.content_id,
            target_platform=job.target_platform,
            target_language=job.target_language,
            status=job.status,
            created_at=job.created_at,
            completed_at=job.completed_at,
            outputs=[GeneratedOutputResponse.model_validate(o) for o in job_outputs]
        )
        jobs.append(job_response)
    
    total_generated = sum(1 for j in jobs if j.status == JobStatus.COMPLETED)
    
    print(f"[REPURPOSE] Completed: {total_generated}/{len(request.platforms)} platforms")
    
    return RepurposeResult(
        content_id=content.content_id,
        jobs=jobs,
        total_generated=total_generated,
        failed_platforms=failed_platforms
    )


# ============================================================================
# GET JOBS FOR CONTENT
# ============================================================================

@router.get("/content/{content_id}", response_model=List[RepurposeJobResponse])
async def get_jobs_for_content(
    content_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all repurpose jobs for a specific content.
    
    Args:
        content_id: Content UUID
        db: Database session
        current_user: Authenticated user
        
    Returns:
        List of jobs with outputs
    """
    # Verify content ownership
    content_result = await db.execute(
        select(Content).where(
            Content.content_id == content_id,
            Content.user_id == current_user.user_id
        )
    )
    content = content_result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    # Get jobs with outputs
    result = await db.execute(
        select(RepurposeJob)
        .options(selectinload(RepurposeJob.outputs))
        .where(RepurposeJob.content_id == content_id)
        .order_by(RepurposeJob.created_at.desc())
    )
    jobs = result.scalars().all()
    
    return [
        RepurposeJobResponse(
            job_id=job.job_id,
            content_id=job.content_id,
            target_platform=job.target_platform,
            target_language=job.target_language,
            status=job.status,
            created_at=job.created_at,
            completed_at=job.completed_at,
            outputs=[GeneratedOutputResponse.model_validate(o) for o in job.outputs]
        )
        for job in jobs
    ]


# ============================================================================
# GET SINGLE OUTPUT
# ============================================================================

@router.get("/output/{output_id}", response_model=GeneratedOutputResponse)
async def get_output(
    output_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific generated output.
    
    Args:
        output_id: Output UUID
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Generated output object
    """
    # Get output with ownership verification
    result = await db.execute(
        select(GeneratedOutput)
        .join(RepurposeJob)
        .join(Content)
        .where(
            GeneratedOutput.output_id == output_id,
            Content.user_id == current_user.user_id
        )
    )
    output = result.scalar_one_or_none()
    
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    return GeneratedOutputResponse.model_validate(output)


# ============================================================================
# UPDATE OUTPUT
# ============================================================================

@router.put("/output/{output_id}", response_model=GeneratedOutputResponse)
async def update_output(
    output_id: str,
    update_data: OutputUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a generated output (user editing).
    
    Args:
        output_id: Output UUID
        update_data: New output text
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Updated output object
    """
    # Get output with ownership verification
    result = await db.execute(
        select(GeneratedOutput)
        .join(RepurposeJob)
        .join(Content)
        .where(
            GeneratedOutput.output_id == output_id,
            Content.user_id == current_user.user_id
        )
    )
    output = result.scalar_one_or_none()
    
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    # Update output
    output.output_text = update_data.output_text
    output.is_edited = True
    output.updated_at = datetime.utcnow()
    
    await db.flush()
    await db.refresh(output)
    
    print(f"[REPURPOSE] Updated output {output_id}")
    
    return GeneratedOutputResponse.model_validate(output)


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def check_ollama_health():
    """
    Check if Ollama AI service is available.
    
    Returns:
        Health status of Ollama
    """
    is_healthy = await ollama_client.check_health()
    
    return {
        "ollama_available": is_healthy,
        "model": ollama_client.model,
        "base_url": ollama_client.base_url
    }
