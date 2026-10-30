import { useEffect, useRef } from 'react'
import { useMapContext } from '@/components/map/map-context'
import { radiusToBounds } from '@/components/map/geo'
import type { GeoPoint, RadiusKm } from '../lib/types'

export type RadiusCircleProps = {
  center: GeoPoint
  radiusKm: RadiusKm
  autoFit?: boolean
}

/**
 * Vẽ vòng tròn bán kính màu primary bao quanh tâm khu vực đang chọn.
 * Tự động dọn dẹp instance google.maps.Circle khi unmount.
 */
export function RadiusCircle({ center, radiusKm, autoFit = false }: RadiusCircleProps) {
  const { map, fitBounds } = useMapContext()
  const circleRef = useRef<google.maps.Circle | null>(null)
  const isFirstRenderRef = useRef(true)

  // Khởi tạo hoặc cập nhật đối tượng Google Maps Circle
  useEffect(() => {
    if (!map) return

    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map,
        center: { lat: center.latitude, lng: center.longitude },
        radius: radiusKm * 1000,
        strokeColor: '#0ea5e9',
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: '#0ea5e9',
        fillOpacity: 0.08,
        clickable: false,
      })
    } else {
      circleRef.current.setCenter({ lat: center.latitude, lng: center.longitude })
      circleRef.current.setRadius(radiusKm * 1000)
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null)
        circleRef.current = null
      }
    }
  }, [map, center.latitude, center.longitude, radiusKm])

  // Tự động căn chỉnh bounds khi bán kính thay đổi hoặc autoFit được kích hoạt (bỏ qua lần render đầu tiên nếu map đã có view ban đầu)
  useEffect(() => {
    if (!map) return
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      if (!autoFit) return
    }

    const bounds = radiusToBounds(center, radiusKm)
    fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 })
  }, [map, center.latitude, center.longitude, radiusKm, autoFit, fitBounds])

  return null
}
