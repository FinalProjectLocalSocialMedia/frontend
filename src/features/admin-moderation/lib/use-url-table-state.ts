import { useSearchParams } from 'react-router-dom'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from './constants'

export type SortState = { field: string; direction: 'asc' | 'desc' }

type Defaults = { pageSize?: number; sort?: SortState }

const isPageSize = (n: number): n is (typeof PAGE_SIZE_OPTIONS)[number] =>
  (PAGE_SIZE_OPTIONS as readonly number[]).includes(n)

function parseSort(raw: string | null): SortState | null {
  if (!raw) return null
  const [field, direction] = raw.split(':')
  if (!field || (direction !== 'asc' && direction !== 'desc')) return null
  return { field, direction }
}

/**
 * Trạng thái bảng nằm trên URL search params (quy ước 5): `?page=2&pageSize=20&sort=reportedAt:asc&…`.
 * Giá trị bằng mặc định không được ghi lên URL để địa chỉ gọn và dùng được làm deep link.
 * Bộ lọc riêng của từng trang dùng `getParam`/`setParam` (đổi bộ lọc sẽ đưa về trang 1).
 */
export function useUrlTableState(defaults: Defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultPageSize = defaults.pageSize ?? DEFAULT_PAGE_SIZE

  const pageRaw = Number(searchParams.get('page'))
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1
  const sizeRaw = Number(searchParams.get('pageSize'))
  const pageSize = isPageSize(sizeRaw) ? sizeRaw : defaultPageSize
  const sort = parseSort(searchParams.get('sort')) ?? defaults.sort ?? null

  const update = (mutate: (next: URLSearchParams) => void) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      mutate(next)
      return next
    })

  return {
    page,
    pageSize,
    sort,
    getParam: (key: string) => searchParams.get(key) ?? undefined,
    setPage: (value: number) =>
      update((next) => {
        if (value <= 1) next.delete('page')
        else next.set('page', String(value))
      }),
    setPageSize: (value: number) =>
      update((next) => {
        if (value === defaultPageSize) next.delete('pageSize')
        else next.set('pageSize', String(value))
        next.delete('page')
      }),
    setSort: (value: SortState | null) =>
      update((next) => {
        const isDefault =
          value && defaults.sort && value.field === defaults.sort.field && value.direction === defaults.sort.direction
        if (!value || isDefault) next.delete('sort')
        else next.set('sort', `${value.field}:${value.direction}`)
        next.delete('page')
      }),
    /** Đặt/xoá một bộ lọc; về trang 1. */
    setParam: (key: string, value: string | undefined) =>
      update((next) => {
        if (value === undefined || value === '') next.delete(key)
        else next.set(key, value)
        next.delete('page')
      }),
  }
}
