import type { TimeFilterValue, TimeRange } from './types'

const PRESET_DURATIONS_MS = {
  '3h': 3 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
} as const

/**
 * Resolves a TimeFilterValue into an ISO start and end range.
 * - 'preset': [now - duration, now]
 * - 'date': [YYYY-MM-DDT00:00:00.000+07:00, YYYY-MM-DDT23:59:59.999+07:00] (Vietnam UTC+7)
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
    // filter.date format is 'YYYY-MM-DD'
    const dateStr = filter.date
    return {
      from: `${dateStr}T00:00:00.000+07:00`,
      to: `${dateStr}T23:59:59.999+07:00`,
    }
  }

  return {}
}

/** Check if an ISO date string falls within a TimeRange. */
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
