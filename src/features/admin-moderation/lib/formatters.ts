import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

export function formatDateTime(value: string | Date | undefined | null, fallback = '—'): string {
  if (!value) return fallback
  try {
    const date = typeof value === 'string' ? parseISO(value) : value
    if (isNaN(date.getTime())) return fallback
    return format(date, 'dd/MM/yyyy HH:mm', { locale: vi })
  } catch {
    return fallback
  }
}

export function formatDate(value: string | Date | undefined | null, fallback = '—'): string {
  if (!value) return fallback
  try {
    const date = typeof value === 'string' ? parseISO(value) : value
    if (isNaN(date.getTime())) return fallback
    return format(date, 'dd/MM/yyyy', { locale: vi })
  } catch {
    return fallback
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
