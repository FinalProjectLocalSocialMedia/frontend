import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh'

const ISO_NO_TZ_REGEX = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/

const timeFormatterVN = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: VN_TIMEZONE,
})

const dateTimeFormatterVN = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: VN_TIMEZONE,
})

/**
 * Chuẩn hóa chuỗi/số thời gian từ Backend sang đối tượng Date hợp lệ.
 * Tránh lỗi `new Date(null)` trong JS trả về 01/01/1970 ("gần 57 năm trước")
 * và tự động gắn hậu tố 'Z' (UTC) cho chuỗi ISO từ server bị thiếu timezone.
 */
export function parseServerDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime()) || value.getFullYear() <= 1970) {
      return null
    }
    return value
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null
    // Nếu backend trả về epoch seconds (10 chữ số) thì đổi sang milliseconds
    const ms = value < 1e12 ? value * 1000 : value
    const date = new Date(ms)
    return Number.isNaN(date.getTime()) || date.getFullYear() <= 1970 ? null : date
  }

  const trimmed = value.trim()
  if (!trimmed) return null

  const normalized = ISO_NO_TZ_REGEX.test(trimmed)
    ? `${trimmed.replace(' ', 'T')}Z`
    : trimmed

  const date = new Date(normalized)
  if (Number.isNaN(date.getTime()) || date.getFullYear() <= 1970) {
    return null
  }

  return date
}

/**
 * Định dạng giờ:phút (HH:mm) theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
 */
export function formatTimeVN(value: string | number | Date | null | undefined): string {
  const date = parseServerDate(value) ?? new Date()
  return timeFormatterVN.format(date)
}

/**
 * Định dạng ngày giờ đầy đủ (dd/MM/yyyy HH:mm) theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
 */
export function formatDateTimeVN(
  value: string | number | Date | null | undefined,
  placeholder = '—',
): string {
  const date = parseServerDate(value)
  if (!date) return placeholder
  return dateTimeFormatterVN.format(date)
}

/**
 * Tính khoảng thời gian tương đối tới hiện tại bằng tiếng Việt (vd: "dưới 1 phút trước", "5 phút trước").
 * Nếu giá trị truyền vào bị null/undefined (như bài viết vừa tạo chưa kịp flush DB),
 * tự động fallback về thời điểm hiện tại thay vì 1970 ("gần 57 năm trước").
 */
export function formatRelativeTime(value: string | number | Date | null | undefined): string {
  const date = parseServerDate(value)

  if (!date) {
    if (typeof value === 'string' && value.trim().length > 0 && Number.isNaN(new Date(value).getTime())) {
      return value
    }
    return formatDistanceToNow(new Date(), { addSuffix: true, locale: vi })
  }

  return formatDistanceToNow(date, { addSuffix: true, locale: vi })
}

