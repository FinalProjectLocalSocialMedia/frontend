import { ApiError } from '@/lib/http-client'
import { authEvents } from '../../auth/auth-events'
import { roleHasPermission, type Permission } from '../../auth/permissions'
import type { Role, StaffRole, Uuid } from '../../lib/types'
import { mockDb, roleOf } from './db'

/**
 * Mô phỏng cookie phiên của server. Lưu trong sessionStorage (guard try/catch,
 * có bộ nhớ dự phòng) để "refresh giữ phiên" giống cookie HttpOnly thật.
 */
const MOCK_COOKIE_KEY = 'nearby-admin-mock-cookie'
let memoryCookie: Uuid | null = null

export function setMockSession(userId: Uuid) {
  memoryCookie = userId
  try {
    window.sessionStorage.setItem(MOCK_COOKIE_KEY, userId)
  } catch {
    /* dùng bộ nhớ dự phòng */
  }
}

export function clearMockSession() {
  memoryCookie = null
  try {
    window.sessionStorage.removeItem(MOCK_COOKIE_KEY)
  } catch {
    /* ignore */
  }
}

export function getMockSessionUserId(): Uuid | null {
  try {
    return window.sessionStorage.getItem(MOCK_COOKIE_KEY) ?? memoryCookie
  } catch {
    return memoryCookie
  }
}

export const mockError = (
  status: number,
  message: string,
  code?: string,
  fieldErrors?: Record<string, string>,
) => new ApiError({ message, status, code, fieldErrors })

/**
 * Xác thực request mock. Không có phiên / tài khoản không còn hợp lệ → 401, đồng thời phát
 * `unauthorized` (đúng như interceptor axios làm với server thật) để AuthProvider đăng xuất.
 */
export function requireStaff(): { userId: Uuid; role: StaffRole } {
  const userId = getMockSessionUserId()
  const user = userId ? mockDb.users.find((u) => u.id === userId) : undefined
  const role: Role | undefined = userId ? roleOf(userId) : undefined
  if (!user || user.deletedAt || user.status === 'LOCKED' || (role !== 'ADMIN' && role !== 'MODERATOR')) {
    clearMockSession()
    authEvents.emit('unauthorized')
    throw mockError(401, 'Phiên đăng nhập đã hết hạn', 'UNAUTHENTICATED')
  }
  return { userId: user.id, role }
}

/** Như `requireStaff` nhưng thêm kiểm tra quyền → 403 nếu thiếu. */
export function requirePermission(permission: Permission) {
  const session = requireStaff()
  if (!roleHasPermission(session.role, permission)) {
    throw mockError(403, 'Bạn không có quyền thực hiện thao tác này', 'FORBIDDEN')
  }
  return session
}
