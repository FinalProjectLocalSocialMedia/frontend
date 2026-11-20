import { CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  useMarkAllReadMutation,
  useUnreadCountQuery,
} from '../api/notification-queries'
import { NOTIFICATION_UI_TEXT } from '../api/notification-text'
import { NotificationList } from '../components/notification-list'

export function NotificationPage() {
  const { data: unreadData } = useUnreadCountQuery()
  const markAllReadMutation = useMarkAllReadMutation()

  const unreadCount = unreadData?.unreadCount ?? 0

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync()
      toast.success(NOTIFICATION_UI_TEXT.markAllReadSuccess)
    } catch {
      toast.error(NOTIFICATION_UI_TEXT.markAllReadError)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {NOTIFICATION_UI_TEXT.pageTitle}
        </h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={unreadCount === 0 || markAllReadMutation.isPending}
          onClick={handleMarkAllRead}
        >
          <CheckCheck className="size-4" />
          {NOTIFICATION_UI_TEXT.markAllRead}
        </Button>
      </div>

      <NotificationList />
    </div>
  )
}
