import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { apiCache, cachedFetch, invalidateCache } from './apiCache'

// Extend Axios config type to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number
    }
  }
}

// API client configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api'

class ApiClient {
  private client: AxiosInstance
  private requestCount: number = 0
  private cacheHits: number = 0

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Add request timing
        config.metadata = { startTime: Date.now() }
        
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle errors and timing
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log slow requests
        if (response.config.metadata?.startTime) {
          const duration = Date.now() - response.config.metadata.startTime
          if (duration > 1000) {
            console.warn(`[API] Slow request: ${response.config.url} took ${duration}ms`)
          }
        }
        
        return response
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
        }

        if (error.response?.status === 429) {
          // Rate limited - extract retry after
          const retryAfter = error.response.headers['retry-after']
          console.warn(`[API] Rate limited. Retry after: ${retryAfter}s`)
        }

        if (error.response?.status && error.response.status >= 500) {
          // Server error
          console.error('Server error:', error)
        }

        return Promise.reject(error)
      }
    )
  }

  public async get(url: string, config: any = {}) {
    this.requestCount++
    
    // Use cache for GET requests unless explicitly disabled
    if (config.useCache !== false) {
      return cachedFetch(
        url,
        async () => {
          const response = await this.client.get(url, config)
          return response.data
        },
        {
          params: config.params,
          ttl: config.cacheTTL,
          forceRefresh: config.forceRefresh,
          deduplicate: config.deduplicate !== false
        }
      )
    }
    
    const response = await this.client.get(url, config)
    return response.data
  }

  public async post(url: string, data?: any, config: any = {}) {
    this.requestCount++
    
    const response = await this.client.post(url, data, config)
    
    // Invalidate related cache entries on mutations
    if (config.invalidateCache !== false) {
      this.invalidateRelatedCache(url)
    }
    
    return response.data
  }

  public async put(url: string, data?: any, config: any = {}) {
    this.requestCount++
    
    const response = await this.client.put(url, data, config)
    
    // Invalidate related cache entries on mutations
    if (config.invalidateCache !== false) {
      this.invalidateRelatedCache(url)
    }
    
    return response.data
  }

  public async delete(url: string, config: any = {}) {
    this.requestCount++
    
    const response = await this.client.delete(url, config)
    
    // Invalidate related cache entries on mutations
    if (config.invalidateCache !== false) {
      this.invalidateRelatedCache(url)
    }
    
    return response.data
  }

  public async patch(url: string, data?: any, config: any = {}) {
    this.requestCount++
    
    const response = await this.client.patch(url, data, config)
    
    // Invalidate related cache entries on mutations
    if (config.invalidateCache !== false) {
      this.invalidateRelatedCache(url)
    }
    
    return response.data
  }

  /**
   * Invalidate cache entries related to a URL
   */
  private invalidateRelatedCache(url: string): void {
    // Determine what to invalidate based on the URL
    if (url.includes('/wallet')) {
      invalidateCache('/wallet')
    }
    if (url.includes('/games')) {
      invalidateCache('/games')
    }
    if (url.includes('/tournaments')) {
      invalidateCache('/tournaments')
    }
    if (url.includes('/admin')) {
      invalidateCache('/admin')
    }
  }

  /**
   * Force refresh cache for a specific endpoint
   */
  public async refresh(url: string, config: any = {}) {
    return this.get(url, { ...config, forceRefresh: true })
  }

  /**
   * Get API statistics
   */
  public getStats() {
    return {
      totalRequests: this.requestCount,
      cacheHits: this.cacheHits,
      cacheStats: apiCache.getStats()
    }
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    apiCache.invalidateAll()
  }
}

export const apiClient = new ApiClient()