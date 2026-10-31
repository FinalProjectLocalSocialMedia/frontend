import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { MAP_CONFIG } from '../lib/map-config'
import type { GeoPoint } from '../lib/types'

export type UseUserLocationOptions = {
  onGpsAcquired?: (point: GeoPoint) => void
  userHasInteracted: boolean
}

export function useUserLocation({ onGpsAcquired, userHasInteracted }: UseUserLocationOptions) {
  const [gpsPosition, setGpsPosition] = useState<GeoPoint | null>(null)
  const [isLoadingGps, setIsLoadingGps] = useState(false)
  const hasAttemptedGpsRef = useRef(false)

  const requestGps = (isAutoTrigger = false) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (!isAutoTrigger) {
        toast.info('Trình duyệt không hỗ trợ định vị GPS')
      }
      return
    }

    setIsLoadingGps(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoadingGps(false)
        const point: GeoPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setGpsPosition(point)

        // Chỉ tự động di chuyển bản đồ tới toạ độ GPS nếu người dùng chưa chủ động tương tác với camera
        if (!userHasInteracted || !isAutoTrigger) {
          onGpsAcquired?.(point)
        }
      },
      () => {
        setIsLoadingGps(false)
        if (isAutoTrigger) {
          toast.info('Không lấy được vị trí GPS, đang dùng vị trí mặc định / đã lưu', {
            duration: 3500,
          })
        } else {
          toast.error('Không thể truy cập vị trí GPS của bạn')
        }
      },
      {
        timeout: MAP_CONFIG.GPS_TIMEOUT_MS,
        enableHighAccuracy: true,
        maximumAge: 60_000,
      },
    )
  }

  // Tự động yêu cầu toạ độ GPS khi mount lần đầu (M10, non-blocking)
  useEffect(() => {
    if (!hasAttemptedGpsRef.current) {
      hasAttemptedGpsRef.current = true
      requestGps(true)
    }
  }, [])

  return {
    gpsPosition,
    isLoadingGps,
    requestGps: () => requestGps(false),
  }
}
