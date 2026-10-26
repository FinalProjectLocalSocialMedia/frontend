import type { GeoPoint, LatLngBounds, MapViewState } from '@/components/map/map-types'

// Re-export map primitives
export type { GeoPoint, LatLngBounds, MapViewState }

// ===== Nguyên thuỷ =====
export type Uuid = string
export type IsoDateTime = string // ISO 8601
export type PageResponse<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
} // page starts at 1

// ===== Phạm vi khu vực người dùng quan tâm =====
export type RadiusKm = 1 | 3 | 5 | 10
export type CenterSource = 'GPS' | 'LAST_KNOWN' | 'PICKED' | 'DEFAULT'
export type MapScope = {
  center: GeoPoint
  radiusKm: RadiusKm
  source: CenterSource
}

// ===== Thời gian =====
export type StatsWindow = '1d' | '7d' | '30d'
export type TimePreset = '3h' | '1d' | '7d' | '30d'
export type TimeFilterValue =
  | { kind: 'all' }
  | { kind: 'preset'; preset: TimePreset }
  | { kind: 'date'; date: string } // 'YYYY-MM-DD' theo giờ Việt Nam (UTC+7)

export type TimeRange = {
  from?: IsoDateTime
  to?: IsoDateTime
}

// ===== Địa điểm & topic (M3) =====
export type MapPlace = {
  id: Uuid
  name: string
  locationType: string // locations.location_type
  center: GeoPoint // toạ độ CÔNG KHAI của địa điểm
  h3Index: string
  postCount: number // theo cửa sổ hiện tại
  trendScore: number
  topTopic?: string
}

export type TrendingTopic = {
  name: string // hashtag, không có '#'
  postCount: number
  score: number
  changePct?: number
}

export type PlaceCounts = {
  last1d: number
  last7d: number
  last30d: number
}

export type PlaceSummary = {
  place: MapPlace & { description?: string }
  counts: PlaceCounts
  latestPostAt?: IsoDateTime // thời gian bài MỚI NHẤT
  trendingTopics: TrendingTopic[] // top ~10, cửa sổ 7 ngày
}

// ===== Mật độ H3 =====
export type DensityQuery = {
  bounds: LatLngBounds
  resolution: number
  window: StatsWindow
}

export type DensityCell = {
  h3Index: string
  count: number
}

export type DensityResponse = {
  resolution: number
  window: StatsWindow
  cells: DensityCell[] // đã gom + áp ngưỡng riêng tư; ≤ MAX_CELLS
  maxCount: number
  totalPosts: number
  generatedAt: IsoDateTime
}

// ===== Marker =====
export type PlaceMarkersQuery = {
  bounds: LatLngBounds
  limit: number
  window: StatsWindow
}

export type TopicMarker = {
  id: string // `${placeId}:${topic}`
  placeId: Uuid
  placeName: string
  topic: string
  postCount: number
  score: number
  position: GeoPoint // = toạ độ địa điểm (R3)
}

export type TopicMarkersQuery = {
  bounds: LatLngBounds
  limit: number
  window: StatsWindow
}

// ===== Bài viết — KHÔNG có toạ độ (R3) =====
export type AuthorRef = {
  id: Uuid
  displayName: string
  avatarUrl?: string
}

export type PlaceRef = {
  id: Uuid
  name: string
}

export type PostCardData = {
  id: Uuid
  author: AuthorRef
  excerpt: string // ≤ 160 ký tự
  firstImageUrl?: string
  imageCount: number
  createdAt: IsoDateTime
  place: PlaceRef
  topics: string[]
  likeCount: number
  commentCount: number
}

export type PostDetail = Omit<PostCardData, 'excerpt' | 'firstImageUrl'> & {
  content: string
  imageUrls: string[]
  sharedPost?: PostCardData
  likedByMe: boolean
  savedByMe: boolean
}

export type CommentItem = {
  id: Uuid
  postId: Uuid
  author: AuthorRef
  content: string
  createdAt: IsoDateTime
  parentCommentId?: Uuid
  replyCount: number
}

export type PostSort = 'TRENDING' | 'NEWEST'

export type PlacePostsQuery = {
  placeId: Uuid
  time: TimeFilterValue
  sort: PostSort
  topic?: string
  page: number
  pageSize: number
}

export type FeedScope =
  | { kind: 'place'; placeId: Uuid }
  | { kind: 'area'; center: GeoPoint; radiusKm: RadiusKm }

export type TopicFeedQuery = {
  topic: string
  scope: FeedScope
  time: TimeFilterValue
  sort: PostSort
  page: number
  pageSize: number
}

// ===== Tìm kiếm (R7) =====
export type SearchKind = 'POST' | 'USER' | 'PLACE'

export type MapSearchQuery = {
  q: string
  scope?: { placeId?: Uuid; center?: GeoPoint; radiusKm?: RadiusKm }
  time: TimeFilterValue
  kinds: SearchKind[]
  page: number
  pageSize: number
}

export type PostHit = { kind: 'POST' } & PostCardData
export type UserHit = { kind: 'USER'; id: Uuid; displayName: string; avatarUrl?: string; bio?: string }
export type PlaceHit = { kind: 'PLACE'; id: Uuid; name: string; locationType: string; center: GeoPoint; postCount: number }

export type SearchResponse = {
  q: string
  posts: PageResponse<PostHit>
  users: UserHit[]
  places: PlaceHit[]
}

// ===== Trang cá nhân người khác =====
export type PublicProfile = {
  id: Uuid
  displayName: string
  avatarUrl?: string
  bio: string
  followerCount: number
  followingCount: number
  postCount: number
}

// ===== 5.4. Kiểm tra quyền riêng tư ở mức kiểu (R3) =====
type HasKey<T, K extends string> = K extends keyof T ? true : false
type Expect<T extends true> = T
export type _NoGeoOnPost = Expect<
  HasKey<PostCardData, 'latitude' | 'longitude' | 'location' | 'coordinate'> extends false ? true : false
>
export type _NoGeoOnPostDetail = Expect<
  HasKey<PostDetail, 'latitude' | 'longitude' | 'location' | 'coordinate'> extends false ? true : false
>
