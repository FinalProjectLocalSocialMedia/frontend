import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from './notification-api'
import type { FollowStatus, NotificationCursorPage, UnreadCount } from '../types/notification'

export const notificationKeys = {
  all: ['notification'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

export function useNotificationsInfiniteQuery(
  limit = 20,
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery({
    queryKey: [...notificationKeys.list(), { limit }] as const,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => notificationApi.getNotifications(pageParam, limit),
    getNextPageParam: (lastPage: NotificationCursorPage) => lastPage.nextCursor ?? undefined,
    enabled: options?.enabled,
  })
}

export function useUnreadCountQuery(options?: { enabled?: boolean }) {
  return useQuery<UnreadCount>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
    staleTime: 30_000,
    enabled: options?.enabled,
  })
}

export function useMarkReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
    },
  })
}

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.setQueryData(notificationKeys.unreadCount(), { unreadCount: 0 })
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
    },
  })
}

export function useRespondFollowRequestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      followId,
      decision,
    }: {
      followId: string
      decision: Exclude<FollowStatus, 'PENDING'>
    }) => notificationApi.respondFollowRequest(followId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
    },
  })
}

