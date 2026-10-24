import type { NotificationsService } from './notifications.service'
import type { AppNotification } from '../lib/types'
import type { DbNotification } from './mock/db-types'
import { mockDb } from './mock/db'
import { mockDelay } from './mock/latency'
import { paginate } from './mock/paginate'
import { requirePermission } from './mock/session'

const toDto = (n: DbNotification): AppNotification => ({
  id: n.id,
  recipientId: n.recipient,
  type: n.type,
  content: n.content,
  referenceTargetId: n.referenceTargetId,
  isRead: n.isRead,
  createdAt: n.createdAt,
})

const mine = (userId: string) =>
  mockDb.notifications
    .filter((n) => n.recipient === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

export const mockNotificationsService: NotificationsService = {
  async list(p = {}, o) {
    await mockDelay(o?.signal)
    const { userId } = requirePermission('notifications.read')
    const items = mine(userId)
      .filter((n) => (p.unreadOnly ? !n.isRead : true))
      .filter((n) => (p.type ? n.type === p.type : true))
      .map(toDto)
    return paginate(items, p.page, p.pageSize)
  },

  async unreadCount(o) {
    await mockDelay(o?.signal)
    const { userId } = requirePermission('notifications.read')
    return mine(userId).filter((n) => !n.isRead).length
  },

  async markRead(ids, o) {
    await mockDelay(o?.signal)
    const { userId } = requirePermission('notifications.read')
    for (const n of mine(userId)) {
      if (ids === 'all' || ids.includes(n.id)) n.isRead = true
    }
  },
}
