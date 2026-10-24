import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { initialsOf } from '../lib/labels'
import type { StaffRef } from '../lib/types'
import { StatusBadge } from './status-badge'

type StaffCellProps = {
  staff?: StaffRef | null
  showRole?: boolean
  className?: string
  fallbackText?: string
}

/**
 * Hiển thị thông tin nhân viên (Admin / Moderator) gồm Avatar chữ cái đầu, email và nhãn vai trò.
 */
export function StaffCell({
  staff,
  showRole = true,
  className,
  fallbackText = 'Hệ thống',
}: StaffCellProps) {
  if (!staff) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)}>
        {fallbackText}
      </span>
    )
  }

  const initials = initialsOf(staff.email)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Avatar size="sm" className="bg-muted text-muted-foreground">
        <AvatarFallback className="text-xs font-semibold uppercase">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="truncate text-sm font-medium leading-none text-foreground">
          {staff.email}
        </span>
        {showRole && (
          <div className="mt-1">
            <StatusBadge type="role" value={staff.role} className="text-[10px] py-0 px-1.5 h-4" />
          </div>
        )}
      </div>
    </div>
  )
}
