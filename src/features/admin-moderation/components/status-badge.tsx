import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  POST_STATUS_LABELS,
  REPORT_STATUS_LABELS,
  ROLE_LABELS,
  SANCTION_TYPE_LABELS,
  USER_STATUS_LABELS,
} from '../lib/labels'
import type { PostStatus, ReportStatus, Role, SanctionType, UserStatus } from '../lib/types'

type StatusBadgeProps =
  | {
      type: 'user-status'
      value: UserStatus
      className?: string
    }
  | {
      type: 'report-status'
      value: ReportStatus
      className?: string
    }
  | {
      type: 'post-status'
      value: PostStatus
      className?: string
    }
  | {
      type: 'role'
      value: Role
      className?: string
    }
  | {
      type: 'sanction'
      value: SanctionType
      className?: string
    }

/**
 * Hiển thị huy hiệu (Badge) trực quan theo đúng biến thể và nhãn tiếng Việt tương ứng.
 */
export function StatusBadge(props: StatusBadgeProps) {
  const { type, value, className } = props

  switch (type) {
    case 'user-status': {
      const isLocked = value === 'LOCKED'
      return (
        <Badge
          variant={isLocked ? 'destructive' : 'secondary'}
          className={cn(
            !isLocked &&
              'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
            className,
          )}
        >
          {USER_STATUS_LABELS[value]}
        </Badge>
      )
    }

    case 'report-status': {
      if (value === 'PENDING') {
        return (
          <Badge
            variant="outline"
            className={cn(
              'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
              className,
            )}
          >
            {REPORT_STATUS_LABELS.PENDING}
          </Badge>
        )
      }
      if (value === 'RESOLVED') {
        return (
          <Badge
            variant="outline"
            className={cn(
              'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
              className,
            )}
          >
            {REPORT_STATUS_LABELS.RESOLVED}
          </Badge>
        )
      }
      return (
        <Badge variant="secondary" className={cn('text-muted-foreground', className)}>
          {REPORT_STATUS_LABELS.REJECTED}
        </Badge>
      )
    }

    case 'post-status': {
      const isRemoved = value === 'REMOVED'
      return (
        <Badge
          variant={isRemoved ? 'destructive' : 'secondary'}
          className={cn(
            !isRemoved &&
              'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
            className,
          )}
        >
          {POST_STATUS_LABELS[value]}
        </Badge>
      )
    }

    case 'role': {
      if (value === 'ADMIN') {
        return (
          <Badge variant="default" className={cn('bg-primary text-primary-foreground', className)}>
            {ROLE_LABELS.ADMIN}
          </Badge>
        )
      }
      if (value === 'MODERATOR') {
        return (
          <Badge
            variant="secondary"
            className={cn(
              'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
              className,
            )}
          >
            {ROLE_LABELS.MODERATOR}
          </Badge>
        )
      }
      return (
        <Badge variant="outline" className={cn('text-muted-foreground', className)}>
          {ROLE_LABELS.NORMAL_USER}
        </Badge>
      )
    }

    case 'sanction': {
      if (value === 'LOCK') {
        return (
          <Badge variant="destructive" className={className}>
            {SANCTION_TYPE_LABELS.LOCK}
          </Badge>
        )
      }
      return (
        <Badge
          variant="outline"
          className={cn(
            'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
            className,
          )}
        >
          {SANCTION_TYPE_LABELS.WARN}
        </Badge>
      )
    }

    default:
      return null
  }
}
