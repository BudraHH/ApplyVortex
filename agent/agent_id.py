"""
Agent ID Management
Generates and persists unique agent identifier.
"""
import uuid
import os
import logging

logger = logging.getLogger(__name__)

AGENT_ID_FILE = ".agent_id"


def get_or_create_agent_id() -> str:
    """
    Get existing agent ID or create a new one.
    Agent ID is persisted to file to maintain identity across restarts.
    
    Returns:
        Unique agent ID (UUID)
    """
    # Check if agent ID file exists
    if os.path.exists(AGENT_ID_FILE):
        try:
            with open(AGENT_ID_FILE, 'r') as f:
                agent_id = f.read().strip()
                if agent_id:
                    logger.info(f"Using existing agent ID: {agent_id[:8]}...")
                    return agent_id
        except Exception as e:
            logger.warning(f"Failed to read agent ID file: {e}")
    
    # Generate new agent ID
    agent_id = str(uuid.uuid4())
    
    try:
        with open(AGENT_ID_FILE, 'w') as f:
            f.write(agent_id)
        logger.info(f"Generated new agent ID: {agent_id[:8]}...")
    except Exception as e:
        logger.error(f"Failed to save agent ID: {e}")
    
    return agent_id
