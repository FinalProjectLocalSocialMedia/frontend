import { Link, useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PostSearchForm } from '@/features/post/components/post-search-form'
import { NearbyMiniMapCard } from '@/features/post/components/nearby-mini-map-card'
import { trending } from '@/lib/mock-nearby'
import { useUserLocation } from '@/features/map/hooks/use-user-location'
import { useQuery } from '@tanstack/react-query'
import { getPlaceFromGeoPoint } from '../api/google-map-api'
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
            <TabsTrigger value="nearby" className="px-4">Gần bạn</TabsTrigger>
            <TabsTrigger value="following" className="px-4">Đang theo dõi</TabsTrigger>
            <TabsTrigger value="trending" className="px-4">Xu hướng</TabsTrigger>
          </TabsList>

          <TabsContent value="nearby" className="mt-0">
            <NearbyFeed
              gpsPosition={gpsPosition}
              radiusKm={radiusKm}
              isLoadingGps={isLoadingGps}
              userLocation={userLocation}
              activeTab={activeTab}
            />
          </TabsContent>

          <TabsContent value="following" className="mt-0">
            <FollowingFeed
              activeTab={activeTab}
            />
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


