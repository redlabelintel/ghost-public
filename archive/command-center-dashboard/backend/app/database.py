import asyncio
import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import NullPool
import redis.asyncio as redis

from app.config import settings, db_config, redis_config

logger = logging.getLogger(__name__)

# SQLAlchemy setup
Base = declarative_base()

# Create async engine
engine = create_async_engine(
    db_config.url,
    pool_size=db_config.pool_size,
    max_overflow=db_config.max_overflow,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Redis connection
redis_client = None


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_redis():
    """Get Redis client"""
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(
            redis_config.url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30,
        )
    return redis_client


async def init_database():
    """Initialize database tables"""
    try:
        async with engine.begin() as conn:
            # Import all models to ensure they're registered
            from app.models.database import (
                User, Dashboard, Widget, Metric, Alert, Project, Session
            )
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created successfully")
            
        # Test Redis connection
        redis_client = await get_redis()
        await redis_client.ping()
        logger.info("Redis connection established")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


async def close_database():
    """Close database connections"""
    try:
        await engine.dispose()
        if redis_client:
            await redis_client.close()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database: {e}")


class DatabaseManager:
    """Database connection manager"""
    
    def __init__(self):
        self.engine = engine
        self.session_factory = AsyncSessionLocal
        
    async def health_check(self) -> bool:
        """Check database health"""
        try:
            async with self.session_factory() as session:
                await session.execute("SELECT 1")
                return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    async def get_connection_stats(self) -> dict:
        """Get database connection statistics"""
        pool = self.engine.pool
        return {
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "total_connections": pool.size() + pool.overflow(),
        }


class CacheManager:
    """Redis cache manager"""
    
    def __init__(self):
        self.client = None
        
    async def get_client(self):
        """Get Redis client"""
        if self.client is None:
            self.client = await get_redis()
        return self.client
    
    async def get(self, key: str):
        """Get value from cache"""
        client = await self.get_client()
        return await client.get(key)
    
    async def set(self, key: str, value: str, expire: int = None):
        """Set value in cache"""
        client = await self.get_client()
        if expire is None:
            expire = redis_config.expire_time
        return await client.setex(key, expire, value)
    
    async def delete(self, key: str):
        """Delete key from cache"""
        client = await self.get_client()
        return await client.delete(key)
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        client = await self.get_client()
        return bool(await client.exists(key))
    
    async def health_check(self) -> bool:
        """Check Redis health"""
        try:
            client = await self.get_client()
            await client.ping()
            return True
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False
    
    async def get_stats(self) -> dict:
        """Get Redis statistics"""
        try:
            client = await self.get_client()
            info = await client.info()
            return {
                "connected_clients": info.get("connected_clients", 0),
                "used_memory_human": info.get("used_memory_human", "0B"),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "total_commands_processed": info.get("total_commands_processed", 0),
            }
        except Exception as e:
            logger.error(f"Error getting Redis stats: {e}")
            return {}


# Global instances
db_manager = DatabaseManager()
cache_manager = CacheManager()