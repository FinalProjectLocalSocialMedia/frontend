import type { TimeFilterValue, TimeRange } from './types'

const PRESET_DURATIONS_MS = {
  '3h': 3 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
} as const

/**
 * Phân giải giá trị TimeFilterValue thành khoảng thời gian chuẩn ISO (from, to).
 * - 'preset': [now - duration, now]
 * - 'date': [YYYY-MM-DDT00:00:00.000+07:00, YYYY-MM-DDT23:59:59.999+07:00] (Giờ Việt Nam UTC+7)
 * - 'all': {}
 */
export function resolveTimeFilter(filter: TimeFilterValue, nowInput?: Date): TimeRange {
  const now = nowInput ?? new Date()

  if (filter.kind === 'all') {
    return {}
  }

  if (filter.kind === 'preset') {
    const duration = PRESET_DURATIONS_MS[filter.preset]
    const fromDate = new Date(now.getTime() - duration)
    return {
      from: fromDate.toISOString(),
      to: now.toISOString(),
    }
  }

  if (filter.kind === 'date') {
    // Định dạng filter.date là 'YYYY-MM-DD'
    const dateStr = filter.date
    return {
      from: `${dateStr}T00:00:00.000+07:00`,
      to: `${dateStr}T23:59:59.999+07:00`,
    }
  }

  return {}
}

/** Kiểm tra một chuỗi ngày giờ ISO có nằm trong khoảng TimeRange hay không. */
export function isWithinTimeRange(isoDate: string, range: TimeRange): boolean {
  const time = new Date(isoDate).getTime()
  if (isNaN(time)) return false

  if (range.from) {
    const fromTime = new Date(range.from).getTime()
    if (time < fromTime) return false
  }

  if (range.to) {
    const toTime = new Date(range.to).getTime()
    if (time > toTime) return false
  }

  return true
}
