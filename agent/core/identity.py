import json
import uuid
import platform
import os
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

IDENTITY_FILE = "agent_identity.json"

class AgentIdentity:
    def __init__(self, base_dir: str):
        self.identity_path = os.path.join(base_dir, IDENTITY_FILE)
        self.agent_id = None
        self.system_info = {}
        self._load_or_create()

    def _load_or_create(self):
        """Load identity from file or create a new one."""
        if os.path.exists(self.identity_path):
            try:
                with open(self.identity_path, 'r') as f:
                    data = json.load(f)
                    self.agent_id = data.get("agent_id")
                    logger.info(f"Loaded Identity: {self.agent_id}")
            except Exception as e:
                logger.error(f"Failed to load identity: {e}")
        
        if not self.agent_id:
            self._generate_new_identity()

        # Always refresh system info on startup (RAM/OS might change upgrades)
        self._gather_system_info()

    def _generate_new_identity(self):
        """Generate a fresh UUID and save it."""
        self.agent_id = str(uuid.uuid4())
        logger.info(f"Generated New Identity: {self.agent_id}")
        self.save()

    def _gather_system_info(self):
        """Collect static system information."""
        try:
            self.system_info = {
                "hostname": platform.node(),
                "os": platform.system(),
                "os_release": platform.release(),
                "machine": platform.machine(),
                "python_version": platform.python_version(),
                "processor": platform.processor()
            }
        except Exception as e:
            logger.warning(f"Error gathering system info: {e}")
            self.system_info = {"error": str(e)}

    def save(self):
        """Persist identity to disk."""
        try:
            data = {
                "agent_id": self.agent_id,
                "created_at": str(platform.uname()) # Just metadata
            }
            with open(self.identity_path, 'w') as f:
                json.dump(data, f, indent=2)
            logger.info("Identity saved to disk.")
        except Exception as e:
            logger.error(f"Failed to save identity: {e}")

    def get_id(self) -> str:
        return self.agent_id
    
    def get_system_info(self) -> Dict[str, Any]:
        return self.system_info
