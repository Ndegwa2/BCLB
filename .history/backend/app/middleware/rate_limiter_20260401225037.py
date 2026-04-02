"""
Rate limiting and request throttling middleware with priority support.
Manages request queues to prevent system overload.
"""
import time
import threading
from functools import wraps
from flask import request, jsonify, g
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class RequestPriority:
    """Request priority levels"""
    CRITICAL = 0    # Auth, payments, game state changes
    HIGH = 1        # User actions, wallet operations
    NORMAL = 2      # General API calls
    LOW = 3         # Admin stats, reports, background tasks

class RateLimiter:
    """
    Token bucket rate limiter with priority-based throttling.
    Prevents system overload by managing request throughput.
    """
    
    def __init__(self):
        self.buckets = defaultdict(lambda: {
            'tokens': 100,
            'last_update': time.time(),
            'request_count': 0,
            'blocked_until': 0
        })
        self.lock = threading.Lock()
        
        # Rate limit configurations per priority
        self.limits = {
            RequestPriority.CRITICAL: {
                'rate': 50,      # tokens per second
                'burst': 100,    # max burst
                'window': 60     # tracking window
            },
            RequestPriority.HIGH: {
                'rate': 30,
                'burst': 60,
                'window': 60
            },
            RequestPriority.NORMAL: {
                'rate': 20,
                'burst': 40,
                'window': 60
            },
            RequestPriority.LOW: {
                'rate': 10,
                'burst': 20,
                'window': 60
            }
        }
        
        # Global rate limiting
        self.global_requests = []
        self.global_lock = threading.Lock()
        self.max_requests_per_second = 100
        
    def _get_client_key(self):
        """Get unique client identifier"""
        auth_header = request.headers.get('Authorization')
        if auth_header:
            # Authenticated user - use token hash
            return f"user:{hash(auth_header) % 10000}"
        # Anonymous - use IP
        return f"ip:{request.remote_addr}"
    
    def _refill_tokens(self, bucket, priority):
        """Refill tokens based on elapsed time"""
        now = time.time()
        elapsed = now - bucket['last_update']
        rate = self.limits[priority]['rate']
        burst = self.limits[priority]['burst']
        
        bucket['tokens'] = min(burst, bucket['tokens'] + elapsed * rate)
        bucket['last_update'] = now
    
    def _check_global_limit(self):
        """Check global request rate"""
        with self.global_lock:
            now = time.time()
            # Remove old entries
            self.global_requests = [t for t in self.global_requests if now - t < 1.0]
            
            if len(self.global_requests) >= self.max_requests_per_second:
                return False
            
            self.global_requests.append(now)
            return True
    
    def check_rate_limit(self, priority=RequestPriority.NORMAL):
        """
        Check if request should be allowed based on rate limits.
        Returns (allowed, retry_after) tuple.
        """
        # Check global limit first
        if not self._check_global_limit():
            return False, 0.5
        
        client_key = self._get_client_key()
        
        with self.lock:
            bucket = self.buckets[client_key]
            
            # Check if client is blocked
            if bucket['blocked_until'] > time.time():
                retry_after = bucket['blocked_until'] - time.time()
                return False, retry_after
            
            # Refill tokens
            self._refill_tokens(bucket, priority)
            
            # Check if tokens available
            if bucket['tokens'] >= 1:
                bucket['tokens'] -= 1
                bucket['request_count'] += 1
                return True, 0
            
            # No tokens - calculate retry time
            rate = self.limits[priority]['rate']
            retry_after = 1.0 / rate if rate > 0 else 1.0
            return False, retry_after
    
    def block_client(self, client_key, duration=60):
        """Temporarily block a client"""
        with self.lock:
            self.buckets[client_key]['blocked_until'] = time.time() + duration
            logger.warning(f"Blocked client {client_key} for {duration}s")
    
    def get_stats(self):
        """Get rate limiter statistics"""
        with self.lock:
            return {
                'active_clients': len(self.buckets),
                'global_rps': len(self.global_requests),
                'buckets': {
                    k: {
                        'tokens': v['tokens'],
                        'request_count': v['request_count'],
                        'blocked': v['blocked_until'] > time.time()
                    }
                    for k, v in list(self.buckets.items())[:10]
                }
            }

# Global rate limiter instance
rate_limiter = RateLimiter()

def get_request_priority():
    """Determine request priority based on endpoint"""
    path = request.path
    method = request.method
    
    # Critical: Auth, payments, game state
    if '/auth/' in path or '/payments/' in path:
        return RequestPriority.CRITICAL
    
    if method in ['POST', 'PUT', 'DELETE']:
        if '/games/' in path and ('join' in path or 'start' in path):
            return RequestPriority.CRITICAL
        if '/wallet/' in path:
            return RequestPriority.HIGH
        return RequestPriority.HIGH
    
    # Low: Admin stats, reports
    if '/admin/' in path and ('stats' in path or 'overview' in path):
        return RequestPriority.LOW
    
    # Normal: Everything else
    return RequestPriority.NORMAL

def rate_limit(f):
    """Decorator to apply rate limiting to routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        priority = get_request_priority()
        allowed, retry_after = rate_limiter.check_rate_limit(priority)
        
        if not allowed:
            response = jsonify({
                'error': 'Rate limit exceeded',
                'retry_after': round(retry_after, 2)
            })
            response.status_code = 429
            response.headers['Retry-After'] = str(round(retry_after, 2))
            response.headers['X-RateLimit-Priority'] = str(priority)
            return response
        
        # Add priority info to response headers
        g.request_priority = priority
        return f(*args, **kwargs)
    
    return decorated_function