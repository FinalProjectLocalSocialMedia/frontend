import type { AuthService } from './auth.service'
import { authEvents } from '../auth/auth-events'
import type { AuthUser } from '../lib/types'
import { mockDb, roleOf } from './mock/db'
import { mockDelay } from './mock/latency'
import { clearMockSession, getMockSessionUserId, mockError, setMockSession } from './mock/session'

const toAuthUser = (userId: string): AuthUser => {
  const user = mockDb.users.find((u) => u.id === userId)!
  // Chỉ trả id/email/role — KHÔNG BAO GIỜ trả `password`.
  return { id: user.id, email: user.email, role: roleOf(userId) as AuthUser['role'] }
}

/** Mô phỏng logic đăng nhập phía server. */
export const mockAuthService: AuthService = {
  async login(input, o) {
    await mockDelay(o?.signal)
    const email = input.email.trim().toLowerCase()
    const user = mockDb.users.find((u) => !u.deletedAt && u.email.toLowerCase() === email)
    if (!user || user.password !== input.password) {
      throw mockError(401, 'Email hoặc mật khẩu không đúng', 'INVALID_CREDENTIALS')
    }
    if (user.status === 'LOCKED') {
      throw mockError(403, 'Tài khoản đã bị khoá', 'ACCOUNT_LOCKED')
    }
    const role = roleOf(user.id)
    if (role !== 'ADMIN' && role !== 'MODERATOR') {
      throw mockError(403, 'Tài khoản không có quyền truy cập khu vực quản trị', 'NOT_STAFF')
    }
    setMockSession(user.id)
    return toAuthUser(user.id)
  },

  async me(o) {
    await mockDelay(o?.signal)
    const userId = getMockSessionUserId()
    const user = userId ? mockDb.users.find((u) => u.id === userId) : undefined
    const role = userId ? roleOf(userId) : undefined
    if (!user || user.deletedAt || user.status === 'LOCKED' || (role !== 'ADMIN' && role !== 'MODERATOR')) {
      clearMockSession()
      authEvents.emit('unauthorized')
      throw mockError(401, 'Phiên đăng nhập đã hết hạn', 'UNAUTHENTICATED')
    }
    return toAuthUser(user.id)
  },

  async logout(o) {
    await mockDelay(o?.signal)
    clearMockSession()
  },
}
