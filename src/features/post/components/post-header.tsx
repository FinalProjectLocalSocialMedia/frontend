import { Link, useNavigate } from 'react-router-dom'
import { formatRelativeTime } from '@/lib/date-time'
import { PostSearchItem } from '../types/post'
import { UserAvatar } from './user-avatar'

interface PostHeaderProps {
  post: PostSearchItem
}

export function PostHeader({ post }: PostHeaderProps) {
  const navigate = useNavigate()

  const handleLocationClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    const loc = post.location
    const locationName = loc?.name?.trim()
    if (!locationName) return

    const coords = loc?.coordinates
    if (
      coords &&
      typeof coords.latitude === 'number' &&
      typeof coords.longitude === 'number'
    ) {
      navigate(
        `/explore?lat=${coords.latitude.toFixed(5)}&lng=${coords.longitude.toFixed(5)}&z=17`,
        {
          state: {
            pinnedPlace: {
              name: locationName,
              location: {
                latitude: coords.latitude,
                longitude: coords.longitude,
              },
            },
          },
        },
      )
      return
    }

    navigate('/explore', {
      state: {
        pinLocationName: locationName,
      },
    })
  }

  return (
    <div className="inline-flex max-w-full items-start gap-3">
      <Link
        to={`/profile/${post.author.id}`}
        aria-label={`Xem bài viết của ${post.author.fullName}`}
        className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <UserAvatar user={post.author} />
      </Link>

      <div className="min-w-0">
        <Link
          to={`/profile/${post.author.id}`}
          className="block truncate text-sm font-semibold hover:underline outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
        >
          {post.author.fullName}
        </Link>

        <div className="mt-0.5 flex flex-wrap items-center text-xs text-muted-foreground">
          <Link
            to={`/posts/${post.id}`}
            className="hover:underline outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
          >
            {formatRelativeTime(post.createdAt)}
          </Link>

          {post.location?.name && (
            <>
              <span className="px-1">·</span>
              <button
                type="button"
                onClick={handleLocationClick}
                aria-label={`Tìm kiếm địa điểm ${post.location.name} trên bản đồ`}
                className="truncate text-left font-medium text-muted-foreground transition-colors hover:text-primary hover:underline cursor-pointer rounded-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {post.location.name}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
