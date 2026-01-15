"""
Agent Monitoring Background Tasks
Celery tasks for agent health monitoring and offline detection.
"""
from celery import shared_task
from datetime import datetime, timedelta
from sqlalchemy import select
from app.core.database import get_session
from app.models.agent import Agent
import logging

logger = logging.getLogger(__name__)


@shared_task(name="check_offline_agents")
def check_offline_agents():
    """
    Mark agents as offline if no heartbeat received for 2 minutes.
    Runs every 2 minutes via Celery Beat.
    
    Returns:
        Number of agents marked offline
    """
    try:
        # Get database session
        session_gen = get_session()
        db = next(session_gen)
        
        threshold = datetime.utcnow() - timedelta(minutes=2)
        
        # Find agents that are online but haven't sent heartbeat
        stmt = select(Agent).where(
            Agent.status == "online",
            Agent.last_heartbeat < threshold
        )
        
        stale_agents = db.execute(stmt).scalars().all()
        
        count = 0
        for agent in stale_agents:
            logger.info(f"Marking agent {agent.name} ({agent.agent_id[:8]}...) as offline")
            agent.status = "offline"
            count += 1
            
            # TODO: Send notification to user
            # notify_user_agent_offline(agent.user_id, agent.name)
        
        db.commit()
        
        logger.info(f"Offline detection complete: {count} agents marked offline")
        return count
        
    except Exception as e:
        logger.error(f"Error in offline detection task: {e}")
        return 0
    finally:
        try:
            next(session_gen)
        except StopIteration:
            pass


@shared_task(name="reset_rate_limits")
def reset_rate_limits():
    """
    Reset hourly rate limit counters for all agents.
    Runs every hour via Celery Beat.
    
    Returns:
        Number of agents reset
    """
    try:
        session_gen = get_session()
        db = next(session_gen)
        
        now = datetime.utcnow()
        
        # Find agents whose rate limit period has expired
        stmt = select(Agent).where(
            Agent.rate_limit_reset_at <= now
        )
        
        agents = db.execute(stmt).scalars().all()
        
        count = 0
        for agent in agents:
            agent.tasks_this_hour = 0
            agent.rate_limit_reset_at = now + timedelta(hours=1)
            count += 1
        
        db.commit()
        
        logger.info(f"Rate limit reset complete: {count} agents reset")
        return count
        
    except Exception as e:
        logger.error(f"Error in rate limit reset task: {e}")
        return 0
    finally:
        try:
            next(session_gen)
        except StopIteration:
            pass
