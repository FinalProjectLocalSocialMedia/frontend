import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Flame, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PostSearchForm } from '@/features/post/components/post-search-form'
import { NearbyMiniMapCard } from '@/features/post/components/nearby-mini-map-card'
import { postKeys, useFeedPosts, useLatestFeedPosts } from '@/features/post/api/post-queries'
import { useTrendingPostsQuery, useTrendingKeywordsQuery } from '@/features/post/api/trending-queries'
import { useInfiniteScroll } from '@/features/post/hooks/use-infinite-scroll'
import { useQueryClient, type InfiniteData, useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'
import { useUserLocation } from '@/features/map/hooks/use-user-location'
import { getPlaceFromGeoPoint } from '../api/google-map-api'
import { PostCard } from '../components/post-card'
import { useFeedSSE } from '../hooks/use-feed-sse'
import type { PostCursorPage, PostSearchItem } from '@/features/post/types/post'
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
import { NearbyFeed } from '../components/nearby-feed'
import { FollowingFeed } from '../components/following-feed'

type FeedTab = 'nearby' | 'following' | 'trending'

function parseFeedTab(raw: string | null): FeedTab {
  if (raw === 'following' || raw === 'trending') return raw
  return 'nearby'
}

export default function HomeFeed() {
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


  const trendingPostsQuery = useTrendingPostsQuery(undefined, activeTab === 'trending')
  const trendingKeywordsQuery = useTrendingKeywordsQuery({ limit: 8 })


  const trendingPosts = useMemo(() => {
    return (trendingPostsQuery.data ?? []).map(mapTrendingDtoToPostSearchItem)
  }, [trendingPostsQuery.data])


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



  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-10 lg:py-8">
      <section>
        <header className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bảng tin</h1>
        </header>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col">
          <TabsList className="mb-5 h-10 w-full sm:w-fit">
            <TabsTrigger value="nearby" className="flex items-center gap-1.5 px-4">
              <MapPin className="size-4" />
              Gần bạn
            </TabsTrigger>
            <TabsTrigger value="following" className="px-4">Đang theo dõi</TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-1.5 px-4">
              <Flame className="size-4 text-orange-500" />
              Thịnh hành 🔥
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: GẦN BẠN */}
          <TabsContent value="nearby" className="mt-0">
            <NearbyFeed
              gpsPosition={gpsPosition}
              radiusKm={radiusKm}
              isLoadingGps={isLoadingGps}
              userLocation={userLocation}
              activeTab={activeTab}
            />
          </TabsContent>

          {/* TAB 2: ĐANG THEO DÕI */}
          <TabsContent value="following" className="mt-0">
            <FollowingFeed
              activeTab={activeTab}
            />
          </TabsContent>

          {/* TAB 3: THỊNH HÀNH (TRENDING REDIS) */}
          <TabsContent value="trending" className="mt-0 flex flex-col gap-4">
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
        <NearbyMiniMapCard gpsPosition={gpsPosition} />
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

