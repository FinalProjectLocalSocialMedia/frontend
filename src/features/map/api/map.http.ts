import { apiClient } from '@/lib/api-client'
import type {
  DensityQuery,
  DensityResponse,
  HeatPointsQuery,
  HeatPointsResponse,
  MapPlace,
  MapSearchQuery,
  PageResponse,
  PlaceMarkersQuery,
  PlacePostsQuery,
  PlaceSummary,
  PostCardData,
  SearchResponse,
  TopicMarker,
  TopicMarkersQuery,
  Uuid,
} from '../lib/types'
import type { MapService, RequestOptions, SearchService } from './map.service'

/**
 * Triển khai HTTP Service cho Map Explore kết nối trực tiếp với API Gateway (Pha P7).
 * Tuân thủ nghiêm ngặt các quy ước:
 * - /map/places, /map/places/{id}/summary, /map/heat-points, /map/topic-markers: location-service
 * - /post/locations/{locationId}/posts: post-service (Pha P4)
 * - /map/search: location-service (Pha P5)
 * - Tự động truyền tham số zoom bắt buộc (zoom: Math.floor(q.zoom))
 */
export const httpMapService: MapService = {
  async getPlaceMarkers(q: PlaceMarkersQuery, o?: RequestOptions): Promise<MapPlace[]> {
    const response = await apiClient.get<MapPlace[]>('/map/places', {
      params: {
        north: q.bounds.north,
        south: q.bounds.south,
        east: q.bounds.east,
        west: q.bounds.west,
        zoom: Math.floor(q.zoom),
        window: q.window,
        limit: q.limit,
      },
      signal: o?.signal,
    })
    return response.data
  },

  async getPlaceSummary(placeId: Uuid, o?: RequestOptions): Promise<PlaceSummary> {
    const response = await apiClient.get<PlaceSummary>(`/map/places/${placeId}/summary`, {
      signal: o?.signal,
    })
    return response.data
  },

  async getHeatPoints(q: HeatPointsQuery, o?: RequestOptions): Promise<HeatPointsResponse> {
    const response = await apiClient.get<HeatPointsResponse>('/map/heat-points', {
      params: {
        north: q.bounds.north,
        south: q.bounds.south,
        east: q.bounds.east,
        west: q.bounds.west,
        zoom: Math.floor(q.zoom),
        window: q.window,
        limit: q.limit,
      },
      signal: o?.signal,
    })
    return response.data
  },

  async getTopicMarkers(q: TopicMarkersQuery, o?: RequestOptions): Promise<TopicMarker[]> {
    const response = await apiClient.get<TopicMarker[]>('/map/topic-markers', {
      params: {
        north: q.bounds.north,
        south: q.bounds.south,
        east: q.bounds.east,
        west: q.bounds.west,
        zoom: Math.floor(q.zoom),
        window: q.window,
        limit: q.limit,
      },
      signal: o?.signal,
    })
    return response.data
  },

  async getPlacePosts(q: PlacePostsQuery, o?: RequestOptions): Promise<PageResponse<PostCardData>> {
    let timeParam: string | undefined = undefined
    let dateParam: string | undefined = undefined

    if (q.time.kind === 'preset') {
      timeParam = q.time.preset
    } else if (q.time.kind === 'date') {
      dateParam = q.time.date
    }

    const cleanTopic = q.topic ? q.topic.replace(/^#/, '').trim() : undefined

    // Đường dẫn theo post-service (FE gọi qua Gateway: /post/locations/{id}/posts)
    const response = await apiClient.get<PageResponse<PostCardData>>(
      `/post/locations/${q.placeId}/posts`,
      {
        params: {
          sort: q.sort,
          topic: cleanTopic || undefined,
          time: timeParam,
          date: dateParam,
          page: q.page,
          pageSize: q.pageSize,
        },
        signal: o?.signal,
      },
    )
    return response.data
  },

  // Phương thức dự phòng cho getDensity cũ nếu có nơi nào còn tham chiếu
  async getDensity(q: DensityQuery, o?: RequestOptions): Promise<DensityResponse> {
    const heat = await this.getHeatPoints(
      {
        bounds: q.bounds,
        zoom: 14,
        window: q.window,
        limit: 1000,
      },
      o,
    )

    return {
      resolution: q.resolution,
      window: q.window,
      cells: heat.points.map((p) => ({
        h3Index: '',
        count: p.weight,
      })),
      maxCount: heat.maxWeight,
      totalPosts: heat.totalPosts,
      generatedAt: heat.generatedAt,
    }
  },
}

export const httpSearchService: SearchService = {
  async search(q: MapSearchQuery, o?: RequestOptions): Promise<SearchResponse> {
    let timeParam: string | undefined = undefined
    let dateParam: string | undefined = undefined

    if (q.time.kind === 'preset') {
      timeParam = q.time.preset
    } else if (q.time.kind === 'date') {
      dateParam = q.time.date
    }

    const response = await apiClient.get<SearchResponse>('/map/search', {
      params: {
        q: q.q,
        placeId: q.scope?.placeId,
        lat: q.scope?.center?.latitude,
        lng: q.scope?.center?.longitude,
        radiusKm: q.scope?.radiusKm,
        time: timeParam,
        date: dateParam,
        kinds: q.kinds && q.kinds.length > 0 ? q.kinds.join(',') : undefined,
        page: q.page,
        pageSize: q.pageSize,
      },
      signal: o?.signal,
    })
    return response.data
  },
}
