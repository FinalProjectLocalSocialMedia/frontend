import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Flame, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCreatePost } from '@/components/layout/create-post-context'
import { PostCard } from '@/features/post/components/post-card'
import { PostSearchForm } from '@/features/post/components/post-search-form'
import { useFeedPosts } from '@/features/post/api/post-queries'
import { useTrendingPostsQuery, useTrendingKeywordsQuery } from '@/features/post/api/trending-queries'
import { useInfiniteScroll } from '@/features/post/hooks/use-infinite-scroll'
import { Spinner } from '@/components/ui/spinner'
import { useUserLocation } from '@/features/map/hooks/use-user-location'
import { useQuery } from '@tanstack/react-query'
import { getPlaceFromGeoPoint } from '../api/google-map-api'
import type { PostSearchItem } from '../types/post'
import type { TrendingPostDto } from '../types/trending'

function mapTrendingDtoToPostSearchItem(dto: TrendingPostDto): PostSearchItem {
  let media = null
  if (dto.mediaJson) {
    try {
      media = JSON.parse(dto.mediaJson)
    } catch {
      media = null
    }
  }

  return {
    id: dto.postId,
    author: {
      id: dto.authorId || '',
      fullName: dto.authorName || 'Người dùng',
      avatarUrl: dto.authorAvatarUrl,
    },
    content: dto.content || '',
    media,
    location: dto.locationName ? { name: dto.locationName } : null,
    status: 'ACTIVE',
    likeCount: Math.round(dto.score || 0),
    commentCount: 0,
    createdAt: dto.createdAt || new Date().toISOString(),
  }
}

export default function HomeFeed() {
  const openCreate = useCreatePost()
  const [activeTab, setActiveTab] = useState<string>('local')
  const { gpsPosition, isLoadingGps } = useUserLocation({})

  const userLocation = useQuery({
    queryKey: ['user-location', gpsPosition?.latitude, gpsPosition?.longitude],
    queryFn: async () => {
      if (!gpsPosition) {
        return null
      }
      return getPlaceFromGeoPoint(gpsPosition)
    },
    enabled: !!gpsPosition,
  })

  const nearby_map_last_view = localStorage.getItem('nearby_map_last_view')
  const radiusKm = nearby_map_last_view ? JSON.parse(nearby_map_last_view).radiusKm : 1
  const feed = useFeedPosts(
    gpsPosition ? { latitude: gpsPosition.latitude, longitude: gpsPosition.longitude } : undefined,
    radiusKm,
  )

  const trendingPostsQuery = useTrendingPostsQuery(undefined, activeTab === 'trending')
  const trendingKeywordsQuery = useTrendingKeywordsQuery({ limit: 8 })

  const sentinelRef = useInfiniteScroll({
    enabled: activeTab === 'local' && !!feed.hasNextPage && !feed.isFetchingNextPage,
    onLoadMore: () => void feed.fetchNextPage(),
  })

  const localPosts = feed.data?.pages.flatMap((page) => page.items) ?? []

  const trendingPosts = useMemo(() => {
    return (trendingPostsQuery.data ?? []).map(mapTrendingDtoToPostSearchItem)
  }, [trendingPostsQuery.data])

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-10 lg:py-8">
      <section>
        <header className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Nhịp sống quanh bạn
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Bảng tin</h1>
        </header>

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 flex-col">
          <TabsList variant="line" className="w-full justify-start border-b border-border pb-px">
            <TabsTrigger value="local" className="flex items-center gap-1.5 font-medium">
              <MapPin className="size-4" />
              Gần bạn
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-1.5 font-medium">
              <Flame className="size-4 text-orange-500" />
              Thịnh hành 🔥
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BÀI VIẾT GẦN ĐÂY */}
          <TabsContent value="local" className="mt-5 flex flex-col gap-4">
            {localPosts.map((post) => (
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

            {!feed.isPending && !feed.isError && localPosts.length === 0 && (
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
          </TabsContent>

          {/* TAB 2: BÀI VIẾT THỊNH HÀNH (TRENDING REDIS) */}
          <TabsContent value="trending" className="mt-5 flex flex-col gap-4">
            {trendingPostsQuery.isPending && (
              <div role="status" className="flex justify-center py-12">
                <Spinner />
                <span className="sr-only">Đang tải bài viết thịnh hành</span>
              </div>
            )}

            {trendingPostsQuery.isError && (
              <div role="alert" className="rounded-2xl border border-destructive/30 bg-card p-5">
                <p className="text-sm text-destructive">
                  {trendingPostsQuery.error?.message || 'Không thể tải danh sách thịnh hành.'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => void trendingPostsQuery.refetch()}
                >
                  Thử lại
                </Button>
              </div>
            )}

            {!trendingPostsQuery.isPending &&
              !trendingPostsQuery.isError &&
              trendingPosts.length === 0 && (
                <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
                  <Flame className="mx-auto mb-2 size-8 text-orange-500/60" />
                  <p className="font-medium text-foreground">Chưa có bài viết thịnh hành nào.</p>
                  <p className="mt-1 text-xs">
                    Hãy bấm Like hoặc tạo bài viết mới để hệ thống tính điểm Trending theo thời gian thực!
                  </p>
                </div>
              )}

            {trendingPosts.map((post, index) => (
              <div key={post.id} className="relative flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 px-1 text-xs font-semibold text-orange-500">
                  <Flame className="size-3.5 fill-orange-500" />
                  <span>
                    Top #{index + 1} Thịnh hành · {post.likeCount} điểm tương tác
                  </span>
                </div>
                <PostCard post={post} />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </section>

      <aside className="hidden flex-col gap-5 lg:flex lg:pt-[76px]">
        <PostSearchForm />

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Xu hướng nổi bật</h2>
            <Flame className="size-4 text-orange-500" />
          </div>

          {trendingKeywordsQuery.isLoading && (
            <div className="flex justify-center py-6">
              <Spinner className="size-5" />
            </div>
          )}

          {trendingKeywordsQuery.isError && (
            <p className="text-xs text-muted-foreground">Không thể tải xu hướng.</p>
          )}

          {!trendingKeywordsQuery.isLoading &&
            !trendingKeywordsQuery.isError &&
            (trendingKeywordsQuery.data?.length ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground">Chưa có từ khóa xu hướng nào.</p>
            )}

          {trendingKeywordsQuery.data?.map((item) => {
            const displayTag = item.keyword.startsWith('#') ? item.keyword : `#${item.keyword}`
            return (
              <Link
                key={item.keyword}
                to={`/search?q=${encodeURIComponent(item.keyword)}`}
                className="mb-3 block rounded-lg p-2 text-left transition-colors hover:bg-muted/50"
              >
                <p className="text-sm font-semibold hover:text-primary">{displayTag}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.score > 0 ? `${item.score.toFixed(1)} điểm tương tác` : 'Mới nổi'}
                </p>
              </Link>
            )
          })}
        </section>
      </aside>
    </div>
  )
}
