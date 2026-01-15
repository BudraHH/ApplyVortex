# Manual Apply Workflow - Implementation Summary

## Overview
Implemented a unified "Manual Apply" workflow where users can click an "Apply" button on any job in their dashboard, and the agent will handle the complete application process using the same optimized one-visit policy as Auto Apply.

## Flow Architecture

### 1. User Action (Dashboard)
```
User clicks "Apply" button on a job card
    ↓
Frontend sends: POST /api/v1/jobs/{job_id}/apply
```

### 2. Server Orchestration
**File**: `applyvortex-docker/server/app/api/v1/endpoints/jobs.py`
- Creates a `JobApplication` record
- Triggers background task: `run_job_application_task(application_id)`

**File**: `applyvortex-docker/server/app/tasks/automation_tasks.py`
- Fetches job details from database
- Creates an `APPLY` task for the agent with payload:
  ```python
  {
      "job_id": str(job.id),
      "job_url": job.apply_url or job.portal_url,
      "resume_id": str(tailored_resume.id),
      "application_id": str(application_id),
      "job_title": job.title,
      "company": job.company_name
  }
  ```

### 3. Agent Execution
**File**: `agent/main.py` (Lines 213-277)

When the agent polls and receives an `APPLY` task (task_type = 3):

1. **Validation**: Checks for required `job_url` in payload
2. **Resume Download**: Downloads the user's base resume
3. **Profile Fetch**: Gets the full user profile from state manager
4. **Unified Handler**: Calls `AutoApplyHandler.execute_single_application()`

**File**: `agent/handlers/auto_apply_handler.py`

The handler executes the **One-Visit Policy**:

```
1. Navigate to job_url (THE ONLY VISIT)
   ↓
2. Deep Scrape (if not already enriched)
   - Expand full description
   - Extract requirements, responsibilities
   - Detect application_type (easy_apply/external/company_direct)
   - Extract direct apply_url
   ↓
3. Sync Enrichment to Server
   - Updates job record with full details
   ↓
4. Local AI Tailoring (Llama)
   - Fetches base resume JSON
   - Optimizes it for this specific JD
   - Sends optimized JSON to server
   - Server generates tailored PDF
   - Downloads tailored PDF
   ↓
5. Application Submission
   - If Easy Apply: Triggers LinkedIn modal, fills form
   - If External ATS: Navigates to apply_url, fills form
   - If Company Direct: Navigates to career page, fills form
   ↓
6. Proof Capture
   - Takes screenshot of confirmation
   - Sends to server with status: SUCCESS
   ↓
7. Cleanup
   - Deletes temporary base resume
   - Deletes tailored resume PDF
```

## Key Features

### Unified Code Path
Both "Auto Apply" and "Manual Apply" use the **same** `AutoApplyHandler` class, ensuring:
- Consistent behavior
- Single source of truth for application logic
- Easier maintenance and debugging

### Smart Deep Scraping
- If the job was already deep-scraped during "Find Jobs", the agent reuses that data
- If not (e.g., job added manually), the agent performs deep scraping on-demand
- No redundant visits to the same job URL

### Resume Tailoring
- **Local AI Processing**: Uses Local Llama for privacy and speed
- **Server PDF Generation**: Server handles the rendering and storage
- **Automatic Cleanup**: Temporary files are deleted after application

### Error Handling
- Validates all required fields before starting
- Reports failures back to server with detailed error messages
- Cleans up resources even on failure (finally block)

## Database Updates

### Task Payload Schema
The `APPLY` task payload now includes:
- `job_id`: For tracking and syncing
- `job_url`: Direct link to the job posting
- `job_title`: For logging and UI display
- `company`: For logging and UI display
- `application_id`: Links back to the JobApplication record
- `resume_id`: (Optional) Pre-tailored resume if server already generated one

## Testing Checklist

1. **Manual Apply - Easy Apply Job**
   - [ ] Click "Apply" on a LinkedIn Easy Apply job
   - [ ] Verify agent navigates to job URL
   - [ ] Verify Easy Apply modal is triggered
   - [ ] Verify form is filled correctly
   - [ ] Verify application is submitted
   - [ ] Verify dashboard shows "Applied" status

2. **Manual Apply - External ATS Job**
   - [ ] Click "Apply" on an external ATS job (Greenhouse, Lever, etc.)
   - [ ] Verify agent navigates to external apply URL
   - [ ] Verify form is filled correctly
   - [ ] Verify application is submitted

3. **Manual Apply - Already Enriched Job**
   - [ ] Run "Find Jobs" first (deep scrapes all jobs)
   - [ ] Click "Apply" on one of those jobs
   - [ ] Verify agent does NOT re-scrape the job description
   - [ ] Verify it proceeds directly to tailoring and application

4. **Manual Apply - Not Yet Enriched Job**
   - [ ] Manually add a job URL to the database (bypass Find Jobs)
   - [ ] Click "Apply" on that job
   - [ ] Verify agent performs deep scraping first
   - [ ] Verify it then proceeds to tailoring and application

## Future Enhancements

1. **Resume Selection**: Allow user to choose which resume to use for manual apply
2. **Custom Cover Letter**: Allow user to provide custom notes/cover letter
3. **Dry Run Mode**: Preview what the agent will do before actually applying
4. **Application Preview**: Show the filled form to user before final submission
