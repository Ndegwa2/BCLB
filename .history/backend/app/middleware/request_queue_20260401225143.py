"""
Priority-based request queue system.
Manages request processing order based on priority levels.
"""
import heapq
import threading
import time
from collections import defaultdict
from functools import wraps
from flask import request, g, jsonify
import logging

logger = logging.getLogger(__name__)

class QueuedRequest:
    """Represents a queued request with priority"""
    
    def __init__(self, priority, timestamp, request_id, endpoint):
        self.priority = priority
        self.timestamp = timestamp
        self.request_id = request_id
        self.endpoint = endpoint
        self.processed = False
    
    def __lt__(self, other):
        # Lower priority number = higher priority
        if self.priority != other.priority:
            return self.priority < other.priority
        # Same priority - FIFO by timestamp
        return self.timestamp < other.timestamp

class RequestQueue:
    """
    Priority-based request queue with throttling.
    Ensures critical requests are processed first.
    """
    
    def __init__(self, max_concurrent=50, max_queue_size=500):
        self.queue = []
        self.lock = threading.Lock()
        self.condition = threading.Condition(self.lock)
        self.max_concurrent = max_concurrent
        self.max_queue_size = max_queue_size
        self.active_requests = 0
        self.total_processed = 0
        self.total_rejected = 0
        self.total_queued = 0
        
        # Statistics by priority
        self.priority_stats = defaultdict(lambda: {
            'processed': 0,
            'rejected': 0,
            'total_wait_time': 0
        })
        
        # Start worker threads
        self.workers = []
        self.running = True
        for i in range(4):  # 4 worker threads
            worker = threading.Thread(target=self._worker_loop, name=f"QueueWorker-{i}")
            worker.daemon = True
            worker.start()
            self.workers.append(worker)
    
    def _worker_loop(self):
        """Worker thread to process queued requests"""
        while self.running:
            with self.condition:
                # Wait for requests or shutdown
                while not self.queue and self.running:
                    self.condition.wait(timeout=1.0)
                
                if not self.running:
                    break
                
                # Check concurrent limit
                if self.active_requests >= self.max_concurrent:
                    self.condition.wait(timeout=0.1)
                    continue
                
                # Get highest priority request
                if self.queue:
                    queued_request = heapq.heappop(self.queue)
                    self.active_requests += 1
            
            # Process request (outside lock)
            if self.running and 'queued_request' in locals():
                try:
                    wait_time = time.time() - queued_request.timestamp
                    self.priority_stats[queued_request.priority]['total_wait_time'] += wait_time
                    self.priority_stats[queued_request.priority]['processed'] += 1
                    self.total_processed += 1
                    
                    logger.debug(
                        f"Processing request {queued_request.request_id} "
                        f"(priority={queued_request.priority}, wait={wait_time:.3f}s)"
                    )
                finally:
                    with self.lock:
                        self.active_requests -= 1
                        self.condition.notify_all()
    
    def enqueue(self, priority, endpoint=None):
        """
        Add request to queue.
        Returns (allowed, position) tuple.
        """
        with self.lock:
            # Check queue capacity
            if len(self.queue) >= self.max_queue_size:
                self.total_rejected += 1
                self.priority_stats[priority]['rejected'] += 1
                return False, -1
            
            # Add to queue
            request_id = f"{endpoint}:{time.time()}"
            queued_request = QueuedRequest(
                priority=priority,
                timestamp=time.time(),
                request_id=request_id,
                endpoint=endpoint or request.path
            )
            
            heapq.heappush(self.queue, queued_request)
            self.total_queued += 1
            position = len(self.queue)
            
            # Notify workers
            self.condition.notify()
            
            return True, position
    
    def get_stats(self):
        """Get queue statistics"""
        with self.lock:
            return {
                'queue_size': len(self.queue),
                'active_requests': self.active_requests,
                'max_concurrent': self.max_concurrent,
                'total_processed': self.total_processed,
                'total_rejected': self.total_rejected,
                'total_queued': self.total_queued,
                'priority_stats': dict(self.priority_stats),
                'workers': len(self.workers)
            }
    
    def shutdown(self):
        """Shutdown queue workers"""
        self.running = False
        with self.condition:
            self.condition.notify_all()

# Global request queue
request_queue = RequestQueue()

def queued(priority=2):
    """
    Decorator to queue requests with priority.
    Lower priority number = higher priority (processed first).
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check if we should queue
            if request_queue.active_requests >= request_queue.max_concurrent:
                allowed, position = request_queue.enqueue(priority, request.path)
                
                if not allowed:
                    return jsonify({
                        'error': 'Server overloaded',
                        'message': 'Too many requests, please try again later'
                    }), 503
                
                # Request is queued - will be processed by worker
                # For now, we process immediately but track queue position
                g.queue_position = position
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator