# Application Status Management - Simplified Design

## Status Definitions

ApplyVortex focuses **only on the application submission process**, not post-application tracking.

```python
class ApplicationStatus(IntEnum):
    NOT_APPLIED = 0   # Job discovered but not yet applied
    APPLIED = 1       # Application successfully submitted
    IN_PROGRESS = 2   # Application currently being processed by agent
    FAILED = 3        # Application submission failed (can retry)
```

---

## Status Lifecycle

### **State Machine**

```
NOT_APPLIED (0)
    ↓
    User clicks "Apply" OR Auto Apply picks up job
    ↓
IN_PROGRESS (2)
    ↓
    ├─→ SUCCESS → APPLIED (1) ✅
    └─→ FAILURE → FAILED (3) ❌
                    ↓
                    User can retry
                    ↓
                IN_PROGRESS (2)
```

### **Transitions**

| From | To | Trigger | Action |
|------|-----|---------|--------|
| NOT_APPLIED | IN_PROGRESS | Agent starts application | Mark job as locked |
| IN_PROGRESS | APPLIED | Application succeeds | Set `applied_at` timestamp |
| IN_PROGRESS | FAILED | Application fails | Log error, allow retry |
| FAILED | IN_PROGRESS | User retries | Attempt application again |

---

## Race Condition Prevention

### **Problem Scenarios**

#### **Scenario 1: Auto Apply Running, User Clicks Apply**
```
T=0: Auto Apply starts job #10 → status = IN_PROGRESS
T=5: User clicks "Apply" on job #10
T=6: Server checks status → IN_PROGRESS
T=7: Server rejects: "Application already in progress"
```
**Result**: ✅ Duplicate prevented

#### **Scenario 2: User Clicks Apply Twice**
```
T=0: User clicks "Apply" (Request 1)
T=0.1: User clicks "Apply" (Request 2)
T=1: Request 1 sets status = IN_PROGRESS
T=1.1: Request 2 checks → finds IN_PROGRESS
T=1.2: Request 2 rejected
```
**Result**: ✅ Duplicate prevented

#### **Scenario 3: Application Fails, User Retries**
```
T=0: Application starts → IN_PROGRESS
T=30: Network error → FAILED
T=60: User clicks "Apply" again
T=61: Server checks → FAILED (allowed to retry)
T=62: New attempt → IN_PROGRESS
```
**Result**: ✅ Retry allowed

---

## Implementation Components

### **1. Server-Side Duplicate Check** ✅ CRITICAL

**Location**: `/api/v1/jobs/{job_id}/apply`

```python
@router.post("/{job_id}/apply")
async def apply_to_job(job_id: UUID, ...):
    # Get user_job_map entry
    user_job = await user_job_repo.get_by_job_and_user(job_id, user_id)
    
    if user_job:
        if user_job.application_status == ApplicationStatus.IN_PROGRESS:
            raise HTTPException(
                status_code=409,
                detail="Application already in progress for this job"
            )
        elif user_job.application_status == ApplicationStatus.APPLIED:
            raise HTTPException(
                status_code=409,
                detail="You have already applied to this job"
            )
        # FAILED status is allowed to retry
    
    # Create/update user_job_map with IN_PROGRESS
    # Create agent task
    # ...
```

### **2. Agent Status Management** ✅ CRITICAL

**Location**: `agent/handlers/auto_apply_handler.py`

```python
async def execute_single_application(self, job_data, resume_path, user_profile):
    job_id = job_data.get("id")
    
    try:
        # 1. Mark as IN_PROGRESS
        self.client.update_job_status(job_id, ApplicationStatus.IN_PROGRESS)
        logger.info(f"Job {job_id} marked as IN_PROGRESS")
        
        # 2. Perform application (existing code)
        # ... navigate, scrape, tailor, submit ...
        
        # 3. Mark as APPLIED on success
        self.client.update_job_status(job_id, ApplicationStatus.APPLIED)
        logger.info(f"Job {job_id} successfully applied!")
        
    except Exception as e:
        # 4. Mark as FAILED on error
        self.client.update_job_status(job_id, ApplicationStatus.FAILED)
        logger.error(f"Job {job_id} application failed: {e}")
        raise
```

### **3. API Client Method** ✅ NEEDED

**Location**: `agent/client.py`

