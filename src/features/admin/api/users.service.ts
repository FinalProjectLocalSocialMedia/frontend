import { USE_MOCK } from '@/features/admin-moderation/lib/constants'
import type {
  AdminUserDetail,
  AdminUserListItem,
  CreateUserInput,
  Paginated,
  RequestOptions,
  UpdateUserInput,
  UserListParams,
  Uuid,
} from '@/features/admin-moderation/lib/types'
import { httpUsersService } from './users.http'
import { mockUsersService } from './users.mock'

export interface UsersService {
  list(
    params?: UserListParams,
    options?: RequestOptions
  ): Promise<Paginated<AdminUserListItem>>
  get(id: Uuid, options?: RequestOptions): Promise<AdminUserDetail>
  create(
    input: CreateUserInput,
    options?: RequestOptions
  ): Promise<AdminUserDetail>
  update(
    id: Uuid,
    input: UpdateUserInput,
    options?: RequestOptions
  ): Promise<AdminUserDetail>
  delete(id: Uuid, options?: RequestOptions): Promise<void>
}

export const usersService: UsersService = USE_MOCK
  ? mockUsersService
  : httpUsersService
