import { createHttpClient } from '@/lib/http-client'
import { authEvents } from '../auth/auth-events'

/**
 * Instance axios dùng chung cho mọi module `*.http.ts` của khu vực admin.
 * Chỉ các file `*.http.ts` được import `adminHttp`; component không gọi trực tiếp (quy ước 9).
 * Chế độ mock (`VITE_USE_MOCK=true`) không đi qua instance này.
 */
export const adminHttp = createHttpClient({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? ''}/admin`,
  withCredentials: true, // cookie HttpOnly (ưu tiên, mục 5.4)
  timeout: 15_000,
  onUnauthorized: () => authEvents.emit('unauthorized'),
})
