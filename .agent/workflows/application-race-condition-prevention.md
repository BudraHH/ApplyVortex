# Application Race Condition Prevention - Implementation Guide

## Problem Statement

When a user clicks "Apply" on a job that is currently being processed by Auto Apply, or when multiple apply requests are made simultaneously, we risk:

1. **Duplicate applications** to the same job
2. **Browser conflicts** (two sessions trying to fill the same form)
3. **Database race conditions** on the `applied` flag

## Solution: Three-Layer Protection

### Layer 1: Database Status Lock (IN_PROGRESS)

**Status**: `ApplicationStatus.IN_PROGRESS = 7`

**Purpose**: Mark jobs that are currently being applied to, preventing duplicate attempts.

**Flow**:
```
1. Agent starts application
   → Set status = IN_PROGRESS
   
2. Agent completes application
   → Set status = APPLIED
   
3. Agent fails application
   → Set status = PENDING (allow retry)
```

### Layer 2: Server-Side Duplicate Check

**Location**: `/api/v1/jobs/{job_id}/apply` endpoint

**Enhancement Needed**:
```python
# Current check (lines 84-87):
existing_app = await app_repo.get_by_job_id(job_id, current_user.id)
if existing_app:
    return {"message": "Application already exists"}

# Enhanced check:
existing_app = await app_repo.get_by_job_id(job_id, current_user.id)
if existing_app:
    if existing_app.status == ApplicationStatus.IN_PROGRESS:
        return {
            "message": "Application already in progress",
            "status": "in_progress",
            "application_id": str(existing_app.id)
        }
    elif existing_app.status == ApplicationStatus.APPLIED:
        return {
            "message": "Application already submitted",
            "status": "applied",
            "application_id": str(existing_app.id)
        }
```

### Layer 3: Agent-Side Status Management

**Location**: `agent/handlers/auto_apply_handler.py`

**Enhancement Needed**:
```python
async def execute_single_application(self, job_data, resume_path, user_profile):
    job_id = job_data.get("id")
    
    try:
        # 1. Mark as IN_PROGRESS
        self.client.update_job_status(job_id, "IN_PROGRESS")
        
        # 2. Perform application
        # ... (existing code)
        
        # 3. Mark as APPLIED on success
        self.client.update_job_status(job_id, "APPLIED")
        
    except Exception as e:
        # 4. Reset to PENDING on failure (allow retry)
        self.client.update_job_status(job_id, "PENDING")
        raise
```

## Implementation Steps

### Step 1: Add Status Update Method to APIClient ✅ DONE
```python
# agent/client.py
def update_job_status(self, job_id: str, status: str):
    \"\"\"Update job application status.\"\"\"
    status_map = {
        "PENDING": 1,
        "APPLIED": 2,
        "IN_PROGRESS": 7
    }
    payload = {"status": status_map.get(status, 1)}
    response = self._request("PATCH", f"jobs/{job_id}/status", json=payload)
    return response is not None and response.status_code == 200
```

### Step 2: Add Server Endpoint for Status Updates
```python
# server/app/api/v1/endpoints/jobs.py
@router.patch("/{job_id}/status")
async def update_job_status(
    job_id: UUID,
    status: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    \"\"\"Update job application status for current user.\"\"\"
    # Update user_job_map.application_status
    # ...
```

### Step 3: Enhance Duplicate Check in apply_to_job ✅ NEEDED
```python
# Enhanced check in /jobs/{job_id}/apply endpoint
```

### Step 4: Update Agent Handler ✅ NEEDED
```python
# Add status management to execute_single_application
```

### Step 5: UI Feedback ✅ NEEDED
```javascript
// Disable "Apply" button for jobs with status IN_PROGRESS
if (job.application_status === 7) {
    return <Button disabled>Applying...</Button>
}
```

## Race Condition Scenarios & Solutions

### Scenario 1: Auto Apply Running, User Clicks Apply

**Timeline**:
```
T=0: Auto Apply starts, job #10 status = IN_PROGRESS
T=5: User clicks "Apply" on job #10
T=6: Server checks status → IN_PROGRESS
T=7: Server returns "Application already in progress"
T=8: UI shows "This job is currently being applied to"
```

**Result**: ✅ Duplicate prevented

### Scenario 2: User Clicks Apply Twice Rapidly

**Timeline**:
```
T=0: User clicks "Apply" (Request 1)
T=0.1: User clicks "Apply" again (Request 2)
T=1: Request 1 creates application, status = IN_PROGRESS
T=1.1: Request 2 checks → finds existing application with IN_PROGRESS
T=1.2: Request 2 returns "Application already in progress"
```

**Result**: ✅ Duplicate prevented

### Scenario 3: Application Fails, User Retries

**Timeline**:
```
T=0: Application starts, status = IN_PROGRESS
T=30: Application fails (network error)
T=31: Agent sets status = PENDING
T=60: User clicks "Apply" again
T=61: Server checks → status = PENDING
T=62: Server allows new application attempt
```

**Result**: ✅ Retry allowed

## Timeout Handling

**Problem**: What if agent crashes while status = IN_PROGRESS?

**Solution**: Add timeout mechanism
```python
# Server-side cleanup job (runs every 5 minutes)
async def cleanup_stale_applications():
    # Find applications with IN_PROGRESS status older than 10 minutes
    stale = await app_repo.find_stale_in_progress(timeout_minutes=10)
    for app in stale:
        # Reset to PENDING to allow retry
        await app_repo.update(app.id, {"status": ApplicationStatus.PENDING})
```

## Testing Checklist

- [ ] Test: Auto Apply running, click Manual Apply → Should show "in progress"
- [ ] Test: Click Apply twice rapidly → Second click should be rejected
- [ ] Test: Application fails → Status resets to PENDING
- [ ] Test: Application succeeds → Status set to APPLIED
- [ ] Test: UI disables button for IN_PROGRESS jobs
- [ ] Test: Stale IN_PROGRESS jobs (>10 min) reset to PENDING

## Current Status

✅ **Completed**:
- Added `ApplicationStatus.IN_PROGRESS = 7` to constants

⏳ **Pending**:
- Add `update_job_status()` method to APIClient
- Add server endpoint for status updates
- Enhance duplicate check in `apply_to_job` endpoint
- Update `AutoApplyHandler` to manage status
- Add UI feedback for IN_PROGRESS jobs
- Implement stale application cleanup

## Next Steps

1. Implement the remaining components in order
2. Test all race condition scenarios
3. Add monitoring/logging for duplicate attempts
4. Document the behavior in user-facing docs
