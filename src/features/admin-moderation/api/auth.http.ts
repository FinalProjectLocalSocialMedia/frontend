import axios from 'axios'
import { ApiError } from '@/lib/http-client'
import {
  clearStoredSession,
  getRefreshToken,
  saveAuthTokens,
  writeStoredSession,
} from '../auth/session-storage'
import type { AuthService } from './auth.service'
import { adminHttp, AUTH_API_BASE_URL } from './http-client'
import type { AuthUser, StaffRole } from '../lib/types'

interface BackendAuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  roles?: string[]
  user: {
    id: string
    email: string
    fullName?: string
    status: string
  }
}

/**
 * Hiện thực gọi API xác thực thật nối với backend user-service và moderation-service.
 * - Login: POST ${AUTH_API_BASE_URL}/auth/login (của user-service)
 * - Refresh: tự động qua interceptor trong http-client.ts
 * - Me: GET /api/v1/admin/me (của moderation-service)
 * - Logout: POST ${AUTH_API_BASE_URL}/auth/logout
 */
export const httpAuthService: AuthService = {
  async login(input, o) {
    try {
      const res = await axios.post<BackendAuthResponse>(
        `${AUTH_API_BASE_URL}/auth/login`,
        {
          email: input.email.trim(),
          password: input.password,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          signal: o?.signal,
        }
      )

      const data = res.data
      const roles = data.roles ?? []

      // Xác định quyền hạn: ADMIN > MODERATOR
      let staffRole: StaffRole | null = null
      if (roles.includes('ROLE_ADMIN')) {
        staffRole = 'ADMIN'
      } else if (roles.includes('ROLE_MODERATOR')) {
        staffRole = 'MODERATOR'
      }

      // Nếu tài khoản không thuộc quyền quản trị / kiểm duyệt
      if (!staffRole) {
        throw new ApiError({
          status: 403,
          code: 'NOT_STAFF',
          message: 'Tài khoản này không có quyền truy cập khu vực quản trị.',
        })
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        role: staffRole,
      }

      // Lưu tokens và session vào localStorage
      saveAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: authUser,
      })

      return authUser
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err
      }

      const axiosErr = err as {
        response?: {
          status?: number
          data?: { code?: string; message?: string }
        }
        message?: string
      }

      const status = axiosErr.response?.status ?? 0
      const code =
        axiosErr.response?.data?.code ??
        (status === 401 ? 'INVALID_CREDENTIALS' : undefined)
      const message =
        axiosErr.response?.data?.message ||
        (status === 401
          ? 'Email hoặc mật khẩu không chính xác.'
          : 'Đăng nhập không thành công.')

      throw new ApiError({
        status,
        code,
        message,
        data: axiosErr.response?.data,
      })
    }
  },

  async me(o) {
    // Gọi endpoint /api/v1/admin/me của moderation-service (đã có interceptor Bearer token)
    const res = await adminHttp.get<{ id: string; email: string; role: StaffRole }>(
      '/me',
      { signal: o?.signal }
    )
    const authUser: AuthUser = {
      id: res.data.id,
      email: res.data.email,
      role: res.data.role,
    }
    writeStoredSession(authUser)
    return authUser
  },

  async logout(o) {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) {
        await axios.post(
          `${AUTH_API_BASE_URL}/auth/logout`,
          { refreshToken },
          { signal: o?.signal }
        )
      }
    } catch {
      /* ignore */
    } finally {
      clearStoredSession()
    }
  },
}
