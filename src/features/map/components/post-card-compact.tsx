import { Heart, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeVi } from '../lib/relative-time'
import type { PostCardData } from '../lib/types'

export type PostCardCompactProps = {
  post: PostCardData
  onClick?: () => void
}

/**
 * Thẻ bài viết dạng thu gọn (PostCardCompact) dùng trong modal địa điểm và modal topic (mục 6.4, 6.5).
 * - Hiển thị avatar, tên tác giả, thời gian đăng tương đối bằng tiếng Việt
 * - Hiển thị ảnh đầu tiên với tỷ lệ 4:3 (lazy load) nếu bài viết có hình ảnh
 * - Trích đoạn nội dung tối đa 3 dòng
 * - Tuân thủ nghiêm ngặt quy tắc R3: Đối tượng bài viết tuyệt đối không chứa toạ độ địa lý
 */
export function PostCardCompact({ post, onClick }: PostCardCompactProps) {
  const relativeTime = formatRelativeVi(post.createdAt)
  const authorInitials = post.author.displayName
    ? post.author.displayName.slice(0, 2).toUpperCase()
    : 'U'

  return (
    <Link
      to={`/posts/${post.id}`}
      onClick={onClick}
      className="group flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3 shadow-2xs transition-all hover:border-primary/40 hover:shadow-sm"
    >
      {/* Tác giả và thời gian */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="size-6 shrink-0 ring-1 ring-border">
            {post.author.avatarUrl && (
              <AvatarImage src={post.author.avatarUrl} alt={post.author.displayName} />
            )}
            <AvatarFallback className="text-[10px] font-semibold bg-muted text-muted-foreground">
              {authorInitials}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
            {post.author.displayName}
          </span>
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {relativeTime}
        </span>
      </div>

      {/* Trích đoạn nội dung */}
      <p className="line-clamp-3 text-xs text-foreground/90 leading-relaxed break-words">
        {post.excerpt}
      </p>

      {/* Ảnh đầu tiên (nếu có) tỷ lệ 4:3 */}
      {post.firstImageUrl && (
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
          <img
            src={post.firstImageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-102"
          />
          {post.imageCount > 1 && (
            <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
              +{post.imageCount - 1}
            </span>
          )}
        </div>
      )}

      {/* Chủ đề và tương tác */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1 overflow-hidden">
          {post.topics.slice(0, 2).map((t) => (
            <span key={t} className="text-primary truncate font-medium">
              #{t}
            </span>
          ))}
          {post.topics.length > 2 && (
            <span className="text-muted-foreground">+{post.topics.length - 2}</span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1">
            <Heart className="size-3 text-rose-500 fill-rose-500/20" />
            <span>{post.likeCount}</span>
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3" />
            <span>{post.commentCount}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
