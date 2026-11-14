import { AlertCircle, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  useMarkReadMutation,
  useNotificationsInfiniteQuery,
} from '../api/notification-queries'
import { NOTIFICATION_UI_TEXT } from '../api/notification-text'
import { NotificationItem } from './notification-item'

function NotificationListSkeleton() {
  return (
    <div className="space-y-3" aria-label="Đang tải thông báo">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5"
        >
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function NotificationList() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotificationsInfiniteQuery()

  const markReadMutation = useMarkReadMutation()

  if (isLoading) {
    return <NotificationListSkeleton />
  }

  if (isError) {
    return (
      <Empty className="border border-border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle className="text-destructive" />
          </EmptyMedia>
          <EmptyTitle>{NOTIFICATION_UI_TEXT.loadError}</EmptyTitle>
        </EmptyHeader>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
          {NOTIFICATION_UI_TEXT.retry}
        </Button>
      </Empty>
    )
  }

  const items = data?.pages.flatMap((page) => page.items) ?? []

  if (items.length === 0) {
    return (
      <Empty className="border border-border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Bell />
          </EmptyMedia>
          <EmptyTitle>{NOTIFICATION_UI_TEXT.emptyTitle}</EmptyTitle>
          <EmptyDescription>{NOTIFICATION_UI_TEXT.emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkRead={(id) => markReadMutation.mutate(id)}
        />
      ))}

      {hasNextPage ? (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? (
              <>
                <Spinner className="size-4" />
                {NOTIFICATION_UI_TEXT.loadingMore}
              </>
            ) : (
              NOTIFICATION_UI_TEXT.loadMore
            )}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
