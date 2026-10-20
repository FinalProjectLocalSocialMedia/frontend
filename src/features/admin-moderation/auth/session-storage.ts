import { ADMIN_SESSION_KEY } from '../lib/constants'
import type { AuthUser } from '../lib/types'

/** Đọc phiên đã lưu (chỉ là snapshot để khôi phục nhanh; luôn được xác thực lại bằng `me()`). */
export function readStoredSession(): AuthUser | null {
  try {
    const raw = window.sessionStorage.getItem(ADMIN_SESSION_KEY)
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
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user))
  } catch {
    /* ignore */
  }
}

export function clearStoredSession() {
  try {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
  } catch {
    /* ignore */
  }
}
