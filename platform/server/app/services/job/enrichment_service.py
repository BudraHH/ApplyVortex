"""Service for job data enrichment (AI removed - returns empty dict)."""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class JobEnrichmentService:
    async def enrich_job(self, description: str) -> Dict[str, Any]:
        """
        Job enrichment disabled - AI functionality removed from server.
        Returns empty dict. Enrichment should be handled by external AI agent.
        """
        logger.info("Job enrichment skipped - AI not available on server")
        return {}

# Global instance
job_enrichment_service = JobEnrichmentService()

