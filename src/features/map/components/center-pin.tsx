import { AdvancedMarker } from '@vis.gl/react-google-maps'
import { MapPin } from 'lucide-react'
import type { GeoPoint } from '../lib/types'

export type CenterPinProps = {
  position: GeoPoint
  label?: string
}

export function CenterPin({ position, label = 'Tâm khu vực' }: CenterPinProps) {
  return (
    <AdvancedMarker
      position={{ lat: position.latitude, lng: position.longitude }}
      title={label}
    >
      <div className="flex flex-col items-center -translate-y-1/2">
        <div className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110">
          <MapPin className="size-5 fill-primary-foreground" />
        </div>
        <div className="mt-1 whitespace-nowrap rounded-full border border-border/80 bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
          {label}
        </div>
      </div>
    </AdvancedMarker>
  )
}
