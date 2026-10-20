import { adminHttp } from './http-client'
import type { AuthService } from './auth.service'
import type { AuthUser } from '../lib/types'

/** Gọi API thật (mục 10.1): `POST /admin/auth/login` · `POST /admin/auth/logout` · `GET /admin/auth/me`. */
export const httpAuthService: AuthService = {
  login: (input, o) =>
    adminHttp.post<AuthUser>('/auth/login', input, { signal: o?.signal }).then((r) => r.data),
  me: (o) => adminHttp.get<AuthUser>('/auth/me', { signal: o?.signal }).then((r) => r.data),
  logout: (o) => adminHttp.post('/auth/logout', undefined, { signal: o?.signal }).then(() => undefined),
}
