import { useEffect, useMemo } from 'react'
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import { latLngToPixel, padBounds, pixelToLatLng } from '@/components/map/geo'
import { usePlaceMarkersQuery } from '../api/map.queries'
import { MAP_CONFIG } from '../lib/map-config'
import type { GeoPoint, MapPlace, MapViewState, StatsWindow } from '../lib/types'

export type PlaceMarkersProps = {
  viewport: MapViewState | null
  statsWindow: StatsWindow
  onSelectPlace: (placeId: string) => void
  onPlacesLoaded?: (places: MapPlace[]) => void
}

type ClusterOrMarker = {
  id: string
  center: GeoPoint
  totalPostCount: number
  members: MapPlace[]
  primaryPlace: MapPlace
}

/** Mức zoom tối đa còn áp dụng gộp cụm (zoom >= 18 sẽ tách toàn bộ thành từng marker riêng) */
const CLUSTER_MAX_ZOOM = 17.8

/**
 * Tính kích thước marker và màu sắc hiển thị dựa trên số lượng bài viết (postCount),
 * đồng bộ theo thang màu của Heatmap (vàng dịu -> cam -> đỏ san hô).
 */
function getMarkerStyle(postCount: number): {
  size: number
  fontSize: string
  bgColor: string
  textColor: string
  borderColor: string
} {
  const size = Math.min(46, Math.max(24, Math.round(20 + Math.sqrt(postCount) * 4.5)))
  const fontSize = size >= 40 ? '13px' : size >= 32 ? '12px' : '11px'

  if (postCount >= 20) {
    return {
      size,
      fontSize,
      bgColor: 'rgba(227, 74, 51, 0.92)',
      textColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.95)',
    }
  }
  if (postCount >= 10) {
    return {
      size,
      fontSize,
      bgColor: 'rgba(247, 104, 60, 0.92)',
      textColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.95)',
    }
  }
  if (postCount >= 5) {
    return {
      size,
      fontSize,
      bgColor: 'rgba(254, 153, 41, 0.92)',
      textColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.95)',
    }
  }
  if (postCount >= 2) {
    return {
      size,
      fontSize,
      bgColor: 'rgba(254, 196, 79, 0.95)',
      textColor: '#78350f',
      borderColor: 'rgba(255, 255, 255, 0.95)',
    }
  }
  return {
    size,
    fontSize,
    bgColor: 'rgba(254, 227, 145, 0.95)',
    textColor: '#78350f',
    borderColor: 'rgba(254, 196, 79, 0.9)',
  }
}

/**
 * Gom cụm động (Dynamic Clustering) theo khoảng cách pixel trên màn hình ở mức zoom hiện tại:
 * - Ở zoom < 18: Các marker có hình tròn đè lên nhau (khoảng cách tâm < tổng bán kính + padding)
 *   được gộp thành 1 cluster hiển thị tổng số bài viết (totalPostCount), đặt tại trọng tâm có trọng số.
 * - Ở zoom >= 18: Không gộp cụm (1 hàng locations = 1 marker) và tự động đẩy nhẹ (nudge) vài pixel
 *   nếu 2 tọa độ GPS quá sát nhau để không số nào đè khuất số nào.
 */
