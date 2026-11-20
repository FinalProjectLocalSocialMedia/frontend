import axios from 'axios'
import { apiClient } from '@/lib/api-client'
import type { UserSearchCursorPage, UserSearchResponse } from '../types/search'

const MAX_SUGGEST_USERS = 6
const DEFAULT_USER_SEARCH_LIMIT = 20
const MAX_USER_SEARCH_LIMIT = 30

export type SearchUsersParams = {
  q: string
  cursor?: string
  limit?: number
  signal?: AbortSignal
}

/**
 * Gợi ý tối đa 6 người dùng cho dropdown thanh search (GET /users/suggest).
 */
export async function suggestUsers(
  q: string,
  signal?: AbortSignal,
): Promise<UserSearchResponse[]> {
  const trimmedQ = q.trim()
  if (trimmedQ.length < 2) {
    return []
  }

  const response = await apiClient.get<UserSearchResponse[]>('/user/users/suggest', {
    params: { q: trimmedQ },
    signal,
  })

  return Array.isArray(response.data) ? response.data.slice(0, MAX_SUGGEST_USERS) : []
}

/**
 * Tìm kiếm người dùng phân trang cursor (GET /users/search, tối đa 30/trang).
 */
export async function searchUsers({
  q,
  cursor,
  limit = DEFAULT_USER_SEARCH_LIMIT,
  signal,
}: SearchUsersParams): Promise<UserSearchCursorPage> {
  const trimmedQ = q.trim()
  if (!trimmedQ) {
    return {
      items: [],
      page: { nextCursor: null, hasMore: false },
    }
  }

  const clampedLimit = Math.max(1, Math.min(limit, MAX_USER_SEARCH_LIMIT))

  const response = await apiClient.get<UserSearchCursorPage>('/user/users/search', {
    params: {
      q: trimmedQ,
      cursor,
      limit: clampedLimit,
    },
    signal,
  })

  return response.data
}

/**
 * Kiểm tra lỗi có phải do cursor không hợp lệ hoặc phiên tìm kiếm hết hạn
 * để client invalidate và gọi lại từ trang đầu.
 */
export function isSearchResetError(error: unknown): boolean {
  if (!error) return false

  const extractCode = (obj: unknown): string | undefined => {
    if (!obj || typeof obj !== 'object') return undefined
    const record = obj as Record<string, unknown>
    for (const key of ['code', 'errorCode', 'error', 'message']) {
      const value = record[key]
      if (typeof value === 'string') {
        if (value === 'INVALID_CURSOR' || value === 'SEARCH_SESSION_EXPIRED') {
          return value
        }
      }
    }
    return undefined
  }

  if (axios.isAxiosError(error)) {
    const code = extractCode(error.response?.data) ?? extractCode(error)
    return Boolean(code)
  }

  return Boolean(extractCode(error))
}
