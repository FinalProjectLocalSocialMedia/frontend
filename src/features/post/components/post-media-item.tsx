import { cn } from 'cn'
import type { PostMedia } from '../types/post-media'

export function PostMediaItem({
  media,
  controls = true,
  className: customClassName,
}: {
  media: PostMedia
  controls?: boolean
  className?: string
}) {
  const className = cn(
    'aspect-[4/3] w-full bg-muted object-cover',
    media.type === 'VIDEO' && 'object-contain',
    customClassName,
  )

  if (media.type === 'VIDEO') {
    return (
      <video
        aria-label={`Video: ${media.publicId}`}
        className={className}
        controls={controls}
        playsInline
        preload="metadata"
        src={media.url}
      />
    )
  }

  return <img className={className} src={media.url} alt={media.publicId} />
}