function computeDynamicClusters(places: MapPlace[], zoom: number): ClusterOrMarker[] {
  const eligible = places.filter((p) => p.postCount > 0)
  if (eligible.length === 0) return []

  // Sắp xếp giảm dần theo postCount để điểm nóng nhất làm hạt nhân gom cụm
  const sorted = [...eligible].sort((a, b) => b.postCount - a.postCount)

  if (zoom < CLUSTER_MAX_ZOOM) {
    const clusters: {
      pixelX: number
      pixelY: number
      totalPostCount: number
      weightedLatSum: number
      weightedLngSum: number
      members: MapPlace[]
      primaryPlace: MapPlace
    }[] = []

    const mergePaddingPx = 4

    for (const place of sorted) {
      const px = latLngToPixel(place.center, zoom)
      const placeRadius = getMarkerStyle(place.postCount).size / 2

      let targetCluster: (typeof clusters)[number] | null = null
      let minDistance = Infinity

      for (const cluster of clusters) {
        const clusterRadius = getMarkerStyle(cluster.totalPostCount).size / 2
        const dx = px.x - cluster.pixelX
        const dy = px.y - cluster.pixelY
        const dist = Math.hypot(dx, dy)

        if (dist < clusterRadius + placeRadius + mergePaddingPx && dist < minDistance) {
          minDistance = dist
          targetCluster = cluster
        }
      }

      if (targetCluster) {
        const nextTotal = targetCluster.totalPostCount + place.postCount
        targetCluster.weightedLatSum += place.center.latitude * place.postCount
        targetCluster.weightedLngSum += place.center.longitude * place.postCount
        targetCluster.totalPostCount = nextTotal
        targetCluster.members.push(place)

        const newCenter: GeoPoint = {
          latitude: targetCluster.weightedLatSum / nextTotal,
          longitude: targetCluster.weightedLngSum / nextTotal,
        }
        const newPx = latLngToPixel(newCenter, zoom)
        targetCluster.pixelX = newPx.x
        targetCluster.pixelY = newPx.y
      } else {
        clusters.push({
          pixelX: px.x,
          pixelY: px.y,
          totalPostCount: place.postCount,
          weightedLatSum: place.center.latitude * place.postCount,
          weightedLngSum: place.center.longitude * place.postCount,
          members: [place],
          primaryPlace: place,
        })
      }
    }

    return clusters
      .sort((a, b) => a.totalPostCount - b.totalPostCount)
      .map((c) => ({
        id: c.members.length === 1 ? c.primaryPlace.id : `cluster-${c.primaryPlace.id}-${c.members.length}`,
        center: {
          latitude: c.weightedLatSum / c.totalPostCount,
          longitude: c.weightedLngSum / c.totalPostCount,
        },
        totalPostCount: c.totalPostCount,
        members: c.members,
        primaryPlace: c.primaryPlace,
      }))
  }

  // Ở zoom >= 18: tách hoàn toàn từng hàng locations và đẩy nhẹ vài pixel nếu 2 điểm sát vách nhau
  const nodes = sorted.map((place) => {
    const px = latLngToPixel(place.center, zoom)
    const radius = getMarkerStyle(place.postCount).size / 2
    return {
      place,
      x: px.x,
      y: px.y,
      radius,
    }
  })

  const iterations = 4
  const minGapPx = 3
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy)
        const minDist = a.radius + b.radius + minGapPx

        if (dist < minDist) {
          const overlap = (minDist - dist) / 2
          // Nếu 2 điểm trùng khít toạ độ (dist === 0), đẩy theo góc cố định dựa trên chỉ số
          const angle = dist > 0.001 ? Math.atan2(dy, dx) : ((i + j) * 2.39996) % (2 * Math.PI)
          const shiftX = Math.cos(angle) * overlap
          const shiftY = Math.sin(angle) * overlap
          a.x -= shiftX
          a.y -= shiftY
          b.x += shiftX
          b.y += shiftY
        }
      }
    }
  }

  return nodes
    .sort((a, b) => a.place.postCount - b.place.postCount)
    .map((n) => ({
      id: n.place.id,
      center: pixelToLatLng({ x: n.x, y: n.y }, zoom),
      totalPostCount: n.place.postCount,
      members: [n.place],
      primaryPlace: n.place,
    }))
}

/**
 * Hiển thị marker địa điểm trên bản đồ với Dynamic Clustering:
 * - Bỏ tên địa điểm trên marker, chỉ hiển thị số lượng bài viết (postCount)
 * - Khi các marker đè lên nhau ở zoom < 18, tự động gom cụm và cộng tổng số bài viết
 * - Khi click vào cụm (cluster), tự động phóng to để tách thành các marker riêng;
 *   khi click vào marker đơn lẻ, mở ngay PlaceDetailModal (?place=<id>)
 */
