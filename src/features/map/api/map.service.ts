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
  TopicFeedQuery,
  TopicMarker,
  TopicMarkersQuery,
  Uuid,
} from '../lib/types'
import { httpFeedService, httpMapService, httpSearchService } from './map.http'

export type RequestOptions = {
  signal?: AbortSignal
}

export interface MapService {
  getDensity(q: DensityQuery, o?: RequestOptions): Promise<DensityResponse>
  getHeatPoints(q: HeatPointsQuery, o?: RequestOptions): Promise<HeatPointsResponse>
  getPlaceMarkers(q: PlaceMarkersQuery, o?: RequestOptions): Promise<MapPlace[]>
  getTopicMarkers(q: TopicMarkersQuery, o?: RequestOptions): Promise<TopicMarker[]>
  getPlaceSummary(placeId: Uuid, o?: RequestOptions): Promise<PlaceSummary>
  getPlacePosts(q: PlacePostsQuery, o?: RequestOptions): Promise<PageResponse<PostCardData>>
}

export interface FeedService {
  getTopicFeed(q: TopicFeedQuery, o?: RequestOptions): Promise<PageResponse<PostCardData>>
}

export interface SearchService {
  search(q: MapSearchQuery, o?: RequestOptions): Promise<SearchResponse>
}

// Sử dụng trực tiếp HTTP service kết nối Backend qua API Gateway (không dùng mock trên map)
export const mapService: MapService = httpMapService
export const feedService: FeedService = httpFeedService
export const searchService: SearchService = httpSearchService
