import { Flame, MapPin, RotateCcw, TrendingUp, ZoomIn, ZoomOut } from 'lucide-react'
import { activitySpots, hotspots, radiusScale, trending } from '@/lib/mock-nearby'

export function MapView({
  radius,
  heatmap,
  selected,
  setSelected,
  zoom,
  setZoom,
}: {
  radius: string
  heatmap: boolean
  selected: string | null
  setSelected: (value: string | null) => void
  zoom: number
  setZoom: (value: number) => void
}) {
  const scale = radiusScale[radius]
  return (
    <div className="relative min-h-[470px] overflow-hidden force-light rounded-2xl border border-border bg-[#edf2ef] text-foreground shadow-inner">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(30deg, transparent 48%, rgba(111,133,125,.18) 49%, transparent 51%), linear-gradient(120deg, transparent 48%, rgba(111,133,125,.14) 49%, transparent 51%)',
          backgroundSize: '86px 86px',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(255,255,255,.28)_75%)]" />
      {heatmap &&
        activitySpots.map((spot) => (
          <div
            key={`${spot.x}-${spot.y}`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl ${spot.color}`}
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: spot.size * zoom,
              height: spot.size * zoom,
            }}
          />
        ))}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/35 bg-primary/10"
        style={{ width: scale * zoom, height: scale * zoom }}
      />
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="flex size-12 items-center justify-center rounded-full border-4 border-white bg-primary text-primary-foreground shadow-lg">
          <MapPin className="size-5" />
        </div>
        <div className="mt-2 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold shadow-sm">
          You are here
        </div>
      </div>
      {hotspots.map((spot) => (
        <button
          key={spot.id}
          onClick={() => setSelected(spot.id)}
          aria-label={`Focus ${spot.name}`}
          className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white px-2 py-1 text-[10px] font-bold shadow-md transition-transform hover:scale-110 ${spot.level === 'high' ? 'bg-orange-500 text-white' : spot.level === 'medium' ? 'bg-amber-400 text-amber-950' : 'bg-sky-500 text-white'}`}
          style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
        >
          <Flame className="mr-1 inline size-3" />
          {spot.name}
        </button>
      ))}
      {trending.map((item) => (
        <button
          key={item.tag}
          onClick={() => setSelected(item.tag)}
          className="absolute z-10 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-white text-primary shadow-md hover:scale-110"
          style={{ left: `${item.marker.x}%`, top: `${item.marker.y}%` }}
          aria-label={`Show ${item.tag}`}
        >
          <TrendingUp className="size-4" />
        </button>
      ))}
      <div className="absolute bottom-4 left-4 rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-[11px] shadow-sm">
        <p className="mb-1 font-semibold">Social activity</p>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-20 rounded-full bg-gradient-to-r from-sky-300 via-amber-300 to-orange-500" />
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
      <div className="absolute right-4 top-4 flex flex-col gap-1 rounded-xl border border-border bg-white/90 p-1 shadow-sm">
        <button
          onClick={() => setZoom(Math.min(1.35, zoom + 0.1))}
          className="flex size-8 items-center justify-center rounded-lg hover:bg-muted"
          aria-label="Zoom in"
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          onClick={() => setZoom(Math.max(0.8, zoom - 0.1))}
          className="flex size-8 items-center justify-center rounded-lg hover:bg-muted"
          aria-label="Zoom out"
        >
          <ZoomOut className="size-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1)
            setSelected(null)
          }}
          className="flex size-8 items-center justify-center rounded-lg hover:bg-muted"
          aria-label="Reset map"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>
    </div>
  )
}
