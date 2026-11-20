export type NotificationType =
  | 'FOLLOW_REQUEST'
  | 'FOLLOW_REQUEST_ACCEPTED'
  | 'POST_LIKED'
  | 'POST_COMMENTED'
  | 'COMMENT_REPLIED'
  | 'COMMENT_LIKED'
  | 'REPORT_RESOLVED'
  | 'REPORT_REJECTED'
  | 'CONTENT_REMOVED'
  | 'CONTENT_HIDDEN'
  | 'ACCOUNT_WARNING'
  | 'ACCOUNT_LOCKED'
  | 'TRENDING_LOCATION'
  | 'TRENDING_POST'

export type NotificationReferenceType =
  | 'POST'
  | 'COMMENT'
  | 'USER'
  | 'FOLLOW'
  | 'REPORT'
  | 'SANCTION'
  | 'LOCATION'

export type FollowStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface NotificationActor {
  id: string
  fullName: string
  avatarUrl?: string
}

export interface AppNotification {
  id: string
  type: NotificationType
  referenceType: NotificationReferenceType
  referenceId: string
  actor: NotificationActor | null
  actorCount: number
  content: string | null
  metadata: Record<string, string> | null
  followStatus: FollowStatus | null
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationCursorPage {
  items: AppNotification[]
  nextCursor: string | null
}

export interface UnreadCount {
  unreadCount: number
}

