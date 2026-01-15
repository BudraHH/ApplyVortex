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
