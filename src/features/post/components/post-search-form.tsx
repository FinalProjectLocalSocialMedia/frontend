import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useUserSuggestQuery } from '@/features/post/api/search-queries'
import { UserAvatar } from '@/features/post/components/user-avatar'
import { cn } from '@/lib/utils'

const MAX_SUGGESTIONS = 6

export function PostSearchForm() {
  const location = useLocation()
  const currentQuery = new URLSearchParams(location.search).get('q') ?? ''

  // Key theo URL query để đồng bộ lại input khi điều hướng mà không cần useEffect (React Compiler)
  return <PostSearchFormInner key={currentQuery} initialQuery={currentQuery} />
}

function PostSearchFormInner({ initialQuery }: { initialQuery: string }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(initialQuery)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const trimmedQuery = query.trim()
  const debouncedQuery = useDebouncedValue(trimmedQuery, 300)
  const suggestQuery = useUserSuggestQuery(debouncedQuery)
  const users = (suggestQuery.data ?? []).slice(0, MAX_SUGGESTIONS)

  const totalOptions = trimmedQuery ? 1 + users.length : 0
  const safeActiveIndex =
    totalOptions > 0 ? Math.min(activeIndex, totalOptions - 1) : 0

  const navigateToPostSearch = (term: string) => {
    const clean = term.trim()
    if (!clean) return
    setIsOpen(false)
    navigate(`/search?q=${encodeURIComponent(clean)}&tab=posts`)
  }

  const navigateToProfile = (userId: string) => {
    setIsOpen(false)
    navigate(`/profile/${encodeURIComponent(userId)}`)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      if (isOpen) {
        event.preventDefault()
        setIsOpen(false)
        setActiveIndex(0)
      }
      return
    }

    if (!trimmedQuery) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setActiveIndex(0)
      } else if (totalOptions > 0) {
        setActiveIndex((prev) => (prev + 1) % totalOptions)
      }
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (isOpen && totalOptions > 0) {
        setActiveIndex((prev) => (prev - 1 + totalOptions) % totalOptions)
      }
      return
    }

    if (event.key === 'Enter' && isOpen && safeActiveIndex > 0) {
      const selectedUser = users[safeActiveIndex - 1]
      if (selectedUser) {
        event.preventDefault()
        navigateToProfile(selectedUser.id)
      }
    }
  }

  return (
    <Popover
      open={isOpen && trimmedQuery.length > 0}
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen)
        if (!nextOpen) {
          setActiveIndex(0)
        }
      }}
    >
      <PopoverTrigger nativeButton={false} render={<div className="w-full" />}>
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            navigateToPostSearch(query)
          }}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
        >
          <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <Input
            type="search"
            role="combobox"
            aria-expanded={isOpen && trimmedQuery.length > 0}
            aria-controls="home-search-suggestions"
            aria-autocomplete="list"
            aria-label="Tìm kiếm bài viết và người dùng"
            placeholder="Tìm kiếm bài viết, người dùng..."
            value={query}
            onFocus={() => {
              if (trimmedQuery.length > 0) {
                setIsOpen(true)
              }
            }}
            onChange={(event) => {
              const nextValue = event.target.value
              setQuery(nextValue)
              setActiveIndex(0)
              setIsOpen(nextValue.trim().length > 0)
            }}
            onKeyDown={handleKeyDown}
            className="h-7 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          {query.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Xóa từ khóa tìm kiếm"
              onClick={() => {
                setQuery('')
                setActiveIndex(0)
                setIsOpen(false)
              }}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </form>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        initialFocus={false}
        finalFocus={false}
        className="w-(--anchor-width) p-1.5"
      >
        <div
          id="home-search-suggestions"
          role="listbox"
          aria-label="Gợi ý tìm kiếm"
          className="flex flex-col gap-0.5"
        >
          <button
            type="button"
            role="option"
            aria-selected={safeActiveIndex === 0}
            onMouseEnter={() => setActiveIndex(0)}
            onClick={() => navigateToPostSearch(trimmedQuery)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
              safeActiveIndex === 0
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground hover:bg-accent/60',
            )}
          >
            <Search aria-hidden="true" className="size-4 shrink-0 text-primary" />
            <span className="truncate font-medium">
              Tìm bài viết cho &ldquo;{trimmedQuery}&rdquo;
            </span>
          </button>

          {debouncedQuery.length >= 2 && suggestQuery.isFetching && users.length === 0 && (
            <div className="flex items-center gap-2 px-2.5 py-2 text-xs text-muted-foreground">
              <Spinner className="size-3.5" />
              <span>Đang gợi ý người dùng...</span>
            </div>
          )}

          {users.length > 0 && (
            <div className="mt-1 border-t border-border pt-1">
              <p className="px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                Người dùng
              </p>
              {users.map((user, idx) => {
                const optionIndex = idx + 1
                const isSelected = safeActiveIndex === optionIndex
                return (
                  <button
                    key={user.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(optionIndex)}
                    onClick={() => navigateToProfile(user.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
                      isSelected
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground hover:bg-accent/60',
                    )}
                  >
                    <UserAvatar user={user} />
                    <span className="truncate font-medium">{user.fullName}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
