import { apiClient } from '@/lib/api-client'
import type {
  FollowStatus,
  NotificationCursorPage,
  UnreadCount,
} from '../types/notification'

export async function getNotifications(
  cursor?: string | null,
  limit = 20,
): Promise<NotificationCursorPage> {
  const response = await apiClient.get<NotificationCursorPage>(
    '/notification/notifications',
    {
      params: {
        cursor: cursor || undefined,
        limit,
      },
    },
  )
  return response.data
}

export async function getUnreadCount(): Promise<UnreadCount> {
  const response = await apiClient.get<UnreadCount>(
    '/notification/notifications/unread-count',
  )
  return response.data
}

export async function markRead(id: string): Promise<void> {
  await apiClient.patch(`/notification/notifications/${id}/read`)
}

export async function markAllRead(): Promise<void> {
  await apiClient.post('/notification/notifications/read-all')
}

export async function respondFollowRequest(
  followId: string,
  decision: Exclude<FollowStatus, 'PENDING'>,
): Promise<void> {
  await apiClient.patch(`/user/follow-requests/${followId}`, { decision })
}

export const notificationApi = {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  respondFollowRequest,
}

