import { createContext, useContext, type ReactNode } from 'react'
import type { GeoPoint, LatLngBounds, MapViewState } from './map-types'

export type MapContextValue = {
  map: google.maps.Map | null
  viewport: MapViewState | null
  renderingType?: string
  flyTo: (target: GeoPoint, zoom?: number) => void
  fitBounds: (bounds: LatLngBounds, padding?: number | google.maps.Padding) => void
  setMap: (map: google.maps.Map | null) => void
  setViewport: (viewport: MapViewState) => void
}

const MapContext = createContext<MapContextValue | null>(null)

export function useMapContext(): MapContextValue {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('useMapContext must be used within a MapContextProvider (e.g. BaseMap)')
  }
  return context
}

export type MapContextProviderProps = {
  value: MapContextValue
  children: ReactNode
}

export function MapContextProvider({ value, children }: MapContextProviderProps) {
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}
