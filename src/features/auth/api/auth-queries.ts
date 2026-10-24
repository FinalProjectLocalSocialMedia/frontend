import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from './auth-api'
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth'

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

export function useMeQuery() {
  return useQuery<AuthUser | null>({
    queryKey: authKeys.me(),
    queryFn: async () => {
      try {
        return await authApi.getMe()
      } catch {
        return null
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 phút
    refetchOnWindowFocus: false,
  })
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me(), user)
    },
  })
}

export function useRegisterMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me(), user)
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout()
      } catch {
        // Bỏ qua lỗi server khi logout
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me(), null)
      queryClient.clear()
    },
  })
}
