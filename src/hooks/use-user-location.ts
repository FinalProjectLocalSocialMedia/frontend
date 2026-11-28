import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { GeoPoint } from '@/components/map/map-types'

const DEFAULT_GPS_TIMEOUT_MS = 4000

export type UseUserLocationOptions = {
  onGpsAcquired?: (point: GeoPoint) => void
  userHasInteracted?: boolean
  timeoutMs?: number
}

/**
 * Hook lấy vị trí GPS hiện tại của người dùng (dùng chung toàn app).
 * - Tự động yêu cầu GPS 1 lần khi mount mà không chặn giao diện.
 * - Đồng bộ ref qua useEffect để tuân thủ luật React Compiler.
 */
export function useUserLocation({
  onGpsAcquired,
  userHasInteracted = false,
  timeoutMs = DEFAULT_GPS_TIMEOUT_MS,
}: UseUserLocationOptions) {
  const [gpsPosition, setGpsPosition] = useState<GeoPoint | null>(null)
  const [isLoadingGps, setIsLoadingGps] = useState(false)
  const [gpsError, setGpsError] = useState(false)
  const hasAttemptedGpsRef = useRef(false)

  const userHasInteractedRef = useRef(userHasInteracted)
  const onGpsAcquiredRef = useRef(onGpsAcquired)

  useEffect(() => {
    userHasInteractedRef.current = userHasInteracted
    onGpsAcquiredRef.current = onGpsAcquired
  }, [userHasInteracted, onGpsAcquired])

  const requestGps = useCallback(
    (isAutoTrigger = false) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        setGpsError(true)
        if (!isAutoTrigger) {
          toast.info('Trình duyệt không hỗ trợ định vị GPS')
        }
        return
      }

      setIsLoadingGps(true)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLoadingGps(false)
          setGpsError(false)
          const point: GeoPoint = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          setGpsPosition(point)

          if (!isAutoTrigger || !userHasInteractedRef.current) {
            onGpsAcquiredRef.current?.(point)
          }
        },
        () => {
          setIsLoadingGps(false)
          setGpsError(true)

          if (!isAutoTrigger) {
            toast.error('Không thể truy cập vị trí GPS của bạn', {
              id: 'gps-error-toast',
            })
          }
        },
        {
          timeout: timeoutMs,
          enableHighAccuracy: true,
          maximumAge: 60_000,
        },
      )
    },
    [timeoutMs],
  )

  useEffect(() => {
    if (!hasAttemptedGpsRef.current) {
      hasAttemptedGpsRef.current = true
      requestGps(true)
    }
  }, [requestGps])

  return {
    gpsPosition,
    isLoadingGps,
    gpsError,
    requestGps: () => requestGps(false),
  }
}
