import type { Paginated } from '../../lib/types'
import { DEFAULT_PAGE_SIZE } from '../../lib/constants'

/** Phân trang phía "server" cho mock: `page` bắt đầu từ 1. */
export function paginate<T>(items: T[], page = 1, pageSize = DEFAULT_PAGE_SIZE): Paginated<T> {
  const safePage = Math.max(1, Math.floor(page))
  const safeSize = Math.max(1, Math.floor(pageSize))
  const start = (safePage - 1) * safeSize
  return {
    items: items.slice(start, start + safeSize),
    page: safePage,
    pageSize: safeSize,
    total: items.length,
  }
}
