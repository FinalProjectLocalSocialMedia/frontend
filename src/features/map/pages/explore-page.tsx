import { useState, useCallback, useRef } from 'react'
import { GoogleMapsProvider } from '@/components/map/google-maps-provider'
import { BaseMap } from '@/components/map/base-map'
import type { MapViewState } from '@/components/map/map-types'
import { RadiusControl } from '../components/radius-control'
import { WindowControl } from '../components/window-control'
import { LocateButton } from '../components/locate-button'
import { PickLocationButton } from '../components/pick-location-button'
import { UserLocationDot } from '../components/user-location-dot'
import { CenterPin } from '../components/center-pin'
import { RadiusCircle } from '../components/radius-circle'
import { MapSearchBar } from '../components/map-search-bar'
import { useMapUrlState } from '../hooks/use-map-url-state'
import { useUserLocation } from '../hooks/use-user-location'
import type { GeoPoint, RadiusKm } from '../lib/types'
import { toast } from 'sonner'

export default function ExplorePage() {
  const {
    urlState,
    onCameraIdle,
    setRadius,
    setSource,
    setWindow,
    setSearchQuery,
  } = useMapUrlState()

  const [areaCenter, setAreaCenter] = useState<GeoPoint>(urlState.center)
  const [isPickingLocation, setIsPickingLocation] = useState(false)
  const [searchInputValue, setSearchInputValue] = useState(urlState.searchQuery || '')
  const userInteractedRef = useRef(false)
  const [autoFitRadius, setAutoFitRadius] = useState(false)

  // Thu nhận toạ độ GPS
  const handleGpsAcquired = useCallback(
    (point: GeoPoint) => {
      setAreaCenter(point)
      setSource('GPS')
    },
    [setSource],
  )

  const { gpsPosition, isLoadingGps, requestGps } = useUserLocation({
    onGpsAcquired: handleGpsAcquired,
    userHasInteracted: userInteractedRef.current,
  })

  // Xử lý sự kiện idle của bản đồ để đồng bộ tham số URL search params
  const handleMapIdle = useCallback(
    (viewport: MapViewState) => {
      userInteractedRef.current = true
      onCameraIdle(viewport.center, viewport.zoom)
    },
    [onCameraIdle],
  )

  // Xử lý click trên bản đồ khi đang ở chế độ Chọn vị trí
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!isPickingLocation || !e.latLng) return

      const clickedPoint: GeoPoint = {
        latitude: e.latLng.lat(),
        longitude: e.latLng.lng(),
      }

      setAreaCenter(clickedPoint)
      setSource('PICKED')
      setIsPickingLocation(false)
      toast.success('Đã chọn vị trí tâm khu vực mới')
    },
    [isPickingLocation, setSource],
  )

  // Xử lý click nút Vị trí của tôi
  const handleLocateMe = useCallback(() => {
    if (gpsPosition) {
      setAreaCenter(gpsPosition)
      setSource('GPS')
      setAutoFitRadius(true)
      toast.success('Đã chuyển về vị trí của bạn')
    } else {
      requestGps()
    }
  }, [gpsPosition, requestGps, setSource])

  // Xử lý thay đổi bán kính khu vực
  const handleRadiusChange = useCallback(
    (nextRadius: RadiusKm) => {
      setRadius(nextRadius)
      setAutoFitRadius(true)
    },
    [setRadius],
  )

  return (
    <div className="relative size-full h-[calc(100dvh-var(--bottom-nav-h))] overflow-hidden bg-[#e5e3df]">
      <GoogleMapsProvider>
        <BaseMap
          center={areaCenter}
          zoom={urlState.zoom}
          onIdle={handleMapIdle}
          onMapClick={handleMapClick}
          className={`size-full ${isPickingLocation ? 'cursor-crosshair' : ''}`}
        >
          {/* Chấm tròn biểu thị toạ độ GPS của người dùng */}
          <UserLocationDot position={gpsPosition} />

          {/* Ghim tâm khu vực khi người dùng chủ động chọn */}
          {urlState.source === 'PICKED' && <CenterPin position={areaCenter} />}

          {/* Vòng tròn bán kính quanh tâm khu vực */}
          <RadiusCircle
            center={areaCenter}
            radiusKm={urlState.radiusKm}
            autoFit={autoFitRadius}
          />
        </BaseMap>
      </GoogleMapsProvider>

      {/* Lớp giao diện nổi phía trên */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col justify-between gap-3 p-3 sm:flex-row sm:items-start sm:p-4">
        {/* Góc trên bên trái: Thanh tìm kiếm & Tuỳ chọn bán kính */}
        <div className="pointer-events-auto flex flex-col gap-2.5">
          <MapSearchBar
            value={searchInputValue}
            onChange={(val) => {
              setSearchInputValue(val)
              setSearchQuery(val || null)
            }}
          />
          <RadiusControl
            value={urlState.radiusKm}
            onChange={handleRadiusChange}
          />
        </div>

        {/* Góc trên bên phải: Nút chọn vị trí, Nút định vị GPS & Bộ chọn khoảng thời gian */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
          <PickLocationButton
            isPicking={isPickingLocation}
            onToggle={() => setIsPickingLocation((prev) => !prev)}
          />
          <LocateButton
            onClick={handleLocateMe}
            isActive={urlState.source === 'GPS'}
            loading={isLoadingGps}
          />
          <WindowControl
            value={urlState.window}
            onChange={setWindow}
          />
        </div>
      </div>

      {/* Banner hướng dẫn khi đang ở chế độ chọn vị trí */}
      {isPickingLocation && (
        <div className="pointer-events-none absolute bottom-6 inset-x-0 z-20 flex justify-center px-4">
          <div className="pointer-events-auto animate-bounce rounded-full border border-primary/20 bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg">
            Nhấp chuột vào một vị trí trên bản đồ để đặt làm tâm khu vực
          </div>
        </div>
      )}
    </div>
  )
}
