import { useInfiniteQuery } from '@tanstack/react-query'
import { searchPosts } from '@/features/post/api/post-api'
import { GeoPoint } from '../types/geo-point'

const DEFAULT_PAGE_SIZE = 20

export type UsePostSearchParams = {
  q?: string
  locationId?: string
  topic?: string
  coordinates?: GeoPoint
  radiusKm?: number
}

/**
 * Hook tìm kiếm bài viết (usePostSearch) theo mục 6.8:
 * - Nhận { q, locationId, topic } hoặc (query, locationId)
 * - enabled khi có ít nhất một trong ba giá trị được cung cấp
 * - Đưa cả 3 tham số vào queryKey để tự động đồng bộ cache
 */
export function usePostSearch(params: string | UsePostSearchParams, locationIdParam?: string) {
  const { q, locationId, topic, coordinates, radiusKm } =
    typeof params === 'string'
      ? { q: params, locationId: locationIdParam, topic: undefined, coordinates: undefined, radiusKm: undefined }
      : params

  const trimmedQ = (q ?? '').trim()
  const trimmedLocationId = locationId?.trim()
  const trimmedTopic = topic?.trim()

  // Kích hoạt truy vấn khi có ít nhất 1 điều kiện lọc (từ khoá, địa điểm hoặc chủ đề)
  const hasAnyFilter = Boolean(trimmedQ || trimmedLocationId || trimmedTopic )

  return useInfiniteQuery({
    queryKey: ['posts', 'search', { q: trimmedQ, locationId: trimmedLocationId, topic: trimmedTopic, radiusKm }],
    enabled: hasAnyFilter && !!coordinates,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      searchPosts({
        q: trimmedQ,
        locationId: trimmedLocationId,
        topic: trimmedTopic,
        cursor: pageParam,
        limit: DEFAULT_PAGE_SIZE,
        signal,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        radiusKm,
      }),
    getNextPageParam: (lastPage) => lastPage.page.nextCursor || undefined,
    
    
  })
}
