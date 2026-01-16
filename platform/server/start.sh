#!/bin/bash

# 1. Start Redis Server in background
redis-server --daemonize yes

# 2. Start Celery Worker in background
# Use C_FORCE_ROOT=1 because we are in Docker (as root usually)
export C_FORCE_ROOT=1
celery -A app.core.celery_app worker --loglevel=info &

# 3. Start FastAPI Application
# Use port 7860 for Hugging Face Spaces
uvicorn app.main:app --host 0.0.0.0 --port 7860 --workers 2
