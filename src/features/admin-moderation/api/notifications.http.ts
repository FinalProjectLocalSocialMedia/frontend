import { adminHttp } from './http-client'
import type { NotificationsService } from './notifications.service'
import type { AppNotification, Paginated } from '../lib/types'

/** `GET /admin/notifications?unread&type&page&pageSize` · `POST /admin/notifications/read` (mục 10.1). */
export const httpNotificationsService: NotificationsService = {
  list: (p, o) =>
    adminHttp
      .get<Paginated<AppNotification>>('/notifications', {
        params: {
          unread: p?.unreadOnly || undefined,
          type: p?.type,
          page: p?.page,
          pageSize: p?.pageSize,
        },
        signal: o?.signal,
      })
      .then((r) => r.data),
  unreadCount: (o) =>
    adminHttp
      .get<Paginated<AppNotification>>('/notifications', {
        params: { unread: true, pageSize: 1 },
        signal: o?.signal,
      })
      .then((r) => r.data.total),
  markRead: (ids, o) =>
    adminHttp
      .post('/notifications/read', ids === 'all' ? { all: true } : { ids }, { signal: o?.signal })
      .then(() => undefined),
}
