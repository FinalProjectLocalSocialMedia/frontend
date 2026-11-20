import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { UserAvatar } from '@/features/post/components/user-avatar'
import type { UserSearchResponse } from '../types/search'

type UserSearchResultsProps = {
  query: string
  users: UserSearchResponse[]
  isPending: boolean
  isError: boolean
  errorMessage?: string
  hasData: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  onRetry: () => void
  onFetchNextPage: () => void
}

export function UserSearchResults({
  query,
  users,
  isPending,
  isError,
  errorMessage,
  hasData,
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  onRetry,
  onFetchNextPage,
}: UserSearchResultsProps) {
  if (!query.trim()) {
    return (
      <p className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
        Nhập từ khóa để tìm kiếm người dùng.
      </p>
    )
  }

  if (isPending) {
    return (
      <div role="status" className="flex justify-center py-12">
        <Spinner />
        <span className="sr-only">Đang tìm kiếm người dùng</span>
      </div>
    )
  }

  if (isError && !hasData) {
    return (
      <div role="alert" className="rounded-2xl border border-destructive/30 bg-card p-5">
        <p className="text-sm text-destructive">{errorMessage || 'Không thể tìm kiếm người dùng.'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Thử lại
        </Button>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card px-5 py-12 text-center">
        <Users aria-hidden="true" className="mx-auto size-5 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">Không tìm thấy người dùng</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Hãy thử tìm kiếm bằng tên hoặc từ khóa khác.
        </p>
      </div>
    )
  }

  return (
    <section
      aria-label={`Kết quả người dùng cho "${query}"`}
      className="flex flex-col gap-3"
    >
      {users.map((user) => (
        <Link
          key={user.id}
          to={`/profile/${encodeURIComponent(user.id)}`}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
        >
          <UserAvatar user={user} />
          <span className="truncate text-sm font-semibold text-foreground">{user.fullName}</span>
        </Link>
      ))}

      {isFetchNextPageError && (
        <p role="alert" className="text-center text-sm text-destructive">
          Không thể tải thêm người dùng. Vui lòng thử lại.
        </p>
      )}

      {hasNextPage && (
        <Button
          variant="outline"
          onClick={onFetchNextPage}
          disabled={isFetchingNextPage}
          className="self-center"
        >
          {isFetchingNextPage ? (
            <>
              <Spinner /> Đang tải thêm...
            </>
          ) : isFetchNextPageError ? (
            'Thử tải lại'
          ) : (
            'Xem thêm'
          )}
        </Button>
      )}
    </section>
  )
}
