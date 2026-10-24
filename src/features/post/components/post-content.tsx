import { Link } from 'react-router-dom'

type PostContentProps = {
  content: string
}

export function PostContent({ content }: PostContentProps) {
  const parts = content.split(/(#[\p{L}\p{N}_]+)/u)

  return (
    <div className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (/^#[\p{L}\p{N}_]+$/u.test(part)) {
          const tag = part.slice(1)

          return (
            <Link
              key={`${index}-${part}`}
              to={`?q=${encodeURIComponent(tag)}`}
              className="font-semibold text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              {part}
            </Link>
          )
        }

        return <span key={index}>{part}</span>
      })}
    </div>
  )
}
