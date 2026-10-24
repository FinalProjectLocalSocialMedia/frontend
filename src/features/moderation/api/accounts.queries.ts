import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  FlaggedAccountsParams,
  LockUserInput,
  UnlockUserInput,
  Uuid,
  WarnUserInput,
} from '@/features/admin-moderation/lib/types'
import { accountsService } from './accounts.service'
import { reportKeys } from './reports.queries'

export const accountKeys = {
  all: ['admin', 'accounts'] as const,
  flagged: (params: FlaggedAccountsParams) => ['admin', 'accounts', 'flagged', params] as const,
  sanctions: (userId: Uuid) => ['admin', 'accounts', 'sanctions', userId] as const,
}

export function useFlaggedAccounts(params: FlaggedAccountsParams = {}, enabled = true) {
  return useQuery({
    queryKey: accountKeys.flagged(params),
    queryFn: ({ signal }) => accountsService.getFlaggedAccounts(params, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useUserSanctions(userId: Uuid, enabled = true) {
  return useQuery({
    queryKey: accountKeys.sanctions(userId),
    queryFn: ({ signal }) => accountsService.getUserSanctions(userId, { signal }),
    enabled: enabled && !!userId,
  })
}

export function useWarnUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, input }: { userId: Uuid; input: WarnUserInput }) =>
      accountsService.warnUser(userId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all })
      queryClient.invalidateQueries({
        queryKey: accountKeys.sanctions(variables.userId),
      })
      queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

export function useLockUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, input }: { userId: Uuid; input: LockUserInput }) =>
      accountsService.lockUser(userId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all })
      queryClient.invalidateQueries({
        queryKey: accountKeys.sanctions(variables.userId),
      })
      queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

export function useUnlockUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, input }: { userId: Uuid; input: UnlockUserInput }) =>
      accountsService.unlockUser(userId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all })
      queryClient.invalidateQueries({
        queryKey: accountKeys.sanctions(variables.userId),
      })
      queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}
