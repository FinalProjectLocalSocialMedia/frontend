import { USE_MOCK } from '../lib/constants'
import type { AuthUser, LoginInput, RequestOptions } from '../lib/types'
import { httpAuthService } from './auth.http'
import { mockAuthService } from './auth.mock'

export interface AuthService {
  /** Lỗi: 401 `INVALID_CREDENTIALS` · 403 `ACCOUNT_LOCKED` · 403 `NOT_STAFF` · 0 (mạng). */
  login(input: LoginInput, o?: RequestOptions): Promise<AuthUser>
  /** Phiên hiện tại; 401 nếu hết hạn. Server thật đọc cookie HttpOnly. */
  me(o?: RequestOptions): Promise<AuthUser>
  logout(o?: RequestOptions): Promise<void>
}

export const authService: AuthService = USE_MOCK ? mockAuthService : httpAuthService
