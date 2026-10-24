import axios, { type AxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Tự động gửi & nhận HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Kích hoạt CORS preflight chống CSRF
  },
})

// Biến lưu trạng thái đang refresh để tránh gọi trùng lặp nhiều lần nếu nhiều API cùng 401
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve()
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Nếu endpoint bị 401 và không phải là các endpoint auth cơ bản (login/refresh/register)
    const isAuthEndpoint =
      originalRequest.url?.includes('/user/auth/login') ||
      originalRequest.url?.includes('/user/auth/register') ||
      originalRequest.url?.includes('/user/auth/refresh')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Trình duyệt tự động gửi cookie refreshToken và nhận cặp cookie mới
        await apiClient.post('/user/auth/refresh')
        processQueue(null)
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export type ApiClientOptions = { baseUrl?: string; fetcher?: typeof fetch }

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? API_BASE_URL
  const fetcher = options.fetcher ?? fetch
  return {
    async request<T>(path: string, init?: RequestInit): Promise<T> {
      const response = await fetcher(`${baseUrl}${path}`, {
        ...init,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...init?.headers,
        },
      })
      if (!response.ok) throw new Error(`API request failed: ${response.status}`)
      return response.json() as Promise<T>
    },
  }
}

export const api = createApiClient()
