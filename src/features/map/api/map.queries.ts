import {
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query'
import { MAP_CONFIG } from '../lib/map-config'
import type {
  DensityQuery,
  HeatPointsQuery,
  MapSearchQuery,
  PlaceMarkersQuery,
  PlacePostsQuery,
  TopicFeedQuery,
  TopicMarkersQuery,
  Uuid,
} from '../lib/types'
import {
  feedService,
  mapService,
  searchService,
} from './map.service'

export const mapQueryKeys = {
  all: ['map'] as const,
  density: (q: DensityQuery) =>
    [
      ...mapQueryKeys.all,
      'density',
      q.bounds.north,
      q.bounds.south,
      q.bounds.east,
      q.bounds.west,
      q.resolution,
      q.window,
    ] as const,
  heatPoints: (q: HeatPointsQuery) =>
    [
      ...mapQueryKeys.all,
      'heatPoints',
      q.bounds.north,
      q.bounds.south,
      q.bounds.east,
      q.bounds.west,
      q.zoom,
      q.limit,
      q.window,
    ] as const,
  placeMarkers: (q: PlaceMarkersQuery) =>
    [
      ...mapQueryKeys.all,
      'placeMarkers',
      q.bounds.north,
      q.bounds.south,
      q.bounds.east,
      q.bounds.west,
      q.zoom,
      q.limit,
      q.window,
    ] as const,
  topicMarkers: (q: TopicMarkersQuery) =>
    [
      ...mapQueryKeys.all,
      'topicMarkers',
      q.bounds.north,
      q.bounds.south,
      q.bounds.east,
      q.bounds.west,
      q.zoom,
      q.limit,
      q.window,
    ] as const,
  placeSummary: (placeId: Uuid) => [...mapQueryKeys.all, 'placeSummary', placeId] as const,
  placePosts: (q: PlacePostsQuery) =>
    [
      ...mapQueryKeys.all,
      'placePosts',
      q.placeId,
      q.time,
      q.sort,
      q.topic,
      q.page,
      q.pageSize,
    ] as const,
  topicFeed: (q: TopicFeedQuery) =>
    [
      ...mapQueryKeys.all,
      'topicFeed',
      q.topic,
      q.scope,
      q.time,
      q.sort,
      q.page,
      q.pageSize,
    ] as const,
  search: (q: MapSearchQuery) =>
    [
      ...mapQueryKeys.all,
      'search',
      q.q,
      q.scope,
      q.time,
      q.kinds,
      q.page,
      q.pageSize,
    ] as const,
}

export function useDensityQuery(query: DensityQuery, enabled = true) {
  return useQuery({
    queryKey: mapQueryKeys.density(query),
    queryFn: ({ signal }) => mapService.getDensity(query, { signal }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: MAP_CONFIG.STALE_TIME_MS,
    gcTime: MAP_CONFIG.GC_TIME_MS,
  })
}

export function useHeatPointsQuery(query: HeatPointsQuery, enabled = true) {
  return useQuery({
    queryKey: mapQueryKeys.heatPoints(query),
    queryFn: ({ signal }) => mapService.getHeatPoints(query, { signal }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: MAP_CONFIG.STALE_TIME_MS,
    gcTime: MAP_CONFIG.GC_TIME_MS,
  })
}

export function usePlaceMarkersQuery(query: PlaceMarkersQuery, enabled = true) {
  return useQuery({
    queryKey: mapQueryKeys.placeMarkers(query),
    queryFn: ({ signal }) => mapService.getPlaceMarkers(query, { signal }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: MAP_CONFIG.STALE_TIME_MS,
    gcTime: MAP_CONFIG.GC_TIME_MS,
  })
}

export function useTopicMarkersQuery(query: TopicMarkersQuery, enabled = true) {
  return useQuery({
    queryKey: mapQueryKeys.topicMarkers(query),
    queryFn: ({ signal }) => mapService.getTopicMarkers(query, { signal }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: MAP_CONFIG.STALE_TIME_MS,
    gcTime: MAP_CONFIG.GC_TIME_MS,
  })
}

export function usePlaceSummaryQuery(placeId: Uuid | null | undefined, enabled = true) {
  return useQuery({
    queryKey: placeId ? mapQueryKeys.placeSummary(placeId) : ['map', 'placeSummary', 'empty'],
    queryFn: ({ signal }) => (placeId ? mapService.getPlaceSummary(placeId, { signal }) : Promise.reject('No placeId')),
    enabled: Boolean(placeId) && enabled,
    staleTime: MAP_CONFIG.STALE_TIME_MS,
  })
}

export function usePlacePostsQuery(query: PlacePostsQuery, enabled = true) {
  return useQuery({
    queryKey: mapQueryKeys.placePosts(query),
    queryFn: ({ signal }) => mapService.getPlacePosts(query, { signal }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: MAP_CONFIG.STALE_TIME_MS,
  })
}

export function useTopicFeedQuery(query: TopicFeedQuery, enabled = true) {
  return useQuery({
    queryKey: mapQueryKeys.topicFeed(query),
    queryFn: ({ signal }) => feedService.getTopicFeed(query, { signal }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: MAP_CONFIG.STALE_TIME_MS,
  })
}

export function useMapSearchQuery(query: MapSearchQuery, enabled = true) {
  return useQuery({
    queryKey: mapQueryKeys.search(query),
    queryFn: ({ signal }) => searchService.search(query, { signal }),
    enabled: Boolean(query.q.trim()) && enabled,
    placeholderData: keepPreviousData,
    staleTime: MAP_CONFIG.STALE_TIME_MS,
  })
}
