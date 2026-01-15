from celery import Celery
from app.core.config import settings

def create_celery_app() -> Celery:
    celery_app = Celery(
        "applyvortex",
        broker=settings.REDIS_URL,
        backend=settings.REDIS_URL,
        include=['app.worker', 'app.tasks.resume_tasks', 'app.tasks.scraping_tasks']
    )

    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
    )

    return celery_app

celery_app = create_celery_app()
