import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useMarkNotificationsRead,
  useNotifications,
  useUnreadNotificationCount,
} from '../api/notifications.queries'
import { ADMIN_BASE } from '../lib/constants'
import { DateTime } from './date-time'

type NotificationBellProps = {
  className?: string
}

/**
 * Chuông thông báo trên thanh tiêu đề Admin, hiển thị số chưa đọc và danh sách 5 thông báo mới nhất.
 */
export function NotificationBell({ className }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const { data: unreadCount = 0 } = useUnreadNotificationCount()
  const { data: notificationsData, isLoading } = useNotifications(
    { pageSize: 5 },
    open,
  )
  const markReadMutation = useMarkNotificationsRead()

  const items = notificationsData?.items ?? []

  const handleMarkAllRead = async () => {
    await markReadMutation.mutateAsync('all')
  }

  const handleItemClick = async (id: string, isRead: boolean) => {
    if (!isRead) {
      await markReadMutation.mutateAsync([id])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Thông báo ${unreadCount > 0 ? `(${unreadCount} chưa đọc)` : ''}`}
            className={`relative ${className ?? ''}`}
          />
        }
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <PopoverHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
          <PopoverTitle className="text-sm font-semibold">Thông báo</PopoverTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markReadMutation.isPending}
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="size-3.5" />
              <span>Đã đọc tất cả</span>
            </Button>
          )}
        </PopoverHeader>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Không có thông báo mới
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item.id, item.isRead)}
                  className={`flex w-full items-start gap-3 p-3.5 text-left transition-colors hover:bg-muted/50 ${
                    !item.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <span
                    className={`mt-1 size-2 shrink-0 rounded-full ${
                      !item.isRead ? 'bg-primary' : 'bg-transparent'
                    }`}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-medium leading-snug text-foreground">
                      {item.content}
                    </p>
                    <div className="text-[11px] text-muted-foreground">
                      <DateTime value={item.createdAt} mode="relative" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div className="p-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-primary"
            onClick={() => setOpen(false)}
            nativeButton={false}
            render={<Link to={`${ADMIN_BASE}/notifications`} />}
          >
            Xem tất cả thông báo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
