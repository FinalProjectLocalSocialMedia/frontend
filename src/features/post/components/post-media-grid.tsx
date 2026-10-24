import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PostMediaItem } from './post-media-item'
import { PostMediaModal } from './post-media-modal'
import { PostSearchItem } from '../types/post'

interface PostMediaGridProps {
  media?: PostSearchItem['media']
}

export function PostMediaGrid({ media }: PostMediaGridProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null)
  const visibleMedia = media?.slice(0, 4) ?? []
  const remainingMediaCount = (media?.length ?? 0) - visibleMedia.length

  if (visibleMedia.length === 0) return null

  return (
    <>
      <div
        role="group"
        aria-label="Post media"
        className={cn(
          'mt-4 ml-11 grid gap-2 overflow-hidden rounded-xl',
          visibleMedia.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
        )}
      >
        {visibleMedia.map((item, index) => (
          <button
            key={`${item.assetId}-${index}`}
            type="button"
            aria-label={`Open media ${index + 1}`}
            className="relative block w-full overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setActiveMediaIndex(index)}
          >
            <PostMediaItem media={item} controls={false} />
            {index === 3 && remainingMediaCount > 0 && (
              <span
                aria-label={`${remainingMediaCount} more media items`}
                className="absolute inset-0 flex items-center justify-center bg-foreground/70 text-2xl font-semibold text-background"
              >
                +{remainingMediaCount}
              </span>
            )}
          </button>
        ))}
      </div>
      {activeMediaIndex !== null && media && (
        <PostMediaModal
          media={media}
          initialIndex={activeMediaIndex}
          onClose={() => setActiveMediaIndex(null)}
        />
      )}
    </>
  )
}
