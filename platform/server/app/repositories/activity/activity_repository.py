from typing import List, Dict
from uuid import UUID

from fastapi import Depends
from sqlalchemy import delete, select, desc, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta

from app.models.activity.activity import Activity
from app.core.database import get_session
from app.core.dependencies import get_db


class ActivityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, activity: Activity) -> Activity:
        """Create new activity log entry"""
        self.db.add(activity)
        await self.db.commit()
        await self.db.refresh(activity)
        return activity

    async def get_recent_by_user(
            self,
            user_id: UUID,
            days: int = 7,
            limit: int = 10
    ) -> List[Activity]:
        """Get recent activities for dashboard (last N days)"""
        cutoff = datetime.utcnow() - timedelta(days=days)

        result = await self.db.execute(
            select(Activity)
            .where(
                and_(
                    Activity.user_id == user_id,
                    Activity.created_at >= cutoff
                )
            )
            .options(selectinload(Activity.job))
            .order_by(desc(Activity.created_at))
            .limit(limit)
        )
        return result.scalars().all()

    async def get_activity_stats(self, user_id: UUID, days: int = 30) -> Dict:
        """Activity stats (scrapes, applications, updates)"""
        cutoff = datetime.utcnow() - timedelta(days=days)

        result = await self.db.execute(
            select(
                Activity.activity_type,
                func.count().label('count')
            )
            .where(
                and_(
                    Activity.user_id == user_id,
                    Activity.created_at >= cutoff
                )
            )
            .group_by(Activity.activity_type)
        )

        stats = dict(result.all())
        return {
            "total_activities": sum(stats.values()),
            "by_type": stats
        }

    async def cleanup_old_activities(self, days: int = 90) -> int:
        """Admin: Cleanup old activities (older than N days)"""
        cutoff = datetime.utcnow() - timedelta(days=days)

        result = await self.db.execute(
            delete(Activity)
            .where(Activity.created_at < cutoff)
        )
        await self.db.commit()
        return result.rowcount

    async def get_user_activity_summary(self, user_id: UUID) -> Dict:
        """Summary for user profile (total scrapes, applications, etc.)"""
        result = await self.db.execute(
            select(
                Activity.activity_type,
                func.count().label('count'),
                func.max(Activity.created_at).label('last_activity')
            )
            .where(Activity.user_id == user_id)
            .group_by(Activity.activity_type)
        )

        summary = {}
        for row in result.all():
            summary[row.activity_type] = {
                "count": row.count,
                "last_activity": row.last_activity.isoformat() if row.last_activity else None
            }

        return summary


# Dependency
async def get_activity_repo(db: AsyncSession = Depends(get_db)) -> ActivityRepository:
    """Get ActivityRepository dependency"""
    return ActivityRepository(db)
