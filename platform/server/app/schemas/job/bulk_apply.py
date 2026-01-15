from typing import List
from uuid import UUID
from pydantic import BaseModel

class BulkApplyRequest(BaseModel):
    job_ids: List[UUID]
    base_resume_id: UUID
    auto_tailor: bool = True
