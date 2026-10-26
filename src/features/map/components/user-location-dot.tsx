import { AdvancedMarker } from '@vis.gl/react-google-maps'
import type { GeoPoint } from '../lib/types'

export type UserLocationDotProps = {
  position: GeoPoint | null
}

export function UserLocationDot({ position }: UserLocationDotProps) {
  if (!position) return null

  return (
    <AdvancedMarker
      position={{ lat: position.latitude, lng: position.longitude }}
      title="Vị trí của bạn"
    >
      <div className="relative flex items-center justify-center">
        {/* Outer pulsating wave */}
        <span className="absolute size-8 animate-ping rounded-full bg-sky-400 opacity-60" />
        {/* Soft pulse glow */}
        <span className="absolute size-6 rounded-full bg-sky-500/30" />
        {/* Core solid blue GPS dot */}
        <span className="relative size-4 rounded-full border-2 border-white bg-sky-500 shadow-md ring-1 ring-sky-600/40" />
      </div>
    </AdvancedMarker>
  )
}
