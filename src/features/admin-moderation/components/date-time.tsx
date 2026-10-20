import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

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
  if (!value) {
    return <span className={className}>{placeholder}</span>
  }

  const date = typeof value === 'string' ? parseISO(value) : value
  if (isNaN(date.getTime())) {
    return <span className={className}>{placeholder}</span>
  }

  const iso = date.toISOString()
  const absoluteText = format(date, formatString, { locale: vi })
  const relativeText = formatDistanceToNow(date, { addSuffix: true, locale: vi })

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
