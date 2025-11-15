"""
Application configuration
"""
from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path

# Get the base directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Application settings"""
    
    # App
    APP_NAME: str = "Cricket Alert API"
    VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # Paths
    BASE_DIR: Path = BASE_DIR
    PROMPTS_DIR: Path = BASE_DIR / "prompts"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "*"  # Allow all origins in development
    ]
    
    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Monitoring
    DEFAULT_POLL_INTERVAL: int = 60  # seconds
    MIN_POLL_INTERVAL: int = 10
    MAX_POLL_INTERVAL: int = 300
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
