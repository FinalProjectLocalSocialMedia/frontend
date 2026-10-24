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

export function maskEmail(email?: string | null): string {
  if (!email) return '—'
  const parts = email.split('@')
  if (parts.length !== 2) return '••••••'
  const [local, domain] = parts
  const maskedLocal = local.length <= 2 ? (local[0] || '') + '***' : local[0] + '***' + local[local.length - 1]
  return `${maskedLocal}@${domain}`
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return '—'
  if (phone.length <= 4) return '••••'
  return phone.slice(0, 3) + '••••' + phone.slice(-3)
}