```python
def update_job_status(self, job_id: str, status: int):
    """Update job application status."""
    payload = {"application_status": status}
    response = self._request("PATCH", f"jobs/{job_id}/status", json=payload)
    if response and response.status_code == 200:
        return True
    logger.error(f"Failed to update job {job_id} status to {status}")
    return False
```

### **4. Server Status Update Endpoint** ✅ NEEDED

**Location**: `server/app/api/v1/endpoints/jobs.py`

```python
@router.patch("/{job_id}/status")
async def update_job_application_status(
    job_id: UUID,
    status: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update application status for a job."""
    from app.repositories.job.user_job_repository import UserJobRepository
    
    user_job_repo = UserJobRepository(db)
    user_job = await user_job_repo.get_by_job_and_user(job_id, current_user.id)
    
    if not user_job:
        raise HTTPException(status_code=404, detail="Job not found in your list")
    
    # Update status
    await user_job_repo.update(user_job.id, {"application_status": status})
    
    # If APPLIED, set timestamp
    if status == ApplicationStatus.APPLIED:
        await user_job_repo.update(user_job.id, {"applied_at": datetime.utcnow()})
    
    await db.commit()
    return {"message": "Status updated", "status": status}
```

### **5. UI Feedback** ✅ NEEDED

**Location**: Frontend job card component

```javascript
function JobCard({ job }) {
    const getApplyButton = () => {
        switch (job.application_status) {
            case 0: // NOT_APPLIED
                return <Button onClick={handleApply}>Apply</Button>;
            
            case 1: // APPLIED
                return <Badge variant="success">Applied ✓</Badge>;
            
            case 2: // IN_PROGRESS
                return <Button disabled>
                    <Spinner size="sm" /> Applying...
                </Button>;
            
            case 3: // FAILED
                return <Button onClick={handleApply} variant="warning">
                    Retry Application
                </Button>;
        }
    };
    
    return <div>{getApplyButton()}</div>;
}
```

---

## Timeout & Cleanup

### **Problem**: Agent crashes while status = IN_PROGRESS

**Solution**: Background cleanup job

```python
# server/app/tasks/cleanup_tasks.py
async def cleanup_stale_applications():
    """Reset stale IN_PROGRESS applications to FAILED."""
    from datetime import datetime, timedelta
    
    cutoff_time = datetime.utcnow() - timedelta(minutes=15)
    
    # Find IN_PROGRESS jobs older than 15 minutes
    stale_jobs = await user_job_repo.find_stale_in_progress(cutoff_time)
    
    for job in stale_jobs:
        await user_job_repo.update(job.id, {
            "application_status": ApplicationStatus.FAILED,
            "notes": "Application timed out (agent may have crashed)"
        })
    
    logger.info(f"Cleaned up {len(stale_jobs)} stale applications")
```

**Schedule**: Run every 5 minutes via Celery/background task

---

## Database Migration

### **Migration Script**

```sql
-- Update existing records
UPDATE user_job_map 
SET application_status = 0 
WHERE application_status = 1 AND applied_at IS NULL;

UPDATE user_job_map 
SET application_status = 1 
WHERE applied_at IS NOT NULL;

-- Add index for performance
CREATE INDEX idx_user_job_status ON user_job_map(application_status);
```

---

## Testing Checklist

- [ ] **Duplicate Prevention**: Auto Apply running, click Manual Apply → Rejected
- [ ] **Rapid Clicks**: Click Apply twice → Second rejected
- [ ] **Success Flow**: Application succeeds → Status = APPLIED
- [ ] **Failure Flow**: Application fails → Status = FAILED
- [ ] **Retry**: Failed job can be retried
- [ ] **UI States**: All 4 status states display correctly
- [ ] **Timeout**: Stale IN_PROGRESS jobs reset to FAILED after 15 min
- [ ] **Dashboard Filter**: Can filter by status (NOT_APPLIED, APPLIED, FAILED)

---

## Summary

### **Status Values** ✅ DONE
```
NOT_APPLIED = 0
APPLIED = 1
IN_PROGRESS = 2
FAILED = 3
```

### **Next Steps** ⏳ PENDING
1. Add `update_job_status()` to APIClient
2. Add `PATCH /jobs/{job_id}/status` endpoint
3. Update `AutoApplyHandler` to manage status
4. Enhance duplicate check in `apply_to_job`
5. Update UI to show all 4 states
6. Implement stale application cleanup
7. Run database migration

This design is **clean, focused, and prevents all race conditions** while allowing users to retry failed applications! 🚀
