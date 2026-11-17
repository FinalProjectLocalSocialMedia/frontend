import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Flame,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  ShieldAlert,
  UserCheck,
  UserPlus,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { describeNotification, getNotificationHref } from '../api/notification-text'
import type { AppNotification, NotificationType } from '../types/notification'
import { FollowRequestActions } from './follow-request-actions'

interface NotificationItemProps {
  notification: AppNotification
  onMarkRead: (id: string) => void
}

function NotificationTypeIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'FOLLOW_REQUEST':
      return <UserPlus className="size-4 text-primary" />
    case 'FOLLOW_REQUEST_ACCEPTED':
      return <UserCheck className="size-4 text-primary" />
    case 'POST_LIKED':
    case 'COMMENT_LIKED':
      return <Heart className="size-4 text-destructive" />
    case 'POST_COMMENTED':
    case 'COMMENT_REPLIED':
      return <MessageCircle className="size-4 text-primary" />
    case 'REPORT_RESOLVED':
    case 'REPORT_REJECTED':
      return <CheckCircle2 className="size-4 text-primary" />
    case 'CONTENT_REMOVED':
    case 'CONTENT_HIDDEN':
      return <ShieldAlert className="size-4 text-destructive" />
    case 'ACCOUNT_WARNING':
      return <AlertTriangle className="size-4 text-destructive" />
    case 'ACCOUNT_LOCKED':
      return <Lock className="size-4 text-destructive" />
    case 'TRENDING_LOCATION':
      return <MapPin className="size-4 text-primary" />
    case 'TRENDING_POST':
      return <Flame className="size-4 text-primary" />
    default:
      return <Bell className="size-4 text-muted-foreground" />
  }
}

function formatRelativeTime(isoString: string): string {
  try {
    return formatDistanceToNow(new Date(isoString), {
      addSuffix: true,
      locale: vi,
    })
  } catch {
    return ''
  }
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const description = describeNotification(notification)
  const href = getNotificationHref(notification)
  const relativeTime = formatRelativeTime(notification.updatedAt || notification.createdAt)

  const handleRead = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id)
    }
  }

  const avatar = notification.actor ? (
    <Avatar className="size-10 shrink-0 border border-border">
      <AvatarImage src={notification.actor.avatarUrl} alt={notification.actor.fullName} />
      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
        {notification.actor.fullName.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  ) : (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
      <NotificationTypeIcon type={notification.type} />
    </div>
  )

  const body = (
    <div className="min-w-0 flex-1 space-y-1">
      <p className="text-sm leading-snug text-foreground">{description}</p>
      {relativeTime ? (
        <p className="text-xs text-muted-foreground">{relativeTime}</p>
      ) : null}
    </div>
  )

  const unreadIndicator = !notification.isRead ? (
    <span
      aria-label="Chưa đọc"
      className="mt-2 size-2.5 shrink-0 rounded-full bg-primary"
    />
  ) : null

  const containerClass = cn(
    'flex flex-col gap-2.5 rounded-xl border border-border p-3.5 transition-colors',
    notification.isRead
      ? 'bg-card hover:bg-muted/50'
      : 'bg-primary/5 hover:bg-primary/10',
  )

  return (
    <div className={containerClass} data-unread={!notification.isRead}>
      {href ? (
        <Link
          to={href}
          onClick={handleRead}
          className="flex items-start gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {avatar}
          {body}
          {unreadIndicator}
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleRead}
          className="flex w-full items-start gap-3 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {avatar}
          {body}
          {unreadIndicator}
        </button>
      )}

      {notification.type === 'FOLLOW_REQUEST' ? (
        <div className="pl-13">
          <FollowRequestActions
            followId={notification.referenceId}
            followStatus={notification.followStatus}
          />
        </div>
      ) : null}
    </div>
  )
}
