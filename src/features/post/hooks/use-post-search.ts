import { useSearchPostsQuery } from '@/features/post/api/search-queries'
import type { GeoPoint } from '../types/geo-point'

export type UsePostSearchParams = {
  q?: string
  locationId?: string
  topic?: string
  coordinates?: GeoPoint
  radiusKm?: number
}

/**
 * Hook tìm kiếm bài viết (usePostSearch):
 * - Nhận { q, locationId, topic, coordinates, radiusKm } hoặc (query, locationId)
 * - Uỷ quyền cho useSearchPostsQuery (dùng searchKeys.posts)
 */
export function usePostSearch(params: string | UsePostSearchParams, locationIdParam?: string) {
  const { q, locationId, topic, coordinates, radiusKm } =
    typeof params === 'string'
      ? {
          q: params,
          locationId: locationIdParam,
          topic: undefined,
          coordinates: undefined,
          radiusKm: undefined,
        }
      : params

  return useSearchPostsQuery({ q, locationId, topic, coordinates, radiusKm })
}
