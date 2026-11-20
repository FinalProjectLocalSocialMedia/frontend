import axios, { type AxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '@/config/env'
import { authEvents } from '@/features/auth/lib/auth-events'

export class AuthExpiredError extends Error {
  readonly status = 401
  constructor(message = 'Phiên đăng nhập đã hết hạn', options?: ErrorOptions) {
    super(message, options)
    this.name = 'AuthExpiredError'
    Object.setPrototypeOf(this, AuthExpiredError.prototype)
  }
}

export function isAuthExpiredError(error: unknown): error is AuthExpiredError {
  return (
    error instanceof AuthExpiredError ||
    (error instanceof Error && error.name === 'AuthExpiredError')
  )
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Tự động gửi & nhận HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Kích hoạt CORS preflight chống CSRF
  },
})

let lastUnauthorizedEmit = 0
export const emitUnauthorized = () => {
  const now = Date.now()
  if (now - lastUnauthorizedEmit > 1500) {
    lastUnauthorizedEmit = now
    authEvents.emit('unauthorized')
  }
}

// Biến lưu Promise đang refresh để thực hiện single-flight cho cả Interceptor và SSE
let refreshPromise: Promise<void> | null = null

export async function refreshAccessToken(): Promise<void> {
  if (refreshPromise) {
    return refreshPromise
  }

  const executeRefresh = async () => {
    try {
      if (
        typeof navigator !== 'undefined' &&
        'locks' in navigator &&
        typeof navigator.locks?.request === 'function'
      ) {
        await navigator.locks.request('auth-refresh', async () => {
          await apiClient.post('/user/auth/refresh')
        })
      } else {
        await apiClient.post('/user/auth/refresh')
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        if (status === 401 || status === 403) {
          emitUnauthorized()
          throw new AuthExpiredError('Phiên đăng nhập đã hết hạn', { cause: err })
        }
      }
      throw err
    }
  }

  refreshPromise = executeRefresh().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

// Biến lưu trạng thái đang refresh cho Axios interceptor
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

    // Nếu endpoint bị 401 và không phải là các endpoint auth cơ bản (login/refresh/register/me)
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
        await refreshAccessToken()
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
