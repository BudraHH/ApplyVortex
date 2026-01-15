@router.patch("/{job_id}/status")
async def update_job_application_status(
    job_id: UUID,
    application_status: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update application status for a job."""
    from app.models.job.user_job_map import UserJobMap
    from app.constants.constants import ApplicationStatus
    from sqlalchemy import select
    from datetime import datetime
    
    # Find user_job_map entry
    stmt = select(UserJobMap).where(
        UserJobMap.user_id == current_user.id,
        UserJobMap.job_id == job_id
    )
    result = await db.execute(stmt)
    user_job = result.scalars().first()
    
    if not user_job:
        raise HTTPException(status_code=404, detail="Job not found in your list")
    
    # Update status
    user_job.application_status = application_status
    
    # If APPLIED, set timestamp
    if application_status == ApplicationStatus.APPLIED:
        user_job.applied_at = datetime.utcnow()
    
    await db.commit()
    
    return {
        "message": "Status updated successfully",
        "job_id": str(job_id),
        "status": application_status
    }
