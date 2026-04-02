"""
Intelligent caching layer with TTL and invalidation support.
Reduces database load by caching frequently accessed data.
"""
import time
import threading
import hashlib
import json
from functools import wraps
from flask import request, jsonify
import logging

logger = logging.getLogger(__name__)

class CacheEntry:
    """Cache entry with TTL support"""
    
    def __init__(self, value, ttl=300):
        self.value = value
        self.created_at = time.time()
        self.ttl = ttl
        self.access_count = 0
        self.last_accessed = time.time()
    
    def is_valid(self):
        """Check if cache entry is still valid"""
        return time.time() - self.created_at < self.ttl
    
    def access(self):
        """Mark entry as accessed"""
        self.access_count += 1
        self.last_accessed = time.time()
        return self.value

class QueryCache:
    """
    Thread-safe query cache with intelligent invalidation.
    Caches database query results to reduce load.
    """
    
    def __init__(self, default_ttl=300, max_size=1000):
        self.cache = {}
        self.default_ttl = default_ttl
        self.max_size = max_size
        self.lock = threading.Lock()
        self.hits = 0
        self.misses = 0
        
        # TTL configurations by data type
        self.ttl_config = {
            'user_balance': 30,      # 30 seconds - changes frequently
            'user_profile': 300,     # 5 minutes
            'game_list': 15,         # 15 seconds - changes often
            'game_details': 30,      # 30 seconds
            'tournament_list': 60,   # 1 minute
            'admin_stats': 120,      # 2 minutes
            'wallet_transactions': 30, # 30 seconds
            'static_data': 3600,     # 1 hour
        }
    
    def _generate_key(self, *args, **kwargs):
        """Generate cache key from arguments"""
        key_data = {
            'args': args,
            'kwargs': sorted(kwargs.items()) if kwargs else {}
        }
        key_str = json.dumps(key_data, sort_keys=True, default=str)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, key):
        """Get value from cache"""
        with self.lock:
            if key in self.cache:
                entry = self.cache[key]
                if entry.is_valid():
                    self.hits += 1
                    return entry.access()
                else:
                    # Expired - remove it
                    del self.cache[key]
            
            self.misses += 1
            return None
    
    def set(self, key, value, ttl=None):
        """Set value in cache"""
        with self.lock:
            # Evict if at capacity
            if len(self.cache) >= self.max_size:
                self._evict_oldest()
            
            self.cache[key] = CacheEntry(value, ttl or self.default_ttl)
    
    def invalidate(self, pattern=None, key=None):
        """Invalidate cache entries"""
        with self.lock:
            if key:
                self.cache.pop(key, None)
            elif pattern:
                # Invalidate all keys matching pattern
                keys_to_remove = [k for k in self.cache.keys() if pattern in k]
                for k in keys_to_remove:
                    del self.cache[k]
    
    def invalidate_user(self, user_id):
        """Invalidate all cache entries for a user"""
        self.invalidate(pattern=f'user_{user_id}')
    
    def invalidate_game(self, game_id=None):
        """Invalidate game-related cache"""
        if game_id:
            self.invalidate(pattern=f'game_{game_id}')
        self.invalidate(pattern='games')
    
    def _evict_oldest(self):
        """Evict oldest/least accessed entries"""
        if not self.cache:
            return
        
        # Sort by last accessed time
        sorted_keys = sorted(
            self.cache.keys(),
            key=lambda k: self.cache[k].last_accessed
        )
        
        # Remove oldest 10%
        evict_count = max(1, len(sorted_keys) // 10)
        for key in sorted_keys[:evict_count]:
            del self.cache[key]
    
    def get_stats(self):
        """Get cache statistics"""
        with self.lock:
            total = self.hits + self.misses
            hit_rate = (self.hits / total * 100) if total > 0 else 0
            
            return {
                'size': len(self.cache),
                'max_size': self.max_size,
                'hits': self.hits,
                'misses': self.misses,
                'hit_rate': round(hit_rate, 2),
                'entries': [
                    {
                        'age': round(time.time() - e.created_at, 1),
                        'access_count': e.access_count,
                        'valid': e.is_valid()
                    }
                    for e in list(self.cache.values())[:10]
                ]
            }

# Global cache instance
query_cache = QueryCache()

def cached(ttl=None, cache_type=None, key_prefix='', invalidate_on=None):
    """
    Decorator to cache function results.
    
    Args:
        ttl: Time to live in seconds
        cache_type: Type of data (for TTL lookup)
        key_prefix: Prefix for cache key
        invalidate_on: List of params that should trigger invalidation
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Determine TTL
            actual_ttl = ttl
            if cache_type and cache_type in query_cache.ttl_config:
                actual_ttl = query_cache.ttl_config[cache_type]
            elif not actual_ttl:
                actual_ttl = query_cache.default_ttl
            
            # Generate cache key
            cache_key = f"{key_prefix}:{query_cache._generate_key(*args, **kwargs)}"
            
            # Try to get from cache
            cached_value = query_cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Execute function and cache result
            result = f(*args, **kwargs)
            query_cache.set(cache_key, result, actual_ttl)
            
            return result
        return decorated_function
    return decorator

def cache_response(ttl=60, cache_type=None):
    """Decorator to cache entire HTTP responses"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Generate cache key from request
            cache_key = f"response:{request.method}:{request.path}:{request.query_string.decode()}"
            
            # Try cache
            cached = query_cache.get(cache_key)
            if cached is not None:
                response = jsonify(cached)
                response.headers['X-Cache'] = 'HIT'
                return response
            
            # Execute and cache
            result = f(*args, **kwargs)
            
            # Only cache successful responses
            if isinstance(result, tuple):
                data, status_code = result
                if status_code == 200:
                    query_cache.set(cache_key, data, ttl)
                response = jsonify(data)
                response.status_code = status_code
            else:
                query_cache.set(cache_key, result, ttl)
                response = jsonify(result)
            
            response.headers['X-Cache'] = 'MISS'
            return response
        return decorated_function
    return decorator