export function PlaceMarkers({ viewport, statsWindow, onSelectPlace, onPlacesLoaded }: PlaceMarkersProps) {
  const map = useMap()
  const currentZoom = viewport?.zoom ?? 0
  const isHotspotZoom = currentZoom >= MAP_CONFIG.HOTSPOT_DOT_MIN_ZOOM && currentZoom < MAP_CONFIG.PLACE_MARKER_MIN_ZOOM
  const isPillZoom = currentZoom >= MAP_CONFIG.PLACE_MARKER_MIN_ZOOM
  const isZoomEligible = Boolean(viewport && (isHotspotZoom || isPillZoom))

  // Đệm thêm 25% bounds và làm tròn để cache TanStack Query ổn định
  const queryBounds = useMemo(() => {
    if (!viewport || !isZoomEligible) return null
    const padded = padBounds(viewport.bounds, MAP_CONFIG.VIEWPORT_PADDING)
    return {
      north: Number(padded.north.toFixed(3)),
      south: Number(padded.south.toFixed(3)),
      east: Number(padded.east.toFixed(3)),
      west: Number(padded.west.toFixed(3)),
    }
  }, [viewport, isZoomEligible])

  const queryLimit = isHotspotZoom ? MAP_CONFIG.HOTSPOT_DOT_LIMIT : MAP_CONFIG.MAX_PLACE_MARKERS

  const { data: rawPlaces } = usePlaceMarkersQuery(
    {
      bounds: queryBounds ?? { north: 0, south: 0, east: 0, west: 0 },
      zoom: Math.floor(currentZoom),
      limit: queryLimit,
      window: statsWindow,
    },
    Boolean(queryBounds),
  )

  // Báo danh sách marker đã tải lên component cha (ExplorePage)
  useEffect(() => {
    if (rawPlaces && onPlacesLoaded) {
      onPlacesLoaded(rawPlaces)
    }
  }, [rawPlaces, onPlacesLoaded])

  // Tính toán danh sách marker / cluster động theo mức zoom hiện tại
  const visibleItems = useMemo(() => {
    if (!rawPlaces || rawPlaces.length === 0 || !viewport) return []
    return computeDynamicClusters(rawPlaces, viewport.zoom)
  }, [rawPlaces, viewport?.zoom])

  if (!isZoomEligible || visibleItems.length === 0) {
    return null
  }

  const handleItemClick = (item: ClusterOrMarker) => {
    // Nếu là cụm gộp nhiều marker và đang ở zoom < 18, phóng to vào tâm cụm để tách các marker ra
    if (item.members.length > 1 && currentZoom < CLUSTER_MAX_ZOOM && map) {
      map.panTo({ lat: item.center.latitude, lng: item.center.longitude })
      map.setZoom(Math.min(MAP_CONFIG.MAX_ZOOM, Math.max(18, Math.floor(currentZoom) + 2)))
      return
    }
    onSelectPlace(item.primaryPlace.id)
  }

  return (
    <>
      {visibleItems.map((item) => {
        const { size, fontSize, bgColor, textColor, borderColor } = getMarkerStyle(item.totalPostCount)
        const isCluster = item.members.length > 1
        const titleText = isCluster
          ? `Cụm ${item.members.length} điểm (${item.totalPostCount} bài viết - Nhấp để phóng to)`
          : `${item.primaryPlace.name} (${item.totalPostCount} bài viết)`

        return (
          <AdvancedMarker
            key={item.id}
            position={{ lat: item.center.latitude, lng: item.center.longitude }}
            onClick={() => handleItemClick(item)}
            zIndex={100 + Math.min(item.totalPostCount, 500)}
          >
            <button
              type="button"
              className="group flex items-center justify-center rounded-full border-2 font-bold shadow-md backdrop-blur-xs transition-transform hover:scale-115 active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer select-none"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                fontSize,
                backgroundColor: bgColor,
                color: textColor,
                borderColor,
              }}
              aria-label={titleText}
              title={titleText}
            >
              <span>{item.totalPostCount}</span>
            </button>
          </AdvancedMarker>
        )
      })}
    </>
  )
}
