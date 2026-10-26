import type {
  CommentItem,
  DensityQuery,
  DensityResponse,
  MapPlace,
  MapSearchQuery,
  PageResponse,
  PlaceMarkersQuery,
  PlacePostsQuery,
  PlaceSummary,
  PostCardData,
  PostDetail,
  PublicProfile,
  SearchResponse,
  TopicFeedQuery,
  TopicMarker,
  TopicMarkersQuery,
  Uuid,
} from '../lib/types'
import { USE_MOCK } from '@/config/env'
import {
  mockFeedService,
  mockMapService,
  mockSearchService,
  mockUserService,
} from './mock/map.mock'

export type RequestOptions = {
  signal?: AbortSignal
}

export interface MapService {
  getDensity(q: DensityQuery, o?: RequestOptions): Promise<DensityResponse>
  getPlaceMarkers(q: PlaceMarkersQuery, o?: RequestOptions): Promise<MapPlace[]>
  getTopicMarkers(q: TopicMarkersQuery, o?: RequestOptions): Promise<TopicMarker[]>
  getPlaceSummary(placeId: Uuid, o?: RequestOptions): Promise<PlaceSummary>
  getPlacePosts(q: PlacePostsQuery, o?: RequestOptions): Promise<PageResponse<PostCardData>>
}

export interface FeedService {
  getTopicFeed(q: TopicFeedQuery, o?: RequestOptions): Promise<PageResponse<PostCardData>>
  getPost(id: Uuid, o?: RequestOptions): Promise<PostDetail>
  getComments(
    postId: Uuid,
    p: { page: number; pageSize: number },
    o?: RequestOptions,
  ): Promise<PageResponse<CommentItem>>
  addComment(
    postId: Uuid,
    content: string,
    parentCommentId?: Uuid,
    o?: RequestOptions,
  ): Promise<CommentItem>
}

export interface SearchService {
  search(q: MapSearchQuery, o?: RequestOptions): Promise<SearchResponse>
}

export interface UserService {
  getPublicProfile(id: Uuid, o?: RequestOptions): Promise<PublicProfile>
  getUserPosts(
    id: Uuid,
    p: { page: number; pageSize: number },
    o?: RequestOptions,
  ): Promise<PageResponse<PostCardData>>
}

// In Phase 0, default to mock implementation (USE_MOCK is true)
export const mapService: MapService = USE_MOCK ? mockMapService : mockMapService
export const feedService: FeedService = USE_MOCK ? mockFeedService : mockFeedService
export const searchService: SearchService = USE_MOCK ? mockSearchService : mockSearchService
export const userService: UserService = USE_MOCK ? mockUserService : mockUserService
