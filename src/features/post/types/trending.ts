export interface TrendingPostDto {
  postId: string
  score: number
  locationId?: string | null
  locationName?: string | null
  h3Index?: string | null
  content?: string | null
  mediaJson?: string | null
  authorId?: string | null
  authorName?: string | null
  authorAvatarUrl?: string | null
  createdAt?: string | null
}

export interface TrendingKeywordDto {
  keyword: string
  score: number
  locationId?: string | null
}
