import { adminHttp } from '@/features/admin-moderation/api/http-client'
import type {
  FlaggedAccount,
  FlaggedAccountsParams,
  LockUserInput,
  Paginated,
  SanctionRecord,
  UnlockUserInput,
  Uuid,
  WarnUserInput,
} from '@/features/admin-moderation/lib/types'
import type { AccountsService } from './accounts.service'

/**
 * Hiện thực kết nối HTTP thật tới backend Moderation Service cho Tài khoản vi phạm & Xử phạt.
 * OpenAPI endpoints:
 * - GET /api/v1/admin/accounts/flagged
 * - GET /api/v1/admin/users/{id}/sanctions
 * - POST /api/v1/admin/users/{id}/warn
 * - POST /api/v1/admin/users/{id}/lock
 * - POST /api/v1/admin/users/{id}/unlock
 */
export const httpAccountsService: AccountsService = {
  getFlaggedAccounts(params?: FlaggedAccountsParams, opts?) {
    return adminHttp
      .get<Paginated<FlaggedAccount>>('/accounts/flagged', {
        params,
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },

  getUserSanctions(userId: Uuid, opts?) {
    return adminHttp
      .get<SanctionRecord[]>(`/users/${userId}/sanctions`, {
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },

  warnUser(userId: Uuid, input: WarnUserInput, opts?) {
    return adminHttp
      .post<SanctionRecord>(`/users/${userId}/warn`, input, {
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },

  lockUser(userId: Uuid, input: LockUserInput, opts?) {
    return adminHttp
      .post<SanctionRecord>(`/users/${userId}/lock`, input, {
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },

  unlockUser(userId: Uuid, input: UnlockUserInput, opts?) {
    return adminHttp
      .post<SanctionRecord>(`/users/${userId}/unlock`, input, {
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },
}
