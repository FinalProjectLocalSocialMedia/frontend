import { useState, useEffect, type ReactNode } from 'react'
import { Map, useMap } from '@vis.gl/react-google-maps'
import { VITE_GOOGLE_MAPS_ID } from '@/config/env'
import { useForceLight } from '@/components/theme-provider'
import { MapContextProvider, type MapContextValue } from './map-context'
import { DeckOverlay } from './deck-overlay'
import type { GeoPoint, LatLngBounds, MapViewState } from './map-types'

export type BaseMapProps = {
  center?: GeoPoint
  zoom?: number
  minZoom?: number
  maxZoom?: number
  mapId?: string
  className?: string
  children?: ReactNode
  onIdle?: (viewport: MapViewState) => void
  onMapClick?: (event: google.maps.MapMouseEvent) => void
}

const DEFAULT_CENTER: GeoPoint = { latitude: 21.0285, longitude: 105.8542 } // Toạ độ mặc định (Hà Nội)
const DEFAULT_ZOOM = 13
const MIN_ZOOM = 9
const MAX_ZOOM = 19

/** Bộ đồng bộ nội bộ để nắm giữ instance google.maps.Map và lắng nghe sự kiện idle */
function MapSynchronizer({
  onMapReady,
  onIdleChange,
  onMapClick,
}: {
  onMapReady: (map: google.maps.Map | null) => void
  onIdleChange: (viewport: MapViewState) => void
  onMapClick?: (event: google.maps.MapMouseEvent) => void
}) {
  const map = useMap()

  useEffect(() => {
    onMapReady(map)
  }, [map, onMapReady])

  useEffect(() => {
    if (!map) return

    const idleListener = map.addListener('idle', () => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      const bounds = map.getBounds()

      if (!center || zoom === undefined || !bounds) return

      const ne = bounds.getNorthEast()
      const sw = bounds.getSouthWest()

      const viewport: MapViewState = {
        center: { latitude: center.lat(), longitude: center.lng() },
        zoom,
        bounds: {
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng(),
        },
      }
      onIdleChange(viewport)
    })

    const clickListener = onMapClick
      ? map.addListener('click', (e: google.maps.MapMouseEvent) => onMapClick(e))
      : null

    return () => {
      google.maps.event.removeListener(idleListener)
      if (clickListener) {
        google.maps.event.removeListener(clickListener)
      }
    }
  }, [map, onIdleChange, onMapClick])

  return null
}

/**
 * Component vỏ bọc Google Map cơ sở (BaseMap).
 * - Ép buộc giao diện sáng thông qua useForceLight()
 * - Khởi tạo với vector mapId (Cloud styling)
 * - Chỉ cập nhật React state của camera duy nhất khi xảy ra sự kiện 'idle'
 * - Tích hợp duy nhất một DeckOverlay cho các lớp deck.gl
 */
export function BaseMap({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM,
  mapId = VITE_GOOGLE_MAPS_ID,
  className = 'w-full h-full min-h-[400px]',
  children,
  onIdle,
  onMapClick,
}: BaseMapProps) {
  useForceLight()

  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const [viewport, setViewport] = useState<MapViewState | null>(null)

  const handleIdle = (nextViewport: MapViewState) => {
    setViewport(nextViewport)
    onIdle?.(nextViewport)
  }

  const flyTo = (target: GeoPoint, targetZoom?: number) => {
    if (!mapInstance) return
    mapInstance.panTo({ lat: target.latitude, lng: target.longitude })
    if (targetZoom !== undefined) {
      mapInstance.setZoom(targetZoom)
    }
  }

  const fitBounds = (bounds: LatLngBounds, padding?: number | google.maps.Padding) => {
    if (!mapInstance) return
    const googleBounds = new google.maps.LatLngBounds(
      { lat: bounds.south, lng: bounds.west },
      { lat: bounds.north, lng: bounds.east },
    )
    if (padding !== undefined) {
      mapInstance.fitBounds(googleBounds, padding)
    } else {
      mapInstance.fitBounds(googleBounds)
    }
  }

  const renderingType = mapInstance && typeof mapInstance.getRenderingType === 'function'
    ? mapInstance.getRenderingType()
    : undefined

  const contextValue: MapContextValue = {
    map: mapInstance,
    viewport,
    renderingType,
    flyTo,
    fitBounds,
    setMap: setMapInstance,
    setViewport,
  }

  return (
    <MapContextProvider value={contextValue}>
      <div className={`relative ${className}`}>
        <Map
          defaultCenter={{ lat: center.latitude, lng: center.longitude }}
          defaultZoom={zoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          mapId={mapId}
          gestureHandling="greedy"
          clickableIcons={false}
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={true}
          streetViewControl={true}
          fullscreenControl={true}
          className="size-full"
        >
          <MapSynchronizer
            onMapReady={setMapInstance}
            onIdleChange={handleIdle}
            onMapClick={onMapClick}
          />
          <DeckOverlay>
            {children}
          </DeckOverlay>
        </Map>
      </div>
    </MapContextProvider>
  )
}
