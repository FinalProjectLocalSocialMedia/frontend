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
import { DensityLayer } from '../components/density-layer'
import { DensityLegend } from '../components/density-legend'
import { DensityModeControl } from '../components/density-mode-control'
import { PlaceMarkers } from '../components/place-markers'
import { PlaceDetailModal } from '../components/place-detail-modal'
import { PerformanceHUD, type PerformanceMetrics } from '../components/performance-hud'
import { useMapUrlState } from '../hooks/use-map-url-state'
import { useUserLocation } from '../hooks/use-user-location'
import type { GeoPoint, RadiusKm } from '../lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function ExplorePage() {
  const {
    urlState,
    onCameraIdle,
    setRadius,
    setSource,
    setWindow,
    setDensityMode,
    setPlaceId,
    setSearchQuery,
  } = useMapUrlState()

  const [areaCenter, setAreaCenter] = useState<GeoPoint>(urlState.center)
  const [isPickingLocation, setIsPickingLocation] = useState(false)
  const [searchInputValue, setSearchInputValue] = useState(urlState.searchQuery || '')
  const [autoFitRadius, setAutoFitRadius] = useState(false)
  const [currentViewport, setCurrentViewport] = useState<MapViewState | null>(null)
  const [totalPostsInView, setTotalPostsInView] = useState<number>(0)

  // Đo lường hiệu năng: map:ready và density-first-paint
  const mountTimeRef = useRef(performance.now())
  const hasRecordedMapReadyRef = useRef(false)
  const userInteractedRef = useRef(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    window: urlState.window,
  })

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

  // Xử lý sự kiện idle của bản đồ để đồng bộ tham số URL search params và cập nhật viewport
  const handleMapIdle = useCallback(
    (viewport: MapViewState) => {
      userInteractedRef.current = true
      setCurrentViewport(viewport)
      onCameraIdle(viewport.center, viewport.zoom)

      // Ghi nhận mốc map:ready lần đầu tiên
      if (!hasRecordedMapReadyRef.current) {
        hasRecordedMapReadyRef.current = true
        performance.mark('map:ready')
        const readyDuration = performance.now() - mountTimeRef.current
        setMetrics((prev) => ({
          ...prev,
          mapReadyTimeMs: readyDuration,
          resolution: viewport.zoom >= 13 ? 8 : viewport.zoom >= 11 ? 7 : 6,
        }))
      }
    },
    [onCameraIdle],
  )

  // Callback nhận kết quả đo density-first-paint từ DensityLayer
  const handleDensityFirstPaint = useCallback((durationMs: number, cellCount: number, resolution: number) => {
    setMetrics((prev) => ({
      ...prev,
      densityFirstPaintMs: durationMs,
      cellCount,
      resolution,
      window: urlState.window,
    }))
  }, [urlState.window])

  // Callback nhận tổng số bài và ô mật độ khi nạp xong
  const handleDensityLoaded = useCallback((cellCount: number, totalPosts: number, resolution: number) => {
    setTotalPostsInView(totalPosts)
    setMetrics((prev) => ({
      ...prev,
      cellCount,
      resolution,
      window: urlState.window,
    }))
  }, [urlState.window])

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
          {/* Lớp mật độ hoạt động (Pha 2 & Pha 2B: HEATMAP hoặc HEX) */}
          <DensityLayer
            viewport={currentViewport}
            statsWindow={urlState.window}
            areaCenter={areaCenter}
            radiusKm={urlState.radiusKm}
            mode={urlState.densityMode}
            onFallbackToHex={() => setDensityMode('HEX')}
            onFirstPaint={handleDensityFirstPaint}
            onDensityLoaded={handleDensityLoaded}
          />

          {/* Marker địa điểm (Pha 3: zoom 10-12 hiện chấm hotspot, zoom >= 13 hiện pill) */}
          <PlaceMarkers
            viewport={currentViewport}
            statsWindow={urlState.window}
            onSelectPlace={(placeId) => setPlaceId(placeId)}
          />

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

      {/* Modal chi tiết địa điểm (Pha 3) - Đặt ngoài cây bản đồ để không làm re-render BaseMap */}
      <PlaceDetailModal
        placeId={urlState.placeId || null}
        isOpen={Boolean(urlState.placeId)}
        onClose={() => setPlaceId(null)}
      />

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

        {/* Góc trên bên phải: Chuyển chế độ mật độ, Nút chọn vị trí, Nút định vị GPS & Bộ chọn khoảng thời gian */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
          <DensityModeControl
            value={urlState.densityMode}
            onChange={setDensityMode}
          />
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

      {/* Lớp giao diện nổi phía dưới */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex items-end justify-between px-3 sm:px-4">
        {/* Góc dưới bên trái: Bảng chú giải thang màu mật độ (Heatmap / H3) */}
        {/* Khi panel chi tiết mở, dịch chuyển sang bên phải mép panel trên màn hình desktop */}
        <div
          className={cn(
            'pointer-events-auto transition-transform duration-300 ease-in-out',
            Boolean(urlState.placeId) && 'lg:translate-x-[calc(clamp(20rem,33%,26rem)+0.75rem)]',
          )}
        >
          {/* <DensityLegend
            window={urlState.window}
            mode={urlState.densityMode}
            totalPosts={totalPostsInView}
            className="max-w-[220px]"
          /> */}
        </div>

        {/* Góc dưới bên phải: Bảng theo dõi hiệu năng (Performance HUD) */}
        <PerformanceHUD metrics={metrics} />
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
