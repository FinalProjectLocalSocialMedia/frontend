import { GoogleMapsProvider } from '@/components/map/google-maps-provider'
import { BaseMap } from '@/components/map/base-map'

/**
 * Phase 0 minimal ExplorePage:
 * - Lazy loaded
 * - Full-height map container
 * - Pre-warmed with GoogleMapsProvider & BaseMap
 */
export default function ExplorePage() {
  return (
    <div className="relative size-full h-[calc(100dvh-var(--bottom-nav-h))] bg-[#e5e3df]">
      <GoogleMapsProvider>
        <BaseMap className="size-full" />
      </GoogleMapsProvider>
    </div>
  )
}
