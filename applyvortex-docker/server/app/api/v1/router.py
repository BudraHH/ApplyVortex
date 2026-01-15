"""Versioned API routing."""

from fastapi import APIRouter
from .endpoints import (
    auth, 
    users, 
    skills, 
    jobs, 
    scrapers, 
    dashboard,
    profile,
    resumes,
    applications,
    notifications,
    blueprint,
    agent_forge,
    agent_keys,
    agents,
    admin,
    intelligence
)
from .endpoints.user import research

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(skills.router, prefix="/skills", tags=["skills"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(scrapers.router, prefix="/scrapers", tags=["scrapers"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(blueprint.router, prefix="/targeting", tags=["targeting"])
api_router.include_router(agent_forge.router, prefix="/agent-forge", tags=["agent-forge"])
api_router.include_router(agent_keys.router, prefix="/agent-keys", tags=["agent-keys"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(intelligence.router, prefix="/intelligence", tags=["intelligence"])
api_router.include_router(research.router, prefix="/profile/research", tags=["research"])

# Global Aliases
from .endpoints.users import delete_account
api_router.delete("/account", tags=["users"], response_model=dict)(delete_account)

