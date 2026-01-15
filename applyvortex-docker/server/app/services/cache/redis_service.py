import json
import logging
from typing import Optional, Any, Callable
from functools import wraps
import hashlib

import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisService, cls).__new__(cls)
            cls._instance.redis_client = None
        return cls._instance

    async def initialize(self) -> None:
        """Initialize Redis connection pool."""
        if not self.redis_client:
            logger.info(f"🔌 Connecting to Redis at {settings.REDIS_URL}...")
            self.redis_client = redis.from_url(
                settings.REDIS_URL, 
                encoding="utf-8", 
                decode_responses=True
            )
            # Test connection
            try:
                await self.redis_client.ping()
                logger.info("✅ Redis connected successfully")
            except Exception as e:
                logger.error(f"❌ Failed to connect to Redis: {e}")
                self.redis_client = None

    async def close(self) -> None:
        """Close Redis connection."""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("🛑 Redis connection closed")

    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis."""
        if not self.redis_client:
            return None
        try:
            value = await self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return None

    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> bool:
        """Set value in Redis with TTL."""
        if not self.redis_client:
            return False
        try:
            # Handle Pydantic models
            if hasattr(value, 'model_dump'):
                value = value.model_dump(mode='json')
                
            serialized_value = json.dumps(value, default=str)
            await self.redis_client.set(key, serialized_value, ex=ttl_seconds)
            return True
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            return False
            
    async def delete(self, key: str) -> bool:
        """Delete key from Redis."""
        if not self.redis_client:
            return False
        try:
            await self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis DELETE error for key {key}: {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        if not self.redis_client:
            return 0
        try:
            keys = []
            cursor = "0"
            while cursor != 0:
                cursor, batch = await self.redis_client.scan(cursor=cursor, match=pattern, count=100)
                keys.extend(batch)
            
            if keys:
                return await self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Redis DELETE PATTERN error for {pattern}: {e}")
            return 0

# Singleton instance
redis_service = RedisService()


def cached(
    ttl_seconds: int = 60, 
    key_builder: Optional[Callable] = None,
    response_model: Any = None
):
    """
    Decorator to cache async function results in Redis.
    
    :param ttl_seconds: Time to live in seconds
    :param key_builder: Optional function to generate custom cache key. 
                        Signature: (func, *args, **kwargs) -> str
    :param response_model: Pydantic model to unmarshall cached data into
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 1. Generate Cache Key
            if key_builder:
                cache_key = key_builder(func, *args, **kwargs)
            else:
                # Default key: module:class:func:args_hash
                # Try to extract 'self' or 'cls' to handle methods
                clean_args = []
                for arg in args:
                    # Skip 'self' or 'cls' in key generation to avoid issues with unhashable objects
                    # This is a naive check; might need refinement for complex objects
                    if hasattr(arg, '__dict__') or str(arg).startswith('<'):
                         continue
                    clean_args.append(str(arg))
                
                key_part = f"{func.__module__}:{func.__name__}:{clean_args}:{kwargs}"
                key_hash = hashlib.md5(key_part.encode()).hexdigest()
                cache_key = f"cache:{func.__name__}:{key_hash}"

            # 2. Try Cache
            cached_value = await redis_service.get(cache_key)
            if cached_value is not None:
                logger.info(f"⚡ Served from Cache: {cache_key}")
                if response_model and hasattr(response_model, 'model_validate'):
                    try:
                        return response_model.model_validate(cached_value)
                    except Exception as e:
                        logger.error(f"Cache deserialization failed for {cache_key}: {e}")
                        # If validation fails, fallback to fresh fetch
                        pass
                else:
                    return cached_value

            # 3. Call Function
            result = await func(*args, **kwargs)

            # 4. Cache Result
            # Only cache if result is not None (optional decision)
            if result is not None:
                await redis_service.set(cache_key, result, ttl_seconds)
            
            return result
        return wrapper
    return decorator
