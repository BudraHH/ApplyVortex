from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, get_current_active_user, get_language_service, get_certification_service, get_education_service, get_project_service, get_experience_service, get_profile_service, get_accomplishment_service
from app.services.profile import ProfileService, ExperienceService, ProjectService, EducationService, CertificationService, ResumeService, LanguageService, CompleteProfileService, AccomplishmentService
from app.schemas.user.profile import ProfileResponse, ProfileCreate
from app.schemas.user.experience import BulkExperienceCreate, BulkExperienceResponse
from app.schemas.user.project import BulkProjectCreate, BulkProjectResponse
from app.schemas.user.education import BulkEducationCreate, BulkEducationResponse
from app.schemas.user.certifications import BulkCertificationCreate, BulkCertificationResponse
from app.schemas.user.accomplishment import BulkAccomplishmentCreate, BulkAccomplishmentResponse
from app.schemas.user.resume import BulkResumeCreate, BulkResumeResponse, ResumeUpload
## Removed broken import: BulkLanguageCreate, BulkLanguageResponse (file does not exist)
from app.models.user.user import User

router = APIRouter()

# Basic Profile Info
@router.get("/info", response_model=ProfileResponse)
async def get_profile_info(
    current_user: User = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service),
    db: AsyncSession = Depends(get_db)
):
    """Get basic user profile info (name, headline, social links)"""
    return await profile_service.get_profile(current_user.id)

@router.post("/info", response_model=ProfileResponse)
async def update_profile_info(
    profile_data: ProfileCreate,
    current_user: User = Depends(get_current_active_user),
    profile_service: ProfileService = Depends(get_profile_service),
    db: AsyncSession = Depends(get_db)
):
    """Update profile info (name, headline, phone, social links)"""
    return await profile_service.update_profile(current_user.id, profile_data)

# Bulk Replace Endpoints (Resume Parser UX)
@router.post("/experiences", response_model=BulkExperienceResponse)
async def replace_experiences(
    data: BulkExperienceCreate,
    current_user: User = Depends(get_current_active_user),
    experience_service: ExperienceService = Depends(get_experience_service),
    db: AsyncSession = Depends(get_db)
):
    """Replace ALL experiences + auto-map skills"""
    return await experience_service.replace_all(current_user.id, data)

@router.get("/experiences", response_model=BulkExperienceResponse)
async def get_experiences(
    current_user: User = Depends(get_current_user),
    experience_service: ExperienceService = Depends(get_experience_service),
    db: AsyncSession = Depends(get_db)
):
    """Get ALL user experiences"""
    return await experience_service.get_all(current_user.id)

@router.post("/projects", response_model=BulkProjectResponse)
async def replace_projects(
    data: BulkProjectCreate,
    current_user: User = Depends(get_current_active_user),
    project_service: ProjectService = Depends(get_project_service),
    db: AsyncSession = Depends(get_db)
):
    """Replace ALL projects + auto-map skills"""
    return await project_service.replace_all(current_user.id, data)

@router.get("/projects", response_model=BulkProjectResponse)
async def get_projects(
    current_user: User = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service),
    db: AsyncSession = Depends(get_db)
):
    """Get ALL user projects"""
    return await project_service.get_all(current_user.id)

@router.post("/educations", response_model=BulkEducationResponse)
async def replace_educations(
    data: BulkEducationCreate,
    current_user: User = Depends(get_current_active_user),
    education_service: EducationService = Depends(get_education_service),
    db: AsyncSession = Depends(get_db)
):
    """Replace ALL educations"""
    return await education_service.replace_all(current_user.id, data)

@router.get("/educations", response_model=BulkEducationResponse)
async def get_educations(
    current_user: User = Depends(get_current_user),
    education_service: EducationService = Depends(get_education_service),
    db: AsyncSession = Depends(get_db)
):
    """Get ALL user educations"""
    return await education_service.get_all(current_user.id)

@router.post("/certifications", response_model=BulkCertificationResponse)
async def replace_certifications(
    data: BulkCertificationCreate,
    current_user: User = Depends(get_current_active_user),
    certification_service: CertificationService = Depends(get_certification_service),
    db: AsyncSession = Depends(get_db)
):
    """Replace ALL certifications"""
    return await certification_service.replace_all(current_user.id, data)

@router.get("/certifications", response_model=BulkCertificationResponse)
async def get_certifications(
    current_user: User = Depends(get_current_user),
    certification_service: CertificationService = Depends(get_certification_service),
    db: AsyncSession = Depends(get_db)
):
    """Get ALL user certifications"""
    return await certification_service.get_all(current_user.id)

@router.post("/accomplishments", response_model=BulkAccomplishmentResponse)
async def replace_accomplishments(
    data: BulkAccomplishmentCreate,
    current_user: User = Depends(get_current_active_user),
    accomplishment_service: AccomplishmentService = Depends(get_accomplishment_service),
    db: AsyncSession = Depends(get_db)
):
    """Replace ALL accomplishments"""
    return await accomplishment_service.replace_all(current_user.id, data)

@router.get("/accomplishments", response_model=BulkAccomplishmentResponse)
async def get_accomplishments(
    current_user: User = Depends(get_current_user),
    accomplishment_service: AccomplishmentService = Depends(get_accomplishment_service),
    db: AsyncSession = Depends(get_db)
):
    """Get ALL user accomplishments"""
    return await accomplishment_service.get_all(current_user.id)

## Removed broken language endpoints (BulkLanguageCreate/BulkLanguageResponse not defined)

@router.get("/complete")
async def get_complete_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get complete profile (admin/export) - MVP"""
    return {
        "user_id": str(current_user.id),
        "message": "Complete profile endpoint - MVP mode",
        "profile_complete": True
    }
