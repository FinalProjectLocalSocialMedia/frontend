import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { formatDateTimeVN, formatRelativeTime, parseServerDate } from '@/lib/date-time'

type DateTimeProps = {
  value: string | Date | undefined | null
  mode?: 'absolute' | 'relative' | 'both'
  formatString?: string
  className?: string
  placeholder?: string
}

/**
 * Hiển thị thời gian định dạng chuẩn tiếng Việt kèm thẻ <time dateTime=...>.
 */
export function DateTime({
  value,
  mode = 'absolute',
  formatString = 'dd/MM/yyyy HH:mm',
  className,
  placeholder = '—',
}: DateTimeProps) {
  const date = parseServerDate(value)
  if (!date) {
    return <span className={className}>{placeholder}</span>
  }

  const iso = date.toISOString()
  const absoluteText =
    formatString === 'dd/MM/yyyy HH:mm'
      ? formatDateTimeVN(date, placeholder)
      : format(date, formatString, { locale: vi })
  const relativeText = formatRelativeTime(date)

  let displayText = absoluteText
  if (mode === 'relative') {
    displayText = relativeText
  } else if (mode === 'both') {
    displayText = `${relativeText} (${absoluteText})`
  }

  return (
    <time dateTime={iso} title={absoluteText} className={className}>
      {displayText}
    </time>
  )
}
