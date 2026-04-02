/**
 * Frontend API cache and request deduplication service.
 * Reduces redundant API calls and improves perceived performance.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  promise?: Promise<T>;
}

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private defaultTTL: number = 30000; // 30 seconds
  
  // TTL configurations by endpoint pattern
  private ttlConfig: Record<string, number> = {
    '/wallet': 15000,           // 15 seconds
    '/games/open': 10000,       // 10 seconds
    '/games/mine': 10000,       // 10 seconds
    '/admin/overview': 30000,   // 30 seconds
    '/admin/stats': 60000,      // 1 minute
    '/admin/users': 30000,      // 30 seconds
    '/admin/games': 30000,      // 30 seconds
    '/tournaments': 15000,      // 15 seconds
  };

  /**
   * Get TTL for a specific endpoint
   */
  private getTTL(endpoint: string): number {
    for (const [pattern, ttl] of Object.entries(this.ttlConfig)) {
      if (endpoint.includes(pattern)) {
        return ttl;
      }
    }
    return this.defaultTTL;
  }

  /**
   * Generate cache key from endpoint and params
   */
  private generateKey(endpoint: string, params?: Record<string, any>): string {
    const paramStr = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
    return `${endpoint}:${paramStr}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get data from cache
   */
  get<T>(endpoint: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(endpoint, params);
    const entry = this.cache.get(key);
    
    if (entry && this.isValid(entry)) {
      console.log(`[Cache] HIT: ${endpoint}`);
      return entry.data as T;
    }
    
    if (entry) {
      // Expired - remove it
      this.cache.delete(key);
    }
    
    console.log(`[Cache] MISS: ${endpoint}`);
    return null;
  }

  /**
   * Set data in cache
   */
  set<T>(endpoint: string, data: T, params?: Record<string, any>, customTTL?: number): void {
    const key = this.generateKey(endpoint, params);
    const ttl = customTTL || this.getTTL(endpoint);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    console.log(`[Cache] SET: ${endpoint} (TTL: ${ttl}ms)`);
  }

  /**
   * Check if there's a pending request for this endpoint
   */
  getPendingRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> | null {
    const key = this.generateKey(endpoint, params);
    const pending = this.pendingRequests.get(key);
    
    if (pending && Date.now() - pending.timestamp < 5000) {
      console.log(`[Dedup] Reusing pending request: ${endpoint}`);
      return pending.promise as Promise<T>;
    }
    
    return null;
  }

  /**
   * Register a pending request
   */
  setPendingRequest<T>(endpoint: string, promise: Promise<T>, params?: Record<string, any>): void {
    const key = this.generateKey(endpoint, params);
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });
    
    // Clean up after promise resolves/rejects
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidate(pattern: string): void {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`[Cache] Invalidated ${count} entries matching: ${pattern}`);
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAll(): void {
    const count = this.cache.size;
    this.cache.clear();
    console.log(`[Cache] Invalidated all ${count} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    let cleaned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
    }
  }
}

// Singleton instance
export const apiCache = new APICache();

// Auto-cleanup every minute
setInterval(() => apiCache.cleanup(), 60000);

/**
 * Wrapper for API calls with caching and deduplication
 */
export async function cachedFetch<T>(
  endpoint: string,
  fetcher: () => Promise<T>,
  options: {
    params?: Record<string, any>;
    ttl?: number;
    forceRefresh?: boolean;
    deduplicate?: boolean;
  } = {}
): Promise<T> {
  const { params, ttl, forceRefresh = false, deduplicate = true } = options;

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = apiCache.get<T>(endpoint, params);
    if (cached !== null) {
      return cached;
    }
  }

  // Check for pending request (deduplication)
  if (deduplicate) {
    const pending = apiCache.getPendingRequest<T>(endpoint, params);
    if (pending) {
      return pending;
    }
  }

  // Make the request
  const promise = fetcher();
  
  // Register as pending
  if (deduplicate) {
    apiCache.setPendingRequest(endpoint, promise, params);
  }

  try {
    const result = await promise;
    
    // Cache the result
    apiCache.set(endpoint, result, params, ttl);
    
    return result;
  } catch (error) {
    // Don't cache errors
    throw error;
  }
}

/**
 * Hook to invalidate cache when mutations occur
 */
export function invalidateCache(patterns: string | string[]): void {
  const patternList = Array.isArray(patterns) ? patterns : [patterns];
  patternList.forEach(pattern => apiCache.invalidate(pattern));
}