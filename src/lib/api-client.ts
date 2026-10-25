import axios, { type AxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '@/config/env'
import { authEvents } from '@/features/auth/lib/auth-events'

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

let lastUnauthorizedEmit = 0
const emitUnauthorized = () => {
  const now = Date.now()
  if (now - lastUnauthorizedEmit > 1500) {
    lastUnauthorizedEmit = now
    authEvents.emit('unauthorized')
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Nếu endpoint bị 401 và không phải là các endpoint auth cơ bản (login/refresh/register/me)
    const isAuthEndpoint =
      originalRequest.url?.includes('/user/auth/login') ||
      originalRequest.url?.includes('/user/auth/register') ||
      originalRequest.url?.includes('/user/auth/refresh') ||
      originalRequest.url?.includes('/user/auth/me')

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
        emitUnauthorized()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)
