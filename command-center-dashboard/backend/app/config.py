import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Command Center Dashboard"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://dashboard.commandcenter.io"
    ]
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://dashboard_user:dashboard_pass@localhost/dashboard_db"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_EXPIRE_TIME: int = 3600  # 1 hour
    
    # WebSocket
    WEBSOCKET_PORT: int = 8001
    
    # External APIs
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    GITHUB_TOKEN: str = ""
    
    # Monitoring
    METRICS_COLLECTION_INTERVAL: int = 30  # seconds
    HEALTH_CHECK_INTERVAL: int = 60  # seconds
    
    # Security Headers
    SECURITY_HEADERS: dict = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    }
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 1000
    RATE_LIMIT_BURST: int = 100
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()


# Derived settings
class DatabaseConfig:
    def __init__(self):
        self.url = settings.DATABASE_URL
        self.pool_size = settings.DATABASE_POOL_SIZE
        self.max_overflow = settings.DATABASE_MAX_OVERFLOW
        
    @property
    def sync_url(self) -> str:
        """Get synchronous database URL for migrations"""
        return self.url.replace("postgresql+asyncpg://", "postgresql://")


class RedisConfig:
    def __init__(self):
        self.url = settings.REDIS_URL
        self.expire_time = settings.REDIS_EXPIRE_TIME
        
    @property
    def connection_params(self) -> dict:
        """Redis connection parameters"""
        return {
            "url": self.url,
            "decode_responses": True,
            "socket_connect_timeout": 5,
            "socket_timeout": 5,
            "retry_on_timeout": True,
            "health_check_interval": 30,
        }


# Configuration instances
db_config = DatabaseConfig()
redis_config = RedisConfig()