import os
from dotenv import load_dotenv
from pydantic import BaseModel

from pathlib import Path

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings(BaseModel):
    SERVER_URL: str = os.getenv("SERVER_URL", "http://localhost:8000")
    WEB_URL: str = os.getenv("WEB_URL", "http://localhost:3000")  # The frontend/proxy URL
    API_URL: str = os.getenv("API_URL", f"{os.getenv('SERVER_URL', 'http://localhost:8000')}/api/v1")
    API_KEY: str = os.getenv("API_KEY", "")
    EMAIL: str = os.getenv("AGENT_EMAIL", "")
    PASSWORD: str = os.getenv("AGENT_PASSWORD", "")
    HEADLESS: bool = os.getenv("HEADLESS", "true").lower() == "true"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    POLL_INTERVAL: int = int(os.getenv("POLL_INTERVAL", "30"))
    
    # AI Configuration (Local/Ollama)
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "ollama")
    AI_BASE_URL: str = os.getenv("AI_BASE_URL", "http://localhost:11434/v1")
    AI_MODEL: str = os.getenv("AI_MODEL", "qwen2.5:7b")
    AI_TIMEOUT: int = int(os.getenv("AI_TIMEOUT", "300"))

settings = Settings()

print(f"--- Agent Configuration ---")
print(f"Server URL: {settings.SERVER_URL}")
print(f"API Key: {settings.API_KEY[:10]}... (Len: {len(settings.API_KEY)})")
print(f"Debug: {settings.DEBUG}")
print(f"---------------------------")
