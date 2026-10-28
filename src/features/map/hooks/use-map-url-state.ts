import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MAP_CONFIG } from '../lib/map-config'
import type { CenterSource, DensityMode, GeoPoint, RadiusKm, StatsWindow } from '../lib/types'
import {
  parseMapUrlParams,
  readDensityModeFromStorage,
  readLastViewFromStorage,
  serializeMapUrlParams,
  writeDensityModeToStorage,
  writeLastViewToStorage,
  type MapUrlState,
} from '../lib/url-state'

export function useMapUrlState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Xác định trạng thái ban đầu: ưu tiên URL params -> localStorage -> mặc định
  const parsed = parseMapUrlParams(searchParams)
  const stored = typeof window !== 'undefined' ? readLastViewFromStorage() : null
  const storedDensityMode = typeof window !== 'undefined' ? readDensityModeFromStorage() : null

  const center: GeoPoint = parsed.center || stored?.center || MAP_CONFIG.DEFAULT_CENTER
  const zoom: number = parsed.zoom ?? stored?.zoom ?? 13
  const radiusKm: RadiusKm = parsed.radiusKm || stored?.radiusKm || MAP_CONFIG.DEFAULT_RADIUS_KM
  const source: CenterSource = parsed.source || stored?.source || 'DEFAULT'
  const statsWindow: StatsWindow = parsed.window || '7d'
  const densityMode: DensityMode = parsed.densityMode || storedDensityMode || MAP_CONFIG.DENSITY_MODE_DEFAULT
  const placeId: string | undefined = parsed.placeId
  const topic: string | undefined = parsed.topic
  const searchQuery: string | undefined = parsed.searchQuery

  // Dọn dẹp bộ đếm thời gian khi unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Cập nhật camera: dùng replace với debounce (~600ms) chỉ kích hoạt khi camera ở trạng thái idle
  const onCameraIdle = useCallback(
    (nextCenter: GeoPoint, nextZoom: number) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        setSearchParams(
          (prev) => serializeMapUrlParams({ center: nextCenter, zoom: nextZoom }, prev),
          { replace: true },
        )

        // Lưu vào localStorage dưới dạng lastView
        writeLastViewToStorage({
          center: nextCenter,
          zoom: Math.round(nextZoom),
          radiusKm,
          source,
        })
      }, 600)
    },
    [radiusKm, source, setSearchParams],
  )

  // Cập nhật tham số trực tiếp (bán kính, nguồn toạ độ, cửa sổ thời gian)
  const setRadius = useCallback(
    (nextRadius: RadiusKm) => {
      setSearchParams(
        (prev) => serializeMapUrlParams({ radiusKm: nextRadius }, prev),
        { replace: true },
      )
      writeLastViewToStorage({ center, zoom, radiusKm: nextRadius, source })
    },
    [center, zoom, source, setSearchParams],
  )

  const setSource = useCallback(
    (nextSource: CenterSource) => {
      setSearchParams(
        (prev) => serializeMapUrlParams({ source: nextSource }, prev),
        { replace: true },
      )
      writeLastViewToStorage({ center, zoom, radiusKm, source: nextSource })
    },
    [center, zoom, radiusKm, setSearchParams],
  )

  const setWindow = useCallback(
    (nextWindow: StatsWindow) => {
      setSearchParams(
        (prev) => serializeMapUrlParams({ window: nextWindow }, prev),
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setDensityMode = useCallback(
    (mode: DensityMode) => {
      setSearchParams(
        (prev) => serializeMapUrlParams({ densityMode: mode }, prev),
        { replace: true },
      )
      writeDensityModeToStorage(mode)
    },
    [setSearchParams],
  )

  // Chuyển đổi modal / bảng tìm kiếm sử dụng push để nút Back của trình duyệt có thể đóng lại
  // Quy tắc 6.4b: Chỉ mở một panel mỗi lúc (mở place thì đóng topic/search và ngược lại)
  const setPlaceId = useCallback(
    (id: string | null) => {
      setSearchParams(
        (prev) => {
          const updates: { placeId: string | null; topic?: string | null; searchQuery?: string | null } = {
            placeId: id,
          }
          if (id) {
            updates.topic = null
            updates.searchQuery = null
          }
          return serializeMapUrlParams(updates, prev)
        },
        { replace: false },
      )
    },
    [setSearchParams],
  )

  const setTopic = useCallback(
    (nextTopic: string | null, nextPlaceId?: string | null) => {
      setSearchParams(
        (prev) => {
          const updates: { topic: string | null; placeId?: string | null; searchQuery?: string | null } = {
            topic: nextTopic,
          }
          if (nextTopic) {
            updates.searchQuery = null
            if (nextPlaceId !== undefined) {
              updates.placeId = nextPlaceId
            }
          } else {
            // Khi đóng topic modal, xoá luôn placeId nếu mở từ topic
            if (nextPlaceId !== undefined) {
              updates.placeId = nextPlaceId
            }
          }
          return serializeMapUrlParams(updates, prev)
        },
        { replace: false },
      )
    },
    [setSearchParams],
  )

  const setSearchQuery = useCallback(
    (q: string | null) => {
      setSearchParams(
        (prev) => {
          const updates: { searchQuery: string | null; placeId?: string | null; topic?: string | null } = {
            searchQuery: q,
          }
          if (q) {
            updates.placeId = null
            updates.topic = null
          }
          return serializeMapUrlParams(updates, prev)
        },
        { replace: false },
      )
    },
    [setSearchParams],
  )

  const currentUrlState: MapUrlState = {
    center,
    zoom,
    radiusKm,
    source,
    window: statsWindow,
    densityMode,
    placeId,
    topic,
    searchQuery,
  }

  return {
    urlState: currentUrlState,
    onCameraIdle,
    setRadius,
    setSource,
    setWindow,
    setDensityMode,
    setPlaceId,
    setTopic,
    setSearchQuery,
  }
}
