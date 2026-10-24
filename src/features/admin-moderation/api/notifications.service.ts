import { USE_MOCK } from '../lib/constants'
import type { AppNotification, NotificationType, Paginated, RequestOptions, Uuid } from '../lib/types'
import { httpNotificationsService } from './notifications.http'
import { mockNotificationsService } from './notifications.mock'

export type NotificationListParams = {
  unreadOnly?: boolean
  type?: NotificationType
  page?: number
  pageSize?: number
}

export interface NotificationsService {
  /** Thông báo của người đang đăng nhập, mới nhất trước. */
  list(p?: NotificationListParams, o?: RequestOptions): Promise<Paginated<AppNotification>>
  unreadCount(o?: RequestOptions): Promise<number>
  /** `'all'` = đánh dấu tất cả thông báo của mình là đã đọc. */
  markRead(ids: Uuid[] | 'all', o?: RequestOptions): Promise<void>
}

export const notificationsService: NotificationsService = USE_MOCK
  ? mockNotificationsService
  : httpNotificationsService
