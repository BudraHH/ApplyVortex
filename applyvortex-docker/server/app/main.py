# app/main.py

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.database import init_db, close_db
from app.core.exceptions import ApplyVortexException
from app.api.v1 import api_router
from app.tasks.cleanup import cleanup_expired_sessions
import app.models # Register all models # noqa: F401

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events (Startup and Shutdown).
    Replaces deprecated @app.on_event("startup").
    """
    # Startup: Initialize DB and resources
    logger.info("🚀 ApplyVortex starting up...")
    await init_db()
    logger.info("✅ Database connected")

    logger.info("✅ NLP Service initialized")

    from app.services.cache.redis_service import redis_service
    await redis_service.initialize()

    # Log environment info
    logger.info("=" * 60)
    logger.info(f"  App: {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"  Env: {settings.ENVIRONMENT}")
    logger.info(f"  Debug: {settings.DEBUG}")
    logger.info(f"  Docs: {settings.FRONTEND_URL}/docs")
    logger.info("=" * 60)

    yield
    
    # Shutdown: Clean up resources
    logger.info("🛑 ApplyVortex shutting down...")
    await redis_service.close()
    await close_db()
    logger.info("✅ Database closed")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Job application automation platform - Scrape, parse, apply!",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# --------------------------------------------------------------------------
# Middleware
# --------------------------------------------------------------------------

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host (Security for Production)
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

# --------------------------------------------------------------------------
# System Logging Middleware
# --------------------------------------------------------------------------
import time
from uuid import UUID
from app.core.database import AsyncSessionLocal
from app.models.system.system_log import SystemLog
from app.core.security import verify_token

@app.middleware("http")
async def system_logging_middleware(request: Request, call_next):
    start_time = time.time()
    
    # 1. Process Request
    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception as e:
        status_code = 500
        # Log before re-raising
        await log_request_to_db(request, status_code, (time.time() - start_time) * 1000, error=str(e))
        raise e
    
    # 2. Logic to decide if we log
    method = request.method
    should_log = (
        method in ["POST", "PUT", "PATCH", "DELETE"] or
        status_code >= 400
    )

    if should_log:
        # 3. Log (fire and wait to ensure persistence)
        duration_ms = (time.time() - start_time) * 1000
        await log_request_to_db(request, status_code, duration_ms)

    return response

async def log_request_to_db(request: Request, status_code: int, duration_ms: float, error: str = None):
    try:
        async with AsyncSessionLocal() as db:
            user_id = None
            
            # Auth Header
            auth_header = request.headers.get("Authorization")
            if auth_header and "Bearer " in auth_header:
                token = auth_header.split(" ")[1]
                payload = verify_token(token, token_type="access")
                if payload:
                    try:
                        user_id = UUID(payload.get("sub"))
                    except:
                        pass
            
            # Cookie Fallback
            if not user_id:
                token = request.cookies.get("access_token")
                if token:
                    clean_token = token.replace("Bearer ", "") if token.startswith("Bearer ") else token
                    payload = verify_token(clean_token, token_type="access")
                    if payload and payload.get("sub"):
                        try:
                            user_id = UUID(payload.get("sub"))
                        except:
                            pass

            log_entry = SystemLog(
                action=f"{request.method} {request.url.path}",
                status="FAILURE" if status_code >= 400 else "SUCCESS",
                user_id=user_id,
                ip_address=request.client.host if request.client else None,
                duration_ms=int(duration_ms),
                details={
                    "status_code": status_code,
                    "query_params": dict(request.query_params),
                    "user_agent": request.headers.get("user-agent"),
                    "error": error
                }
            )
            db.add(log_entry)
            await db.commit()
    except Exception as e:
        print(f"LOGGING ERROR: {e}")



# System Logging (Writes + Errors)
# Implemented via @app.middleware("http") to avoid BaseHTTPMiddleware issues


# --------------------------------------------------------------------------
# Exception Handlers
# --------------------------------------------------------------------------

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors (422)"""
    errors = exc.errors()
    logger.error(f"Validation error on {request.method} {request.url.path}: {errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": errors,
            "body": exc.body if hasattr(exc, 'body') else None
        }
    )

@app.exception_handler(ApplyVortexException)
async def applyvortex_exception_handler(request: Request, exc: ApplyVortexException):
    """Handle application-specific logic exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected server errors"""
    import traceback
    print(f"GLOBAL CAUGHT EXCEPTION: {exc}")
    traceback.print_exc()
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }

@app.on_event("startup")
async def cleanup_task() -> None:
    """Clean up expired sessions"""
    await cleanup_expired_sessions()

    
# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------

app.include_router(api_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )