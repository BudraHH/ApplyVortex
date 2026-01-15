from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, desc, or_
from datetime import datetime, timedelta, timezone
from typing import Dict, Any

from app.models.user.user import User
from app.models.user.resume import UserResume
from app.models.job.job import Job
from app.models.job.job_application import JobApplication
from app.models.system.system_log import SystemLog
from app.models.system.alert import SystemAlert


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_stats(self) -> Dict[str, Any]:
        """
        Aggregate stats for Admin Dashboard.
        Fetches real-time metrics from the database.
        """
        now = datetime.now(timezone.utc)
        last_24h = now - timedelta(hours=24)

        # 1. User Stats (Combined)
        # Combine Total Users and Active Users (24h) in one query
        user_stats_query = select(
            func.count(User.id).label('total'),
            func.count(User.id).filter(User.last_login_at >= last_24h).label('active')
        )
        user_stats_result = (await self.db.execute(user_stats_query)).one()
        total_users = user_stats_result.total or 0
        active_users = user_stats_result.active or 0

        # 2. Content Stats
        # These are count(*) on different tables, difficult to join efficiently without cross join
        # Keeping separate is fine, but we can potentially asyncio.gather them if supported, 
        # but for now, simple counts are fast. Let's keep them for clarity or minimal optimization.
        total_resumes = (await self.db.execute(select(func.count(UserResume.id)))).scalar() or 0
        total_apps = (await self.db.execute(select(func.count(JobApplication.id)))).scalar() or 0
        total_output = total_resumes + total_apps
        
        total_jobs = (await self.db.execute(select(func.count(Job.id)))).scalar() or 0

        # 3. System Logs Aggregation (The Heavy Lifter)
        # Combine: Avg Gen Time, Success Rate input (total/success count), Avg API Latency
        
        # Define filters
        gen_action_filter = SystemLog.action.in_(['generate_cover_letter', 'parse_resume', 'generate_resume'])
        api_action_filter = or_(SystemLog.action.ilike('external_%'), SystemLog.action.ilike('api_%'))
        
        logs_query = select(
            # Avg Generation Time
            func.avg(SystemLog.duration_ms).filter(
                gen_action_filter, 
                SystemLog.duration_ms.isnot(None)
            ).label('avg_gen_time'),
            
            # Total Logs (for success rate)
            func.count(SystemLog.id).label('total_logs'),
            
            # Success Logs (for success rate)
            func.count(SystemLog.id).filter(SystemLog.status == 'success').label('success_logs'),
            
            # Avg API Latency
            func.avg(SystemLog.duration_ms).filter(
                api_action_filter,
                SystemLog.duration_ms.isnot(None)
            ).label('avg_latency')
        )
        
        logs_stats = (await self.db.execute(logs_query)).one()
        
        # Process Log Stats
        avg_gen_time_ms = logs_stats.avg_gen_time or 0
        avg_gen_time_sec = round(avg_gen_time_ms / 1000.0, 2)
        
        total_log_count = logs_stats.total_logs or 0
        success_log_count = logs_stats.success_logs or 0
        success_rate = 100.0
        if total_log_count > 0:
            success_rate = round((success_log_count / total_log_count) * 100, 2)
            
        avg_latency_ms = round(logs_stats.avg_latency, 2) if logs_stats.avg_latency else 0

        # 4. Alerts & Errors (Combined)
        # Fetch verified errors count AND recent alerts in optimized flow? 
        # Actually separate is cleaner for Limit vs Count.
        
        # System Errors (24h)
        errors_query = select(func.count(SystemAlert.id)).where(
            text("severity IN ('critical', 'fatal')"),
            SystemAlert.created_at >= last_24h
        )
        system_errors_24h = (await self.db.execute(errors_query)).scalar() or 0

        # Recent Alerts
        recent_alerts_query = select(SystemAlert).order_by(desc(SystemAlert.created_at)).limit(5)
        recent_alerts = (await self.db.execute(recent_alerts_query)).scalars().all()
        
        # Format alerts
        formatted_alerts = []
        for alert in recent_alerts:
            time_diff = now - alert.created_at
            time_str = "just now"
            total_seconds = time_diff.total_seconds()
            
            if total_seconds > 86400:
                days = int(total_seconds / 86400)
                time_str = f"{days}d ago"
            elif total_seconds > 3600:
                hours = int(total_seconds / 3600)
                time_str = f"{hours}h ago"
            elif total_seconds > 60:
                mins = int(total_seconds / 60)
                time_str = f"{mins}m ago"
                
            formatted_alerts.append({
                "id": str(alert.id),
                "message": alert.title or alert.message,
                "type": alert.severity.value if hasattr(alert.severity, 'value') else str(alert.severity),
                "time": time_str
            })

        return {
            "total_users": total_users,
            "active_users_24h": active_users,
            "total_resumes_generated": total_output,
            "jobs_analyzed": total_jobs,
            "avg_generation_time_seconds": avg_gen_time_sec,
            "success_rate_percent": success_rate,
            "avg_api_latency_ms": avg_latency_ms,
            "system_errors_24h": system_errors_24h,
            "recent_alerts": formatted_alerts
        }

    async def get_audit_logs(
        self, 
        limit: int = 50, 
        offset: int = 0, 
        action: str = None, 
        status: str = None,
        user_id: str = None
    ) -> Dict[str, Any]:
        """
        Fetch paginated audit logs with optional filters.
        Joins with User to get email.
        """
        # Query with manual join since no relationship defined
        stmt = select(SystemLog, User.email).outerjoin(
            User, SystemLog.user_id == User.id
        ).order_by(desc(SystemLog.created_at))

        # Filters
        if action:
            stmt = stmt.where(SystemLog.action.ilike(f"%{action}%"))
        if status:
            stmt = stmt.where(SystemLog.status == status)
        if user_id:
            try:
                # Validate UUID
                from uuid import UUID
                uid = UUID(user_id)
                stmt = stmt.where(SystemLog.user_id == uid)
            except ValueError:
                pass # Ignore invalid UUID
        
        # Pagination
        stmt = stmt.limit(limit).offset(offset)
        
        result = await self.db.execute(stmt)
        rows = result.all()
        
        logs = []
        for row in rows:
            log, email = row
            # Convert to dict or schema
            logs.append({
                "id": log.id,
                "action": log.action,
                "status": log.status,
                "user_id": log.user_id,
                "user_email": email,
                "ip_address": log.ip_address,
                "duration_ms": log.duration_ms,
                "resource_id": log.resource_id,
                "details": log.details,
                "created_at": log.created_at
            })
            
        return logs
