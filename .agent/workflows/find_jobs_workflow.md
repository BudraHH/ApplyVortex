---
description: "Find Jobs" End-to-End Workflow
---

# "Find Jobs" Workflow (User Journey)

This workflow details the system behavior when a user initiates a manual job search via the **"Find Jobs"** button on the Dashboard.

## 1. User Action (Frontend)
1.  **Trigger**: User enters keywords ("Python Developer") and location ("Remote") on the Dashboard.
2.  **Action**: User clicks **"Find Jobs"**.
3.  **API Call**: Frontend sends `POST /api/manual-task` with payload:
    ```json
    {
      "task_type": "SCRAPE",
      "payload": {
        "keywords": ["Python Developer"],
        "location": "Remote",
        "portal": "LinkedIn"
      }
    }
    ```
4.  **UI State**: Dashboard indicates "Task Queued".

## 2. Server Processing
1.  **Task Creation**: Server creates a `Task` record with status `PENDING`.
2.  **Assignment**: Assigns task to the registered Agent ID for the user.

## 3. Agent Execution (Local System)
The Agent picks up the task during its poll cycle.

### Phase A: Discovery (Shallow Scrape)
1.  **Browser Launch**: Agent launches stealth browser (LinkedIn).
2.  **Search**: Navigates to search results page.
3.  **Extraction**: Scrapes basic details (Title, Company, URL) for ~25 jobs.
4.  **Sync (Stage 1)**: Calls `sync_jobs` to send these "Leads" to the server immediately.
    *   *User Visibility*: Dashboard now shows 25 job cards. Status: "Pending Analysis".

### Phase B: Enrichment (Deep Scrape & AI)
Agent iterates through the 25 jobs in the background:
1.  **Visit**: Navigates to the specific Job ID.
2.  **Extract**: Grabs full `description` and `requirements`.
3.  **AI Score**: Runs Local Qwen 2.5 scoring against User Profile.
    *   *Metric*: Calculates `match_score` (0-100).
    *   *Grading*: Assigns Tier (0=Reject, 1=Good, 2=Strong, 3=Perfect).

### Phase C: Smart Filter (Stage 3)
1.  **Auto-Reject Check**:
    *   **IF Score < 70**: Payload = `status: AUTO_REJECTED`, `enrichment: null`.
    *   **IF Score >= 70**: Payload = `status: MATCHED`, `enrichment: {full_text...}`.
2.  **Sync**: Calls `sync_enriched_job`.

## 4. Final Result (Dashboard Update)
As Phase C completes for each job:
*   **Low Scores**: Jobs disappear or move to "Rejected" tab.
*   **High Scores**: Job cards update with:
    *   **Badge**: "87% Match" (Green) or "Perfect Match" (95%).
    *   **Reasoning**: "Matches your Python/Django experience."
    *   **Action**: "Apply" button becomes enabled.
