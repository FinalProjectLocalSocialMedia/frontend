import { Link, useSearchParams } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCreatePost } from '@/components/layout/create-post-context'
import { PostCard } from '@/features/post/components/post-card'
import { PostSearchForm } from '@/features/post/components/post-search-form'
import { NearbyMiniMapCard } from '@/features/post/components/nearby-mini-map-card'
import { postKeys, useFeedPosts, useLatestFeedPosts } from '@/features/post/api/post-queries'
import { useInfiniteScroll } from '@/features/post/hooks/use-infinite-scroll'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'
import { trending } from '@/lib/mock-nearby'
import { useUserLocation } from '@/features/map/hooks/use-user-location'
import { useQuery } from '@tanstack/react-query'
import { getPlaceFromGeoPoint } from '../api/google-map-api'
import { useFeedSSE } from '../hooks/use-feed-sse'
import type { PostCursorPage } from '@/features/post/types/post'
import { useEffect, useState } from 'react'

type FeedTab = 'nearby' | 'following' | 'trending'

function parseFeedTab(raw: string | null): FeedTab {
  if (raw === 'following' || raw === 'trending') return raw
  return 'nearby'
}

export default function HomeFeed() {
  const openCreate = useCreatePost()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = parseFeedTab(searchParams.get('tab'))

  const { gpsPosition, isLoadingGps } = useUserLocation({})
  const userLocation = useQuery({
    queryKey: ['user-location', gpsPosition?.latitude, gpsPosition?.longitude],
    queryFn: async () => {
      if (!gpsPosition) return null
      return getPlaceFromGeoPoint(gpsPosition)
    },
    enabled: !!gpsPosition,
  })

  const nearby_map_last_view =
    typeof window !== 'undefined' ? localStorage.getItem('nearby_map_last_view') : null
  const radiusKm = nearby_map_last_view ? JSON.parse(nearby_map_last_view).radiusKm : 1

  const [lastSeen, setLastSeen] = useState<{ id?: string; createdAt?: string } | undefined>(undefined)

  const feed = useFeedPosts(
    gpsPosition ? { latitude: gpsPosition.latitude, longitude: gpsPosition.longitude } : undefined,
    radiusKm,
    lastSeen,
  )
  const latestFeed = useLatestFeedPosts(
    gpsPosition ? { latitude: gpsPosition.latitude, longitude: gpsPosition.longitude } : undefined,
    radiusKm,
    lastSeen,
  )
  const queryClient = useQueryClient()
  const { hasNewPosts, clearNewPosts } = useFeedSSE()

  const sentinelRef = useInfiniteScroll({
    enabled: activeTab === 'nearby' && !!feed.hasNextPage && !feed.isFetchingNextPage,
    onLoadMore: () => void feed.fetchNextPage(),
  })
  const posts = feed.data?.pages.flatMap((page) => page.items) ?? []

  const handleTabChange = (nextValue: string) => {
    const tab = parseFeedTab(nextValue)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (tab === 'nearby') {
          next.delete('tab')
        } else {
          next.set('tab', tab)
        }
        return next
      },
      { replace: true },
    )
  }

  useEffect(() => {
    if (!posts.length || lastSeen) return

    const firstPost = posts[0]

    setLastSeen({
      id: firstPost.id,
      createdAt: firstPost.createdAt,
    })
  }, [posts, lastSeen])

  console.log('lastSeen:', lastSeen)

  const mergeLatestPosts = (data: InfiniteData<PostCursorPage, unknown>) => {
    const latestItems = data.pages.flatMap((page) => page.items)
    const newestPost = latestItems[0]

    queryClient.setQueryData<InfiniteData<PostCursorPage, string | undefined>>(
      postKeys.feed(),
      (current) => mergeLatestFeed(current, data.pages),
    )
    if (newestPost) {
      setLastSeen({
        id: newestPost.id,
        createdAt: newestPost.createdAt,
      })
    }
  }

  const handleLoadLatest = async () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })

    const result = await latestFeed.refetch()
    if (result.data) {
      mergeLatestPosts(result.data)
      clearNewPosts()
    }
  }

  const handleLoadMoreLatest = async () => {
    const result = await latestFeed.fetchNextPage()
    if (result.data) {
      mergeLatestPosts(result.data)
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-10 lg:py-8">
      <section>
        <header className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bảng tin</h1>
        </header>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col">
          <TabsList className="mb-5 h-10 w-full sm:w-fit">
            <TabsTrigger value="nearby" className="px-4">Gần bạn</TabsTrigger>
            <TabsTrigger value="following" className="px-4">Đang theo dõi</TabsTrigger>
            <TabsTrigger value="trending" className="px-4">Xu hướng</TabsTrigger>
          </TabsList>

          <TabsContent value="nearby" className="mt-0">
            <button
              type="button"
              onClick={openCreate}
              className="w-full rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.02] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <p className="text-sm font-medium text-muted-foreground">Có gì đang diễn ra quanh bạn?</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                <MapPin className="size-5 text-primary" />
                {userLocation.isLoading || isLoadingGps ? (
                  <span>Đang tải...</span>
                ) : (
                  userLocation.data?.placeName ?? userLocation.data?.formattedAddress
                )}
              </div>
            </button>

            {(hasNewPosts&& latestFeed.hasNextPage) && (
              <div className="sticky top-2 z-20 mt-5 flex justify-center">
                <Button
                  size="sm"
                  onClick={() => void handleLoadLatest()}
                  disabled={latestFeed.isFetching}
                  className="rounded-full shadow-md"
                >
                  {latestFeed.isFetching ? (
                    <>
                      <Spinner /> Đang tải bài mới...
                    </>
                  ) : (
                    'Có bài viết mới'
                  )}
                </Button>
              </div>
            )}
            {latestFeed.hasNextPage && (
              <Button
                variant="outline"
                onClick={() => void handleLoadMoreLatest()}
                disabled={latestFeed.isFetchingNextPage}
                className="self-center"
              >
                {latestFeed.isFetchingNextPage ? (
                  <>
                    <Spinner /> Đang tải bài mới...
                  </>
                ) : latestFeed.isFetchNextPageError ? (
                  'Thử tải lại bài mới'
                ) : (
                  'Xem thêm bài mới'
                )}
              </Button>
            )}

            <div className="mt-5 flex flex-col gap-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={{
                    ...post,
                    likeCount: post.likeCount ?? 0,
                    commentCount: post.commentCount ?? 0,
                  }}
                />
              ))}

              {feed.isPending && (
                <div role="status" className="flex justify-center py-12">
                  <Spinner />
                  <span className="sr-only">Đang tải bảng tin</span>
                </div>
              )}

              {feed.isError && !feed.data && (
                <div role="alert" className="rounded-2xl border border-destructive/30 bg-card p-5">
                  <p className="text-sm text-destructive">{feed.error.message}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => void feed.refetch()}
                  >
                    Thử lại
                  </Button>
                </div>
              )}

              {!feed.isPending && !feed.isError && posts.length === 0 && (
                <p className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
                  Chưa có bài viết nào quanh đây.
                </p>
              )}

              {feed.isFetchNextPageError && (
                <p role="alert" className="text-center text-sm text-destructive">
                  Không thể tải thêm bài viết. Vui lòng thử lại.
                </p>
              )}



              {feed.hasNextPage && (
                <Button
                  variant="outline"
                  onClick={() => void feed.fetchNextPage()}
                  disabled={feed.isFetchingNextPage}
                  className="self-center"
                >
                  {feed.isFetchingNextPage ? (
                    <>
                      <Spinner /> Đang tải thêm...
                    </>
                  ) : feed.isFetchNextPageError ? (
                    'Thử tải lại'
                  ) : (
                    'Xem thêm'
                  )}
                </Button>
              )}
              <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
            </div>
          </TabsContent>

          <TabsContent value="following" className="mt-0">
            <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                Bảng tin từ những người bạn đang theo dõi
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Tính năng đang chờ kết nối API bảng tin Đang theo dõi từ máy chủ.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="trending" className="mt-0">
            <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                Bài viết đang xu hướng nổi bật
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Tính năng đang chờ kết nối API bảng tin Xu hướng từ máy chủ.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <aside className="hidden flex-col gap-5 lg:flex lg:pt-[76px]">
        <PostSearchForm />
        <NearbyMiniMapCard gpsPosition={gpsPosition} />
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-5 font-semibold">Xu hướng gần bạn</h2>
          {trending.map((item) => (
            <Link key={item.tag} to="/explore" className="mb-4 block text-left">
              <p className="text-sm font-semibold">{item.tag}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.posts.toLocaleString()} bài viết · {item.location}
              </p>
            </Link>
          ))}
        </section>
      </aside>
    </div>
  )
}


export function mergeLatestFeed(
  current: InfiniteData<PostCursorPage, string | undefined> | undefined,
  latestPages: PostCursorPage[],
): InfiniteData<PostCursorPage, string | undefined> {
  const latestItems = latestPages.flatMap((page) => page.items)
  const seen = new Set<string>()
  const uniqueLatestItems = latestItems.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })

  if (!current?.pages.length) {
    return {
      pages: [
        {
          items: uniqueLatestItems,
          page: { nextCursor: null, hasMore: false },
        },
      ],
      pageParams: [undefined],
    }
  }

  const existingIds = new Set(current.pages.flatMap((page) => page.items.map((item) => item.id)))
  const newItems = uniqueLatestItems.filter((item) => !existingIds.has(item.id))

  return {
    ...current,
    pages: [
      {
        ...current.pages[0],
        items: [...newItems, ...current.pages[0].items],
      },
      ...current.pages.slice(1),
    ],
  }
}