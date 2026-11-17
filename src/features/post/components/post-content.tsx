import { Link } from 'react-router-dom'

type PostContentProps = {
  content: string
}

export function PostContent({ content }: PostContentProps) {
  const regex =
    /(https?:\/\/[^\s]+|www\.[^\s]+|#[\p{L}\p{N}_]+|[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/gu

  const parts = content.split(regex)

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
    </div>
  )
}
