import type { CenterSource, GeoPoint, RadiusKm, StatsWindow } from './types'
import { MAP_CONFIG } from './map-config'

export type MapUrlState = {
  center: GeoPoint
  zoom: number
  radiusKm: RadiusKm
  source: CenterSource
  window: StatsWindow
  placeId?: string
  searchQuery?: string
  timeFilter?: string
}

const STORAGE_LAST_VIEW_KEY = 'nearby_map_last_view'

/** Phân tích các tham số search param từ URL thành kiểu MapUrlState */
export function parseMapUrlParams(searchParams: URLSearchParams): Partial<MapUrlState> {
  const result: Partial<MapUrlState> = {}

  const latStr = searchParams.get('lat')
  const lngStr = searchParams.get('lng')
  if (latStr && lngStr) {
    const latitude = parseFloat(latStr)
    const longitude = parseFloat(lngStr)
    if (!isNaN(latitude) && !isNaN(longitude)) {
      result.center = { latitude, longitude }
    }
  }

  const zStr = searchParams.get('z')
  if (zStr) {
    const zoom = parseFloat(zStr)
    if (!isNaN(zoom)) {
      result.zoom = Math.min(MAP_CONFIG.MAX_ZOOM, Math.max(MAP_CONFIG.MIN_ZOOM, zoom))
    }
  }

  const rStr = searchParams.get('r')
  if (rStr) {
    const rNum = parseInt(rStr, 10) as RadiusKm
    if (MAP_CONFIG.RADIUS_OPTIONS_KM.includes(rNum)) {
      result.radiusKm = rNum
    }
  }

  const srcStr = searchParams.get('src')?.toUpperCase()
  if (srcStr === 'GPS' || srcStr === 'PICKED' || srcStr === 'LAST_KNOWN' || srcStr === 'DEFAULT') {
    result.source = srcStr as CenterSource
  }

  const wStr = searchParams.get('w')
  if (wStr === '1d' || wStr === '7d' || wStr === '30d') {
    result.window = wStr
  }

  const place = searchParams.get('place')
  if (place) {
    result.placeId = place
  }

  const q = searchParams.get('q')
  if (q) {
    result.searchQuery = q
  }

  const t = searchParams.get('t')
  if (t) {
    result.timeFilter = t
  }

  return result
}

/** Tuần tự hoá trạng thái cập nhật vào URLSearchParams mà không ghi đè các tham số khác */
export function serializeMapUrlParams(
  updates: Partial<MapUrlState>,
  existingParams: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(existingParams)

  if (updates.center) {
    // Làm tròn đến 5 chữ số thập phân (độ chính xác ~1 mét) để URL ổn định
    next.set('lat', updates.center.latitude.toFixed(5))
    next.set('lng', updates.center.longitude.toFixed(5))
  }

  if (updates.zoom !== undefined) {
    next.set('z', Math.round(updates.zoom).toString())
  }

  if (updates.radiusKm !== undefined) {
    next.set('r', updates.radiusKm.toString())
  }

  if (updates.source !== undefined) {
    next.set('src', updates.source.toLowerCase())
  }

  if (updates.window !== undefined) {
    next.set('w', updates.window)
  }

  if (updates.placeId !== undefined) {
    if (updates.placeId) {
      next.set('place', updates.placeId)
    } else {
      next.delete('place')
    }
  }

  if (updates.searchQuery !== undefined) {
    if (updates.searchQuery) {
      next.set('q', updates.searchQuery)
    } else {
      next.delete('q')
    }
  }

  if (updates.timeFilter !== undefined) {
    if (updates.timeFilter) {
      next.set('t', updates.timeFilter)
    } else {
      next.delete('t')
    }
  }

  return next
}

/** Đọc toạ độ tâm, zoom, bán kính đã xem gần nhất từ localStorage có try/catch an toàn */
export function readLastViewFromStorage(): {
  center: GeoPoint
  zoom: number
  radiusKm: RadiusKm
  source: CenterSource
} | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_LAST_VIEW_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed.latitude === 'number' &&
      typeof parsed.longitude === 'number' &&
      typeof parsed.zoom === 'number'
    ) {
      const radiusKm = MAP_CONFIG.RADIUS_OPTIONS_KM.includes(parsed.radiusKm)
        ? (parsed.radiusKm as RadiusKm)
        : MAP_CONFIG.DEFAULT_RADIUS_KM
      const source: CenterSource =
        parsed.source === 'PICKED' || parsed.source === 'GPS' ? parsed.source : 'LAST_KNOWN'

      return {
        center: { latitude: parsed.latitude, longitude: parsed.longitude },
        zoom: parsed.zoom,
        radiusKm,
        source,
      }
    }
  } catch {
    /* localStorage không khả dụng hoặc lỗi parse JSON */
  }
  return null
}

/** Lưu toạ độ tâm, zoom, bán kính đã xem gần nhất vào localStorage có try/catch an toàn */
export function writeLastViewToStorage(view: {
  center: GeoPoint
  zoom: number
  radiusKm: RadiusKm
  source: CenterSource
}): void {
  try {
    window.localStorage.setItem(
      STORAGE_LAST_VIEW_KEY,
      JSON.stringify({
        latitude: view.center.latitude,
        longitude: view.center.longitude,
        zoom: view.zoom,
        radiusKm: view.radiusKm,
        source: view.source,
      }),
    )
  } catch {
    /* localStorage không khả dụng */
  }
}
