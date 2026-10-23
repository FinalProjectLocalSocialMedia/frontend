import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_REFRESH_TOKEN_KEY,
  ADMIN_SESSION_KEY,
} from '../lib/constants'
import type { AuthUser } from '../lib/types'

/** Lấy access token từ localStorage */
export function getAccessToken(): string | null {
  try {
    return window.localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

/** Lấy refresh token từ localStorage */
export function getRefreshToken(): string | null {
  try {
    return window.localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

/** Lưu toàn bộ token và thông tin người dùng vào localStorage */
export function saveAuthTokens(data: {
  accessToken: string
  refreshToken: string
  user: AuthUser
}) {
  try {
    window.localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, data.accessToken)
    window.localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, data.refreshToken)
    window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(data.user))
  } catch {
    /* ignore */
  }
}

/** Cập nhật access token mới (và refresh token mới nếu có xoay vòng) */
export function updateAccessToken(accessToken: string, refreshToken?: string) {
  try {
    window.localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) {
      window.localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken)
    }
  } catch {
    /* ignore */
  }
}

/** Đọc phiên đã lưu từ localStorage (chỉ là snapshot để khôi phục nhanh; luôn được xác thực lại bằng me()) */
export function readStoredSession(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthUser>
    if (
      typeof parsed.id === 'string' &&
      typeof parsed.email === 'string' &&
      (parsed.role === 'ADMIN' || parsed.role === 'MODERATOR')
    ) {
      return { id: parsed.id, email: parsed.email, role: parsed.role }
    }
  } catch {
    /* storage không khả dụng hoặc JSON hỏng → coi như chưa đăng nhập */
  }
  return null
}

export function writeStoredSession(user: AuthUser) {
  try {
    window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user))
  } catch {
    /* ignore */
  }
}

/** Xoá toàn bộ token và phiên khỏi localStorage */
export function clearStoredSession() {
  try {
    window.localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY)
    window.localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY)
    window.localStorage.removeItem(ADMIN_SESSION_KEY)
  } catch {
    /* ignore */
  }
}
