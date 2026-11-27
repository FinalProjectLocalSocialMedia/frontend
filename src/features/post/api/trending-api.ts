import { postHttp } from './http-client'
import type { TrendingKeywordDto, TrendingPostDto } from '../types/trending'

export interface GetTrendingPostsParams {
  limit?: number
  locationId?: string
  h3Index?: string
}

export interface GetTrendingKeywordsParams {
  limit?: number
  locationId?: string
  h3Index?: string
}

export async function getTrendingPosts(params?: GetTrendingPostsParams): Promise<TrendingPostDto[]> {
  const response = await postHttp.get<TrendingPostDto[]>('/trending/posts', {
    params: {
      limit: params?.limit ?? 20,
      locationId: params?.locationId,
      h3Index: params?.h3Index,
    },
  })
  return response.data
}

export async function getTrendingKeywords(params?: GetTrendingKeywordsParams): Promise<TrendingKeywordDto[]> {
  const response = await postHttp.get<TrendingKeywordDto[]>('/trending/keywords', {
    params: {
      limit: params?.limit ?? 10,
      locationId: params?.locationId,
      h3Index: params?.h3Index,
    },
  })
  return response.data
}
