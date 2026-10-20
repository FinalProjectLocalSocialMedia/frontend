import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Flame, Layers3, LocateFixed, MapPin, TrendingUp } from 'lucide-react'
import { MapView } from '@/components/explore/map-view'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { PostCard } from '@/features/post/components/PostCard'
import {
  currentLocation,
  defaultRadius,
  hotspots,
  radiusOptions,
  radiusPostLimit,
  trending,
} from '@/lib/mock-nearby'
import { currentUserId, usePosts } from '@/lib/posts-context'

export default function ExplorePage() {
  const { posts } = usePosts()
  const [radius, setRadius] = useState(defaultRadius)
  const [heatmap, setHeatmap] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const visiblePosts = useMemo(() => posts.slice(0, radiusPostLimit[radius]), [posts, radius])
  const selectedHotspot = hotspots.find((item) => item.id === selected)
  const selectedTrend = trending.find((item) => item.tag === selected)
  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/"
            className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Home feed
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Discover nearby
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Explore</h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm">
          <MapPin className="size-4 text-primary" /> {currentLocation.name}
          <Select
            value={radius}
            onValueChange={(value) => value && setRadius(value)}
            items={radiusOptions.map((item) => ({ value: item, label: item }))}
          >
            <SelectTrigger
              size="sm"
              aria-label="Search radius"
              className="border-0 bg-transparent font-semibold"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" alignItemWithTrigger={false}>
              {radiusOptions.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Live activity around your location</p>
            <Toggle
              variant="outline"
              size="sm"
              pressed={heatmap}
              onPressedChange={setHeatmap}
              className="rounded-full px-3 text-xs font-semibold aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90"
            >
              <Layers3 /> Heatmap {heatmap ? 'on' : 'off'}
            </Toggle>
          </div>
          <MapView
            radius={radius}
            heatmap={heatmap}
            selected={selected}
            setSelected={setSelected}
            zoom={zoom}
            setZoom={setZoom}
          />
          <div className="mt-5 rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold tracking-tight">
                  {selectedHotspot
                    ? `Activity around ${selectedHotspot.name}`
                    : selectedTrend
                      ? `${selectedTrend.tag} near you`
                      : 'Nearby posts'}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedTrend
                    ? `${selectedTrend.posts} related posts · most recent today`
                    : 'Posts from people in the places that matter.'}
                </p>
              </div>
              <LocateFixed className="size-4 text-primary" />
            </div>
            <div className="flex flex-col gap-4">
              {visiblePosts
                .filter(
                  (post) =>
                    !selectedTrend ||
                    post.content.includes(selectedTrend.tag) ||
                    selectedTrend.tag === '#TrafficJam',
                )
                .map((post) => (
                  <PostCard key={post.id} post={post} currentUserId={currentUserId} />
                ))}
            </div>
          </div>
        </section>
        <aside className="flex flex-col gap-5">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold tracking-tight">Trending near you</h2>
              <TrendingUp className="size-4 text-primary" />
            </div>
            <div className="flex flex-col gap-4">
              {trending.map((item, index) => (
                <button
                  key={item.tag}
                  onClick={() => setSelected(item.tag)}
                  className={`rounded-xl p-2 text-left transition-colors hover:bg-muted ${selected === item.tag ? 'bg-primary/10' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.tag}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.posts.toLocaleString()} posts · {item.location}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Flame className="size-4 text-orange-500" />
              <h2 className="font-semibold tracking-tight">Hot areas</h2>
            </div>
            <div className="flex flex-col gap-3">
              {hotspots.map((spot) => (
                <button
                  key={spot.id}
                  onClick={() => setSelected(spot.id)}
                  className="flex items-center justify-between rounded-xl p-2 text-left hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-semibold">{spot.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{spot.activity}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary">{spot.posts}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
