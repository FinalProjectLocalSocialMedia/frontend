import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Flame, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PostSearchForm } from '@/features/post/components/post-search-form'
import { NearbyMiniMapCard } from '@/features/post/components/nearby-mini-map-card'

import { useTrendingPostsQuery, useTrendingKeywordsQuery } from '@/features/post/api/trending-queries'
import { useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'
import { useUserLocation } from '@/features/map/hooks/use-user-location'
import { getPlaceFromGeoPoint } from '../api/google-map-api'
import { PostCard } from '../components/post-card'
import type { PostSearchItem } from '@/features/post/types/post'
import type { TrendingPostDto } from '../types/trending'


import { NearbyFeed } from '../components/nearby-feed'
import { FollowingFeed } from '../components/following-feed'
import { TrendingFeed } from '../components/trending-feed'

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
            <TrendingFeed
              trendingPostsQuery={trendingPostsQuery}
            />
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

