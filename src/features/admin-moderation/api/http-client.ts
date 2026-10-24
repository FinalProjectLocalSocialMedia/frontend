import axios, { type InternalAxiosRequestConfig } from 'axios'
import { createHttpClient } from '@/lib/http-client'
import { authEvents } from '../auth/auth-events'
import {
  clearStoredSession,
  getAccessToken,
  getRefreshToken,
  readStoredSession,
  updateAccessToken,
} from '../auth/session-storage'

/**
 * Địa chỉ API của user-service xử lý xác thực (login, refresh, logout).
 * - Trực tiếp: http://localhost:8081/api/v1
 * - Hoặc qua Gateway: http://localhost:8080/user
 */
export const AUTH_API_BASE_URL =
  import.meta.env.VITE_AUTH_API_BASE_URL ?? 'http://localhost:8081/api/v1'

/**
 * Instance axios dùng chung cho mọi module `*.http.ts` của khu vực admin.
 * Chỉ các file `*.http.ts` được import `adminHttp`; component không gọi trực tiếp (quy ước 9).
 * Chế độ mock (`VITE_USE_MOCK=true`) không đi qua instance này.
 */
export const adminHttp = createHttpClient({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? ''}/admin`,
  withCredentials: true,
  timeout: 15_000,
  onUnauthorized: () => authEvents.emit('unauthorized'),
})

// Request Interceptor: Gắn Bearer Token và các Header định danh X-User-Id / X-User-Roles
adminHttp.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  const session = readStoredSession()
  if (session) {
    config.headers.set('X-User-Id', session.id)
    config.headers.set('X-User-Roles', session.role)
  }

  return config
})

// Quản lý trạng thái Refresh Token đồng thời
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token)
    } else {
      prom.reject(error)
    }
  })
  failedQueue = []
}

// Response Interceptor: Bắt lỗi 401 và tự động refresh token
adminHttp.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Nếu lỗi 401 và request chưa từng thử retry, và không phải request refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        clearStoredSession()
        authEvents.emit('unauthorized')
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.set('Authorization', `Bearer ${token}`)
            return adminHttp(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Gọi trực tiếp axios không qua interceptor để tránh lặp vô tận
        const refreshRes = await axios.post<{
          accessToken: string
          refreshToken?: string
        }>(
          `${AUTH_API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' }, timeout: 10_000 }
        )

        const newAccessToken = refreshRes.data.accessToken
        const newRefreshToken = refreshRes.data.refreshToken

        updateAccessToken(newAccessToken, newRefreshToken)
        processQueue(null, newAccessToken)

        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`)
        return adminHttp(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        clearStoredSession()
        authEvents.emit('unauthorized')
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
