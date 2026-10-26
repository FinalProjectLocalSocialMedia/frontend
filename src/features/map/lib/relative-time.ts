/**
 * Formats an ISO datetime string into relative Vietnamese time:
 * - < 60s: 'vừa xong'
 * - < 60 phút: 'n phút trước'
 * - < 24 giờ: 'n giờ trước'
 * - < 7 ngày: 'n ngày trước'
 * - >= 7 ngày: 'dd/MM/yyyy'
 */
export function formatRelativeVi(isoString: string, nowInput?: Date): string {
  const target = new Date(isoString)
  if (isNaN(target.getTime())) return ''

  const now = nowInput ?? new Date()
  const diffMs = now.getTime() - target.getTime()

  // Guard against slight negative clock skew
  if (diffMs < 60 * 1000) {
    return 'vừa xong'
  }

  const diffMinutes = Math.floor(diffMs / (60 * 1000))
  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`
  }

  const diffHours = Math.floor(diffMs / (60 * 60 * 1000))
  if (diffHours < 24) {
    return `${diffHours} giờ trước`
  }

  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays < 7) {
    return `${diffDays} ngày trước`
  }

  // Format as dd/MM/yyyy
  const day = String(target.getDate()).padStart(2, '0')
  const month = String(target.getMonth() + 1).padStart(2, '0')
  const year = target.getFullYear()
  return `${day}/${month}/${year}`
}

/** Formats an ISO string to full datetime string: 'dd/MM/yyyy HH:mm' */
export function formatFullDateTimeVi(isoString: string): string {
  const target = new Date(isoString)
  if (isNaN(target.getTime())) return ''

  const day = String(target.getDate()).padStart(2, '0')
  const month = String(target.getMonth() + 1).padStart(2, '0')
  const year = target.getFullYear()
  const hours = String(target.getHours()).padStart(2, '0')
  const minutes = String(target.getMinutes()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}`
}
