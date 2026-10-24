import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AdminUserDetail,
  AdminUserListItem,
  CreateUserInput,
  Paginated,
  UpdateUserInput,
  UserListParams,
  Uuid,
} from '@/features/admin-moderation/lib/types'
import { usersService } from './users.service'

export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  lists: () => [...adminUserKeys.all, 'list'] as const,
  list: (params?: UserListParams) => [...adminUserKeys.lists(), params] as const,
  details: () => [...adminUserKeys.all, 'detail'] as const,
  detail: (id: Uuid) => [...adminUserKeys.details(), id] as const,
}

export function useAdminUsers(params?: UserListParams) {
  return useQuery<Paginated<AdminUserListItem>>({
    queryKey: adminUserKeys.list(params),
    queryFn: ({ signal }) => usersService.list(params, { signal }),
  })
}

export function useAdminUserDetail(id: Uuid | undefined) {
  return useQuery<AdminUserDetail>({
    queryKey: adminUserKeys.detail(id || ''),
    queryFn: ({ signal }) => {
      if (!id) throw new Error('Yêu cầu ID người dùng')
      return usersService.get(id, { signal })
    },
    enabled: Boolean(id),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUserInput) => usersService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: Uuid; input: UpdateUserInput }) =>
      usersService.update(id, input),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: adminUserKeys.detail(updatedUser.id),
      })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: Uuid) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() })
    },
  })
}
