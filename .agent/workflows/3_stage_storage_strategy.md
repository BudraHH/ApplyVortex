---
description: 3-Stage "Lazy Enrichment" Data Storage Workflow
---

# 3-Stage "Lazy Enrichment" Storage Workflow

This workflow defines the efficient processing pipeline for job data, optimizing for storage size, bandwidth, and relevance. It prioritizes saving "heavy" data (descriptions) only for high-value matches.

## core_philosophy
> "Only store what matters. Filter early, enrich selectively."

---

## 1. Stage 1: The "Lead" (Shallow Scrape)
**Goal:** Rapidly register existence of jobs from search results.
**Context:** Agent scraping LinkedIn/Naukri search pages (pagination).

1.  **Agent Action**: Scrapes a batch of 25 jobs (Title, Company, Location, URL, External ID).
2.  **Process**:
    *   **Filtering**: Agent checks for basic keyword blacklists (e.g., exclude "Manager" or "Revature") via Regex.
    *   **Payload Construction**: Creates a lightweight JSON list.
3.  **Server Action (API: `POST /agent-forge/jobs/sync`)**:
    *   **Deduplication**: Checks `jobs` table by `external_id`.
    *   **Upsert**:
        *   **Global**: Insert new rows into `jobs` (Description is `NULL`).
        *   **Map**: Insert new rows into `user_job_map` with `status="DISCOVERED"`.
    *   **Return**: Returns IDs of jobs that are **NEW** or **Expired** (needs re-check).

---

## 2. Stage 2: The "Enrichment" (Deep Scrape + Local Scoring)
**Goal:** Gather details and determine relevance using Local AI.
**Context:** Agent iterating through the "DISCOVERED" jobs list.

1.  **Selection**: Agent picks the next job where `description` is missing.
2.  **Deep Scrape**: Visits job URL, extracts full description, requirements, and `is_easy_apply` flag.
3.  **Local Intelligence (Qwen 2.5)**:
    *   Agent runs `local_qwen_service.score_match(resume, description)`.
    *   **Output**: `score` (0-100), `reasoning`, `missing_skills`.
4.  **The "Efficiency Gate" (Critical Step)**:
    *   **IF Score < 30 (Junk)**:
        *   Mark as `AUTO_REJECTED`.
        *   Discard the full `description` text to save bandwidth/storage.
    *   **IF Score >= 30 (Viable)**:
        *   Keep all data.
        *   Mark as `MATCHED`.

---

## 3. Stage 3: The "Smart Sync" (Server Update)
**Goal:** Persist the decision to the cloud.
**Context:** Agent sending results back to Server.

1.  **Agent Action**: Sends `POST /agent-forge/jobs/{id}/enrich`.
2.  **Payload Logic**:
    *   **Case A (Junk)**:
        ```json
        {
          "match_score": 15,
          "status": "AUTO_REJECTED",
          "ai_reasoning": "Missing Python...",
          "enrichment_data": null  // Don't send the text!
        }
        ```
    *   **Case B (Viable)**:
        ```json
        {
          "match_score": 85,
          "status": "MATCHED",
          "ai_reasoning": "Strong match...",
          "enrichment_data": {
             "description": "...",
             "requirements": "...",
             "is_easy_apply": true
          }
        }
        ```
3.  **Server Action**:
    *   **Map Update (`user_job_map`)**: Updates `application_status` (e.g. `MATCHED` or `AUTO_REJECTED`).
    *   **Analysis Update (`job_match_analysis`)**: Inserts/Updates a row with:
        *   `overall_match` (The Score)
        *   `analysis_notes` (Reasoning)
        *   `missing_skills` & `skill_gap_recommendations`
    *   **Global Update (`jobs`) - Conditional**:
        *   Only updates `description`, `requirements`, `deep_scraped_at` IF `enrichment_data` is provided.
        *   If multiple users scrape the same job, and *User A* rejected it (no desc) but *User B* matched it (with desc), the Global Table eventually gets the description from *User B*.
4.  **Result**:
    *   DB size minimized (Junk text never stored).
    *   "Trash" jobs don't clutter the UI but are "remembered" as rejected so they aren't scraped again.
