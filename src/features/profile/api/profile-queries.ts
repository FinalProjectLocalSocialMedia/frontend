import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authKeys } from '@/features/auth/api/auth-queries'
import type { AuthUser } from '@/features/auth/types/auth'
import { postKeys } from '@/features/post/api/post-queries'
import {
  blockUser,
  createReport,
  followUser,
  getPublicProfile,
  unblockUser,
  unfollowUser,
  updateMyProfile,
} from './profile-api'
import type { PublicUserProfile, UpdateProfilePayload } from '../types/profile'

export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: string | undefined) => [...profileKeys.all, 'detail', userId] as const,
}

export function usePublicProfile(userId: string | undefined, enabled = true) {
  return useQuery<PublicUserProfile>({
    queryKey: profileKeys.detail(userId),
    queryFn: () => {
      if (!userId) throw new Error('Thiếu ID người dùng')
      return getPublicProfile(userId)
    },
    enabled: Boolean(userId) && enabled,
    retry: false,
    staleTime: 30_000,
  })
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateMyProfile(payload),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<AuthUser | null>(authKeys.me(), (current) => {
        if (!current) return updatedUser
        return { ...current, ...updatedUser }
      })
      queryClient.setQueryData<PublicUserProfile>(profileKeys.detail(updatedUser.id), (current) =>
        current
          ? {
              ...current,
              fullName: updatedUser.fullName,
              avatarUrl: updatedUser.avatarUrl,
              bio: updatedUser.bio,
            }
          : current,
      )
      void queryClient.invalidateQueries({ queryKey: profileKeys.detail(updatedUser.id) })
      void queryClient.invalidateQueries({ queryKey: postKeys.all })
    },
  })
}

export function useFollowMutation(targetUserId: string | undefined, currentUserId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (currentlyFollowingOrPending: boolean) => {
      if (!targetUserId) throw new Error('Thiếu ID người dùng')
      if (currentlyFollowingOrPending) {
        await unfollowUser(targetUserId)
        return { action: 'unfollowed' as const }
      }
      const follow = await followUser(targetUserId)
      return { action: 'followed' as const, follow }
    },
    onSuccess: () => {
      if (targetUserId) {
        void queryClient.invalidateQueries({ queryKey: profileKeys.detail(targetUserId) })
      }
      if (currentUserId) {
        void queryClient.invalidateQueries({ queryKey: profileKeys.detail(currentUserId) })
      }
    },
  })
}

export function useBlockUserMutation(targetUserId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!targetUserId) throw new Error('Thiếu ID người dùng')
      await blockUser(targetUserId)
    },
    onSuccess: () => {
      if (targetUserId) {
        void queryClient.invalidateQueries({ queryKey: profileKeys.detail(targetUserId) })
      }
      void queryClient.invalidateQueries({ queryKey: postKeys.all })
    },
  })
}

export function useUnblockUserMutation(targetUserId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!targetUserId) throw new Error('Thiếu ID người dùng')
      await unblockUser(targetUserId)
    },
    onSuccess: () => {
      if (targetUserId) {
        void queryClient.invalidateQueries({ queryKey: profileKeys.detail(targetUserId) })
      }
      void queryClient.invalidateQueries({ queryKey: postKeys.all })
    },
  })
}

export function useReportUserMutation() {
  return useMutation({
    mutationFn: ({ targetId, reason }: { targetId: string; reason: string }) =>
      createReport({ targetType: 'USER', targetId, reason }),
  })
}
