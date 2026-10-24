import { createHttpClient } from '@/lib/http-client'
import { authEvents } from '@/features/auth/lib/auth-events'
import { API_BASE_URL } from '@/config/env'

/**
 * Instance axios dùng chung cho mọi module `*.http.ts` của khu vực admin.
 * Sử dụng HttpOnly Cookies và tự động thông báo authEvents khi 401.
 */
export const adminHttp = createHttpClient({
  baseURL: `${API_BASE_URL}/admin`,
  withCredentials: true,
  timeout: 15_000,
  onUnauthorized: () => authEvents.emit('unauthorized'),
})
