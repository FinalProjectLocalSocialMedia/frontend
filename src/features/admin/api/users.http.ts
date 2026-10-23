import { adminHttp } from '@/features/admin-moderation/api/http-client'
import type {
  AdminUserDetail,
  AdminUserListItem,
  CreateUserInput,
  Paginated,
  UpdateUserInput,
  UserListParams,
  Uuid,
} from '@/features/admin-moderation/lib/types'
import type { UsersService } from './users.service'

/**
 * Hiện thực kết nối HTTP thật tới backend Moderation Service cho Quản lý người dùng.
 * Endpoint: /api/v1/admin/users
 */
export const httpUsersService: UsersService = {
  list(params?: UserListParams, opts?) {
    const apiParams = params
      ? {
          ...params,
          role: params.role === 'NORMAL_USER' ? 'USER' : params.role,
        }
      : undefined

    return adminHttp
      .get<Paginated<AdminUserListItem>>('/users', {
        params: apiParams,
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },

  get(id: Uuid, opts?) {
    return adminHttp
      .get<AdminUserDetail>(`/users/${id}`, {
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },

  create(input: CreateUserInput, opts?) {
    const backendRole = input.role === 'NORMAL_USER' ? 'USER' : input.role
    const payload = {
      role: backendRole,
      email: input.email,
      password: input.password,
      phoneNumber: input.phoneNumber || undefined,
      profile:
        'profile' in input
          ? {
              fullName: input.profile.fullName,
              avatarUrl: input.profile.avatarUrl || undefined,
              bio: input.profile.bio || undefined,
              dateOfBirth: input.profile.dateOfBirth || undefined,
              gender: input.profile.gender ?? 1,
            }
          : undefined,
    }

    return adminHttp
      .post<AdminUserDetail>('/users', payload, {
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },

  update(id: Uuid, input: UpdateUserInput, opts?) {
    const payload = {
      email: input.email || undefined,
      phoneNumber: input.phoneNumber || undefined,
      profile: input.profile
        ? {
            fullName: input.profile.fullName || undefined,
            avatarUrl: input.profile.avatarUrl || undefined,
            bio: input.profile.bio || undefined,
            dateOfBirth: input.profile.dateOfBirth || undefined,
            gender: input.profile.gender ?? undefined,
          }
        : undefined,
    }

    return adminHttp
      .patch<AdminUserDetail>(`/users/${id}`, payload, {
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },

  delete(id: Uuid, opts?) {
    return adminHttp
      .delete<void>(`/users/${id}`, {
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },
}
