import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/api-client'
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  respondFollowRequest,
  notificationApi,
} from './notification-api'
import type { NotificationCursorPage, UnreadCount } from '../types/notification'

describe('notification-api', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('getNotifications', () => {
    it('fetches notifications with default params', async () => {
      const mockData: NotificationCursorPage = {
        items: [
          {
            id: 'notif-1',
            type: 'POST_LIKED',
            referenceType: 'POST',
            referenceId: 'post-1',
            actor: { id: 'user-1', fullName: 'Nguyen Van A' },
            actorCount: 1,
            content: null,
            metadata: { postId: 'post-1' },
            followStatus: null,
            isRead: false,
            createdAt: '2026-11-10T08:00:00Z',
            updatedAt: '2026-11-10T08:05:00Z',
          },
        ],
        nextCursor: 'cursor-next',
      }

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockData })

      const result = await getNotifications()

      expect(getSpy).toHaveBeenCalledWith('/notification/notifications', {
        params: { cursor: undefined, limit: 20 },
      })
      expect(result).toEqual(mockData)
    })

    it('fetches notifications with cursor and custom limit', async () => {
      const mockData: NotificationCursorPage = { items: [], nextCursor: null }
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockData })

      const result = await getNotifications('cursor-abc', 10)

      expect(getSpy).toHaveBeenCalledWith('/notification/notifications', {
        params: { cursor: 'cursor-abc', limit: 10 },
      })
      expect(result).toEqual(mockData)
    })
  })

  describe('getUnreadCount', () => {
    it('fetches unread count', async () => {
      const mockData: UnreadCount = { unreadCount: 7 }
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockData })

      const result = await getUnreadCount()

      expect(getSpy).toHaveBeenCalledWith('/notification/notifications/unread-count')
      expect(result).toEqual(mockData)
    })
  })

  describe('markRead', () => {
    it('sends PATCH request to mark a notification as read', async () => {
      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({ data: null })

      await markRead('notif-123')

      expect(patchSpy).toHaveBeenCalledWith('/notification/notifications/notif-123/read')
    })
  })

  describe('markAllRead', () => {
    it('sends POST request to mark all notifications as read', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: null })

      await markAllRead()

      expect(postSpy).toHaveBeenCalledWith('/notification/notifications/read-all')
    })
  })

  describe('respondFollowRequest', () => {
    it('sends PATCH request to accept follow request', async () => {
      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({ data: null })

      await respondFollowRequest('follow-456', 'ACCEPTED')

      expect(patchSpy).toHaveBeenCalledWith('/user/follow-requests/follow-456', {
        decision: 'ACCEPTED',
      })
    })

    it('sends PATCH request to reject follow request', async () => {
      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({ data: null })

      await respondFollowRequest('follow-456', 'REJECTED')

      expect(patchSpy).toHaveBeenCalledWith('/user/follow-requests/follow-456', {
        decision: 'REJECTED',
      })
    })
  })

  describe('notificationApi object export', () => {
    it('exposes all API methods', () => {
      expect(notificationApi.getNotifications).toBe(getNotifications)
      expect(notificationApi.getUnreadCount).toBe(getUnreadCount)
      expect(notificationApi.markRead).toBe(markRead)
      expect(notificationApi.markAllRead).toBe(markAllRead)
      expect(notificationApi.respondFollowRequest).toBe(respondFollowRequest)
    })
  })
})

