import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsService, type NotificationListParams } from './notifications.service'
import type { Uuid } from '../lib/types'

export const notificationKeys = {
  all: ['admin', 'notifications'] as const,
  list: (p: NotificationListParams) => ['admin', 'notifications', 'list', p] as const,
  unreadCount: ['admin', 'notifications', 'unread-count'] as const,
}

/** Chuông thông báo kiểm tra mỗi 30 giây; khi backend có SSE/WebSocket chỉ cần đổi service. */
export const NOTIFICATION_POLL_MS = 30_000

export const useNotifications = (params: NotificationListParams = {}, enabled = true) =>
  useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: ({ signal }) => notificationsService.list(params, { signal }),
    placeholderData: keepPreviousData,
    refetchInterval: NOTIFICATION_POLL_MS,
    enabled,
  })

export const useUnreadNotificationCount = (enabled = true) =>
  useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: ({ signal }) => notificationsService.unreadCount({ signal }),
    refetchInterval: NOTIFICATION_POLL_MS,
    enabled,
  })

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: Uuid[] | 'all') => notificationsService.markRead(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
