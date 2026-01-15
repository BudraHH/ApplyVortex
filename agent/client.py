import requests
import time
from typing import List, Any, Optional
from config import settings
from agent_id import get_or_create_agent_id
import platform
import logging

logger = logging.getLogger(__name__)

class APIClient:
    def __init__(self):
        self.base_url = settings.API_URL
        self.session = requests.Session()
        self.token = None
        self.agent_id = get_or_create_agent_id()

    def _request(self, method: str, path: str, **kwargs) -> Optional[requests.Response]:
        """Centralized request handler with auto-reauthentication and retries."""
        url = f"{self.base_url}/{path.lstrip('/')}"
        max_retries = 3
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                # Add current auth headers
                if settings.API_KEY:
                    self.session.headers.update({"X-API-Key": settings.API_KEY})

                response = self.session.request(method, url, **kwargs)
                
                # Handle Auth Expiration
                if response.status_code == 401:
                    logger.warning("Authentication failed (401). Attempting re-login...")
                    if self.login():
                        # Retry the request with new auth
                        return self.session.request(method, url, **kwargs)
                
                return response

            except (requests.ConnectionError, requests.Timeout) as e:
                logger.warning(f"Network error on {method} {path} (Attempt {attempt+1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    logger.error(f"Network failure after {max_retries} attempts.")
                    return None
            except Exception as e:
                logger.error(f"Unexpected error in _request: {e}")
                return None
        return None

    def get_user_profile(self):
        """Fetch the basic user profile for local caching (legacy)."""
        response = self._request("GET", "users/me/profile")
        if response and response.status_code == 200:
            logger.debug("Fetched basic user profile.")
            return response.json()
        return None

    def get_full_user_profile(self):
        """Fetch the FULL aggregate user profile (Education, Experience, etc.)."""
        # User API (users/me/full-profile) requires Cookie/JWT. 
        # Agent uses X-API-Key, so we use the Agent-specific endpoint:
        response = self._request("GET", "agent-forge/full-profile")
        if response and response.status_code == 200:
            logger.info("Fetched FULL user profile for caching.")
            return response.json()
        return None

    def login(self):
        """Authenticate with the server using API_KEY."""
        if not settings.API_KEY:
            # Silent fallback - triggers browser auth in main.py
            logger.debug("No API key provided in settings.")
            return False

        logger.info("Verifying API key authentication...")
        self.session.headers.update({
            "X-API-Key": settings.API_KEY
        })
        
        try:
            # Verify the key works by hitting a safe endpoint (Agent list)
            # DO NOT use get_pending_tasks() as it consumes tasks!
            test_response = self.session.get(f"{self.base_url}/agents/")
            if test_response.status_code in [200, 404]:
                logger.info("Authentication successful!")
                return True
            else:
                logger.error(f"Authentication failed: Invalid API Key (Status: {test_response.status_code})")
                return False
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return False

    def register_agent(self):
        """Register this agent with the server."""
        data = {
            "agent_id": self.agent_id,
            "hostname": platform.node(),
            "platform": platform.system(),
            "version": "1.0.0",
            "name": platform.node()
        }
        logger.info(f"Registering agent: {data['hostname']}")
        response = self._request("POST", "agents/register", json=data)
        
        if response and response.status_code in [200, 201]:
            logger.info("Agent registered successfully!")
            return True
        return False

    def send_heartbeat(self):
        """Send heartbeat to server to indicate agent is alive."""
        data = {"agent_id": self.agent_id}
        response = self._request("POST", "agents/heartbeat", json=data)
        return response is not None and response.status_code == 200

    def get_pending_tasks(self):
        """Fetch pending tasks assigned to this user."""
        response = self._request("GET", f"agent-forge/tasks?agent_id={self.agent_id}")
        if response and response.status_code == 200:
            return response.json()
        elif response and response.status_code == 429:
            logger.warning("Rate limit exceeded. Waiting before next poll...")
        return []
    

    def get_blueprint(self, portal_name: str):
        """Fetch the blueprint (PortalConfig) for a specific portal."""
        response = self._request("GET", f"agent-forge/blueprints/{portal_name}")
        if response and response.status_code == 200:
            return response.json()
        return None

    def get_active_blueprints(self):
        """Fetch all active user blueprints."""
        response = self._request("GET", "agent-forge/active-blueprints")
        if response and response.status_code == 200:
            return response.json()
        return []

    def get_unapplied_jobs(self, limit=50):
        """Fetch jobs that need applications."""
        response = self._request("GET", f"agent-forge/unapplied-jobs?limit={limit}")
        if response and response.status_code == 200:
            return response.json()
        return []

    def mark_job_applied(self, job_id):
        """Mark a job as successfully applied."""
        response = self._request("POST", f"agent-forge/jobs/{job_id}/applied")
        return response is not None and response.status_code == 200

    def get_job_details(self, job_id: str):
        """Fetch job details from server to check if already enriched."""
        try:
            response = self._request("GET", f"jobs/{job_id}")
            if response and response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            logger.error(f"Error fetching job details for {job_id}: {e}")
            return None

    def update_job_status(self, job_id: str, status: int):
        """
        Update job application status.
        Status values: NOT_APPLIED=0, APPLIED=1, IN_PROGRESS=2, FAILED=3
        """
        try:
            payload = {"application_status": status}
            response = self._request("PATCH", f"jobs/{job_id}/status", json=payload)
            if response and response.status_code == 200:
                logger.debug(f"Updated job {job_id} status to {status}")
                return True
            logger.warning(f"Failed to update job {job_id} status")
            return False
        except Exception as e:
            logger.error(f"Error updating job {job_id} status: {e}")
            return False

    def get_task(self, task_id: str):
        """Fetch a specific task by ID."""
        try:
            # We assume a GET /agent-forge/tasks/{task_id} exists or we use history
            url = f"{self.base_url}/agent-forge/tasks/{task_id}" # I need to verify this endpoint exists
            response = self.session.get(url)
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            logger.error(f"Error fetching task {task_id}: {e}")
            return None

    def submit_result(self, task_id, status, data=None, error_log=None):
        """Submit the result of a task using the new endpoint structure."""
        # Convert string status to integer
        status_map = {
            "PENDING": 1,
            "IN_PROGRESS": 2,
            "COMPLETED": 3,
            "FAILED": 4,
            "CANCELLED": 5
        }
        
        if isinstance(status, str):
            status = status_map.get(status.upper(), 4)  # Default to FAILED if unknown
        
        payload = {
            "status": status,
            "result_data": data,
            "error_log": error_log
        }
        if data:
             import json
             logger.info(f"Submitting Result Data keys: {list(data.keys())}")
             # logger.info(f"Submitting Result Data Content: {json.dumps(data, indent=2)}") 
        
        response = self._request("POST", f"agent-forge/results/{task_id}", json=payload)
        return response is not None and response.status_code == 200

    def sync_jobs(self, task_id: str, jobs: List[dict]):
        """Sync a batch of jobs to the server for a specific task."""
        mapped_jobs = self._map_jobs_to_schema(jobs)
        payload = {"jobs": mapped_jobs}
        response = self._request("POST", f"agent-forge/results/{task_id}/jobs", json=payload, timeout=300)
        return response is not None and response.status_code == 200

    
    def check_jobs_status(self, portal: str, external_ids: List[str]) -> dict:
        """Check server for existence and deep scrape status of jobs."""
        payload = {
            "portal": portal,
            "external_ids": external_ids
        }
        try:
            response = self._request("POST", "agent-forge/check-jobs-status", json=payload)
            if response and response.status_code == 200:
                return response.json()
            return {}
        except Exception as e:
            logger.error(f"Error checking jobs status: {e}")
            return {}

    def sync_enriched_job(self, job_id: str, payload: dict):
        """
        Sync enrichment decision (Smart Sync).
        Payload is pre-constructed in main.py with correct keys (status, score, enrichment_data).
        """
        response = self._request("POST", f"agent-forge/jobs/{job_id}/enrich", json=payload)
        return response is not None and response.status_code == 200

    def _map_jobs_to_schema(self, jobs: List[dict]) -> List[dict]:
        mapped_jobs = []
        for job in jobs:
            posted_at = job.get("posted_date") or job.get("posted_at")
            if isinstance(posted_at, str) and posted_at.lower() in ["recent", "today", "yesterday"]:
                posted_at = None
            
            mapped_job = {
                "title": job.get("title"),
                "company_name": job.get("company") or job.get("company_name"),
                "job_post_url": job.get("job_url") or job.get("apply_url") or job.get("job_post_url"),
                "external_id": job.get("external_id"),
                "portal_slug": job.get("portal_slug") or "linkedin",
                "location_city": job.get("location"),
                "location_raw": job.get("location"),
                "description": job.get("description"),
                "scraped_at": job.get("scraped_at"),
                "posted_at": posted_at,
                "application_status": job.get("application_status", 0), # Default to 0 (Not Applied)
                "match_score": job.get("match_score"),
                "reasoning": job.get("ai_reasoning") or job.get("reasoning"),
                "matched_skills": job.get("matched_skills", []),
                "missing_skills": job.get("missing_skills", []),
                "skill_gap_recommendations": job.get("skill_gap_recommendations", [])
            }
            mapped_job = {k: v for k, v in mapped_job.items() if v is not None}
            mapped_jobs.append(mapped_job)
        return mapped_jobs

    def get_base_resume_id(self):
        """Fetch the user's base resume ID."""
        response = self._request("GET", "agent-forge/resume")
        if response and response.status_code == 200:
            return response.json().get("id")
        return None

    def get_resume(self, resume_id: str):
        """Fetch a specific resume by ID."""
        response = self._request("GET", f"resumes/{resume_id}")
        if response and response.status_code == 200:
            return response.json()
        return None

    def tailor_resume(self, base_resume_id: str, job_description: str, job_id: Optional[str] = None, optimized_content: Optional[dict] = None):
        """Trigger resume tailoring on the server, optionally passing optimized content."""
        payload = {
            "job_description": job_description,
            "job_id": job_id,
            "optimized_content": optimized_content
        }
        response = self._request("POST", f"resumes/{base_resume_id}/tailor", json=payload, timeout=120)
        if response and response.status_code in [200, 201]:
            return response.json()
        return None

    def download_resume_by_id(self, resume_id: str, save_path: str) -> str:
        """Download a specific resume by ID via its download URL."""
        try:
            # First get the download URL
            url = f"{self.base_url}/resumes/{resume_id}/download-url"
            response = self.session.get(url)
            
            if response.status_code == 200:
                download_url = response.json().get("download_url")
                if download_url:
                    # Download the actual file
                    file_response = requests.get(download_url)
                    if file_response.status_code == 200:
                        with open(save_path, 'wb') as f:
                            f.write(file_response.content)
                        logger.info(f"Resume downloaded to: {save_path}")
                        return save_path
            
            logger.error(f"Failed to download resume {resume_id}")
            return None
        except Exception as e:
            logger.error(f"Error downloading resume file: {e}")
            return None
