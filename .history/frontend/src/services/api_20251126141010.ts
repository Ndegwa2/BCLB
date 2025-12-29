import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

// API client configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

class ApiClient {
  private client: AxiosInstance

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
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
        }

        if (error.response?.status && error.response.status >= 500) {
          // Server error
          console.error('Server error:', error)
        }

        return Promise.reject(error)
      }
    )
  }

  public get(url: string, config = {}) {
    return this.client.get(url, config)
  }

  public post(url: string, data?: any, config = {}) {
    return this.client.post(url, data, config)
  }

  public put(url: string, data?: any, config = {}) {
    return this.client.put(url, data, config)
  }

  public delete(url: string, config = {}) {
    return this.client.delete(url, config)
  }

  public patch(url: string, data?: any, config = {}) {
    return this.client.patch(url, data, config)
  }
}

export const apiClient = new ApiClient()