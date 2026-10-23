import { USE_MOCK } from '@/features/admin-moderation/lib/constants'
import type {
  FlaggedAccount,
  FlaggedAccountsParams,
  LockUserInput,
  Paginated,
  RequestOptions,
  SanctionRecord,
  UnlockUserInput,
  Uuid,
  WarnUserInput,
} from '@/features/admin-moderation/lib/types'
import { httpAccountsService } from './accounts.http'
import { mockAccountsService } from './accounts.mock'

export interface AccountsService {
  getFlaggedAccounts(
    params?: FlaggedAccountsParams,
    options?: RequestOptions
  ): Promise<Paginated<FlaggedAccount>>
  getUserSanctions(
    userId: Uuid,
    options?: RequestOptions
  ): Promise<SanctionRecord[]>
  warnUser(
    userId: Uuid,
    input: WarnUserInput,
    options?: RequestOptions
  ): Promise<SanctionRecord>
  lockUser(
    userId: Uuid,
    input: LockUserInput,
    options?: RequestOptions
  ): Promise<SanctionRecord>
  unlockUser(
    userId: Uuid,
    input: UnlockUserInput,
    options?: RequestOptions
  ): Promise<SanctionRecord>
}

export const accountsService: AccountsService = USE_MOCK
  ? mockAccountsService
  : httpAccountsService
