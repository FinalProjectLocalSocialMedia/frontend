import type { GeoPoint, LatLngBounds } from './map-types'

const EARTH_RADIUS_METERS = 6371000
const KM_PER_LAT_DEGREE = 111.32

/** Tính khoảng cách giữa hai toạ độ địa lý theo mét sử dụng công thức Haversine. */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)

  const sinDlat = Math.sin(dLat / 2)
  const sinDlng = Math.sin(dLng / 2)
  const h = sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlng * sinDlng

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/** Tính bounding box bao quanh điểm tâm với bán kính cho trước theo km. */
export function radiusToBounds(center: GeoPoint, radiusKm: number): LatLngBounds {
  const latDelta = radiusKm / KM_PER_LAT_DEGREE
  const cosLat = Math.cos((center.latitude * Math.PI) / 180)
  // Phòng tránh chia cho 0 khi gần các cực
  const lngDelta = radiusKm / (KM_PER_LAT_DEGREE * (Math.abs(cosLat) > 0.0001 ? Math.abs(cosLat) : 0.0001))

  return {
    north: center.latitude + latDelta,
    south: center.latitude - latDelta,
    east: center.longitude + lngDelta,
    west: center.longitude - lngDelta,
  }
}

/** Mở rộng bounding box theo tỷ lệ đệm cho mỗi cạnh (ví dụ 0.25 = đệm thêm 25%). */
export function padBounds(bounds: LatLngBounds, ratio = 0.25): LatLngBounds {
  const latSpan = bounds.north - bounds.south
  const lngSpan = bounds.east - bounds.west

  return {
    north: bounds.north + latSpan * ratio,
    south: bounds.south - latSpan * ratio,
    east: bounds.east + lngSpan * ratio,
    west: bounds.west - lngSpan * ratio,
  }
}

/** Kiểm tra xem một toạ độ có nằm bên trong bounding box hay không. */
export function containsPoint(bounds: LatLngBounds, point: GeoPoint): boolean {
  return (
    point.latitude >= bounds.south &&
    point.latitude <= bounds.north &&
    point.longitude >= bounds.west &&
    point.longitude <= bounds.east
  )
}

/** Phép chiếu Web Mercator: chuyển đổi toạ độ kinh/vĩ sang toạ độ điểm ảnh (pixel) ở một mức zoom. */
export function latLngToPixel(point: GeoPoint, zoom: number): { x: number; y: number } {
  const scale = 256 * Math.pow(2, zoom)
  const x = (point.longitude + 180) / 360 * scale

  const sinLat = Math.sin((point.latitude * Math.PI) / 180)
  const clampedSin = Math.min(Math.max(sinLat, -0.9999), 0.9999)
  const y = (0.5 - Math.log((1 + clampedSin) / (1 - clampedSin)) / (4 * Math.PI)) * scale

  return { x, y }
}

/** Chuyển đổi bounding box sang danh sách khoá tile (slippy tile keys: z/x/y) ở mức zoom. */
export function boundsToTileKeys(bounds: LatLngBounds, zoom: number): string[] {
  const z = Math.max(0, Math.floor(zoom))
  const scale = Math.pow(2, z)

  const toTileX = (lng: number) => Math.floor(Math.max(0, Math.min(scale - 1, ((lng + 180) / 360) * scale)))
  const toTileY = (lat: number) => {
    const sin = Math.sin((lat * Math.PI) / 180)
    const clamped = Math.min(Math.max(sin, -0.9999), 0.9999)
    const y = (0.5 - Math.log((1 + clamped) / (1 - clamped)) / (4 * Math.PI)) * scale
    return Math.floor(Math.max(0, Math.min(scale - 1, y)))
  }

  const minX = toTileX(bounds.west)
  const maxX = toTileX(bounds.east)
  const minY = toTileY(bounds.north)
  const maxY = toTileY(bounds.south)

  const tiles: string[] = []
  for (let x = Math.min(minX, maxX); x <= Math.max(minX, maxX); x++) {
    for (let y = Math.min(minY, maxY); y <= Math.max(minY, maxY); y++) {
      tiles.push(`${z}/${x}/${y}`)
    }
  }

  return tiles
}
