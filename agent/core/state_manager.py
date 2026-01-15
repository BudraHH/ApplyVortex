"""
State Manager
Handles local persistence of agent state, including user data and session info.
Stores data in .agent_storage/ directory.
"""
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class StateManager:
    STORAGE_DIR = ".agent_storage"
    USER_DATA_FILE = "user_data.json"
    FULL_PROFILE_FILE = "full_profile.json"
    SESSION_FILE = "session.json"
    
    def __init__(self):
        self.storage_path = Path(self.STORAGE_DIR)
        self.storage_path.mkdir(exist_ok=True)
        self.user_data_path = self.storage_path / self.USER_DATA_FILE
        self.full_profile_path = self.storage_path / self.FULL_PROFILE_FILE
        self.session_path = self.storage_path / self.SESSION_FILE
        
        # In-memory cache
        self._user_data: Optional[Dict[str, Any]] = None
        self._full_profile: Optional[Dict[str, Any]] = None
        
        self.load_state()

    def load_state(self):
        """Load state from disk."""
        if self.user_data_path.exists():
            try:
                with open(self.user_data_path, 'r') as f:
                    self._user_data = json.load(f)
                logger.info("Loaded user data from cache.")
            except Exception as e:
                logger.error(f"Failed to load user data: {e}")
                self._user_data = {}

        if self.full_profile_path.exists():
            try:
                with open(self.full_profile_path, 'r') as f:
                    self._full_profile = json.load(f)
                logger.info("Loaded full profile from cache.")
            except Exception as e:
                logger.error(f"Failed to load full profile: {e}")
                self._full_profile = {}

    def save_user_data(self, data: Dict[str, Any]):
        """Save user data to disk."""
        try:
            # Add metadata
            data['_updated_at'] = datetime.now().isoformat()
            
            with open(self.user_data_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            self._user_data = data
            logger.info("Saved user data to cache.")
        except Exception as e:
            logger.error(f"Failed to save user data: {e}")

    def get_user_profile(self) -> Dict[str, Any]:
        """Get cached user profile."""
        if not self._user_data:
            return {}
        return self._user_data.get('profile', {})

    def save_full_profile(self, data: Dict[str, Any]):
        """Save full profile data to disk."""
        try:
            data['_updated_at'] = datetime.now().isoformat()
            
            with open(self.full_profile_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            self._full_profile = data
            logger.info("Saved full profile to cache.")
        except Exception as e:
            logger.error(f"Failed to save full profile: {e}")

    def get_full_profile(self) -> Dict[str, Any]:
        """Get cached full profile."""
        return self._full_profile or {}

    def get_resume_path(self) -> Optional[str]:
        """Get path to cached resume if it exists."""
        # TODO: Implement resume file caching
        return None

    def get_session_path(self) -> str:
        """Get absolute path to session persistence file."""
        return str(self.session_path.absolute())

    def clear_state(self):
        """Clear all local state."""
        try:
            if self.user_data_path.exists():
                os.remove(self.user_data_path)
            if self.session_path.exists():
                os.remove(self.session_path)
            if self.full_profile_path.exists():
                os.remove(self.full_profile_path)
            self._user_data = None
            self._full_profile = None
            logger.info("Local state cleared.")
        except Exception as e:
            logger.error(f"Failed to clear state: {e}")

# Global instance
state_manager = StateManager()
