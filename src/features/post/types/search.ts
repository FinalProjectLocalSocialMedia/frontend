export interface UserSearchResponse {
  id: string
  fullName: string
  avatarUrl?: string
}

export interface UserSearchCursorPage {
  items: UserSearchResponse[]
  page: {
    nextCursor?: string | null
    hasMore: boolean
  }
}

export type SearchTab = 'posts' | 'users'
