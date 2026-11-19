import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSearchPostsQuery, useSearchUsersQuery } from '@/features/post/api/search-queries'
import { PostSearchForm } from '@/features/post/components/post-search-form'
import { useInfiniteScroll } from '@/features/post/hooks/use-infinite-scroll'
import { PostSearchResults } from '../components/post-search-result'
import { useUserLocation } from '@/features/map/hooks/use-user-location'
import { UserSearchResults } from '../components/user-search-result'
import type { PostSearchItem } from '../types/post'
import type { SearchTab, UserSearchResponse } from '../types/search'

/**
 * Trang tìm kiếm (Post + User):
 * - Lấy `q` và `tab` trực tiếp từ URL (?q=&tab=posts|users), không đồng bộ bằng effect
 * - Tab Bài viết dùng useInfiniteQuery theo nextCursor
 * - Tab Người dùng dùng useInfiniteQuery theo nextCursor, chỉ enabled sau khi query bài viết isFetched
 */
export default function PostSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { gpsPosition } = useUserLocation({})
  const query = searchParams.get('q') ?? ''
  const rawTab = searchParams.get('tab')
  const activeTab: SearchTab = rawTab === 'users' ? 'users' : 'posts'

  const locationId = searchParams.get('locationId') ?? ''
  const locationName = searchParams.get('locationName') ?? ''
  const rawTopic = searchParams.get('topic') ?? ''
  const topic = rawTopic.replace(/^#/, '').trim()

  const hasContextFilter = Boolean(locationId || topic)
  const displayLocation = locationName.trim() || 'địa điểm đã chọn'
  const nearby_map_last_view = localStorage.getItem('nearby_map_last_view') 
  const radiusKm = nearby_map_last_view ? JSON.parse(nearby_map_last_view).radiusKm : 1;

  const postsSearch = useSearchPostsQuery({
    q: query,
    locationId: locationId || undefined,
    topic: topic || undefined,
    coordinates: gpsPosition ? { latitude: gpsPosition.latitude, longitude: gpsPosition.longitude } : undefined,
    radiusKm,
  })

  // Chỉ kích hoạt query người dùng sau khi query bài viết đã chạy xong (isFetched)
  const usersSearch = useSearchUsersQuery(query, postsSearch.isFetched)

  const handleBackToMap = () => {
    navigate(-1)
  }

  const handleClearFilters = () => {
    setSearchParams({})
  }

  const handleTabChange = (nextTab: string) => {
    const normalized: SearchTab = nextTab === 'users' ? 'users' : 'posts'
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', normalized)
    setSearchParams(nextParams)
  }

  const activeInfinite = activeTab === 'users' ? usersSearch : postsSearch
  const sentinelRef = useInfiniteScroll({
    enabled: !!activeInfinite.hasNextPage && !activeInfinite.isFetchingNextPage,
    onLoadMore: () => void activeInfinite.fetchNextPage(),
  })

  const posts: PostSearchItem[] =
    postsSearch.data?.pages
      .flatMap((page) => page.items)
      .map((post) => ({
        ...post,
        likeCount: post.likeCount ?? 0,
        commentCount: post.commentCount ?? 0,
      })) ?? []

  const users: UserSearchResponse[] =
    usersSearch.data?.pages.flatMap((page) => page.items) ?? []

  const renderContextHeading = () => {
    if (locationId && topic) {
      return (
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Những bài viết thuộc chủ đề <span className="text-primary">#{topic}</span> tại{' '}
          <span className="text-primary">{displayLocation}</span>
        </h1>
      )
    }
    if (locationId) {
      return (
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Những bài viết ở địa điểm <span className="text-primary">{displayLocation}</span>
        </h1>
      )
    }
    if (topic) {
      return (
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Những bài viết thuộc chủ đề <span className="text-primary">#{topic}</span>
        </h1>
      )
    }
    return null
  }

  const isWaitingUsersAfterPosts =
    Boolean(query.trim()) && !postsSearch.isFetched && usersSearch.isPending

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:py-8">
      <header className="mb-6">
        {hasContextFilter ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackToMap}
                className="-ml-2 cursor-pointer gap-1.5 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                <span>Quay lại bản đồ</span>
              </Button>

              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
                <span>Bỏ lọc</span>
              </button>
            </div>

            <div className="mt-1">{renderContextHeading()}</div>

            <div className="mt-2">
              <PostSearchForm />
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Khám phá
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Tìm kiếm</h1>
            <div className="mt-4">
              <PostSearchForm />
            </div>
          </>
        )}
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-col">
        <TabsList variant="line" className="mb-5 w-full border-t border-border pt-3">
          <TabsTrigger value="posts">Bài viết</TabsTrigger>
          <TabsTrigger value="users">Người dùng</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <PostSearchResults
            query={query}
            posts={posts}
            isPending={postsSearch.isPending}
            isError={postsSearch.isError}
            errorMessage={postsSearch.error?.message}
            hasData={!!postsSearch.data}
            hasNextPage={!!postsSearch.hasNextPage}
            isFetchingNextPage={postsSearch.isFetchingNextPage}
            isFetchNextPageError={postsSearch.isFetchNextPageError}
            onRetry={() => void postsSearch.refetch()}
            onFetchNextPage={() => void postsSearch.fetchNextPage()}
            hasFilter={hasContextFilter}
            emptyMessage={
              hasContextFilter ? 'Chưa có bài viết ở địa điểm/chủ đề này' : undefined
            }
          />
        </TabsContent>

        <TabsContent value="users">
          <UserSearchResults
            query={query}
            users={users}
            isPending={isWaitingUsersAfterPosts || (Boolean(query.trim()) && usersSearch.isPending)}
            isError={usersSearch.isError}
            errorMessage={usersSearch.error?.message}
            hasData={!!usersSearch.data}
            hasNextPage={!!usersSearch.hasNextPage}
            isFetchingNextPage={usersSearch.isFetchingNextPage}
            isFetchNextPageError={usersSearch.isFetchNextPageError}
            onRetry={() => void usersSearch.refetch()}
            onFetchNextPage={() => void usersSearch.fetchNextPage()}
          />
        </TabsContent>
      </Tabs>

      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
    </div>
  )
}
