import { useState } from 'react'
import { Link } from 'react-router-dom'

export const POST_CONTENT_TRUNCATE_LENGTH = 280

type PostContentProps = {
  content: string
  onExpand?: () => void
}

export function PostContent({ content, onExpand }: PostContentProps) {
  const [expanded, setExpanded] = useState(false)
  const shouldTruncate = !expanded && content.length > POST_CONTENT_TRUNCATE_LENGTH
  const displayedContent = shouldTruncate
    ? `${content.slice(0, POST_CONTENT_TRUNCATE_LENGTH).trimEnd()}…`
    : content

  const regex =
    /(https?:\/\/[^\s]+|www\.[^\s]+|#[\p{L}\p{N}_]+|[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/gu

  const parts = displayedContent.split(regex)

  return (
    <div className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (/^#[\p{L}\p{N}_]+$/u.test(part)) {
          const tag = part.slice(1)

          return (
            <Link
              key={`${index}-${part}`}
              to={`/search?q=${encodeURIComponent(tag)}`}
              className="font-semibold text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              {part}
            </Link>
          )
        }
        if (/^(https?:\/\/|www\.)/i.test(part)) {
          const url = part.startsWith('www.')
            ? `https://${part}`
            : part

          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          )
        }

        // Email
        if (/^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(part)) {
          return (
            <a
              key={index}
              href={`mailto:${part}`}
              className="text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          )
        }

        return <span key={index}>{part}</span>
      })}
      {shouldTruncate && (
        <>
          {' '}
          <button
            type="button"
            className="cursor-pointer font-semibold text-primary hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              onExpand?.()
              setExpanded(true)
            }}
          >
            Xem thêm
          </button>
        </>
      )}
    </div>
  )
}
