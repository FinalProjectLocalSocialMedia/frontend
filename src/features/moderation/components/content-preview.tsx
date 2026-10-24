import { useState } from 'react'
import {
  Bookmark,
  Eye,
  FileText,
  Hash,
  Heart,
  MapPin,
  MessageCircle,
  MessageSquare,
  Share2,
  User,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyId } from '@/features/admin-moderation/components/copy-id'
import { DateTime } from '@/features/admin-moderation/components/date-time'
import { StatusBadge } from '@/features/admin-moderation/components/status-badge'
import { initialsOf } from '@/features/admin-moderation/lib/labels'
import type { ReportTarget } from '@/features/admin-moderation/lib/types'

type ContentPreviewProps = {
  target: ReportTarget
  className?: string
}

/**
 * Bản xem trước nội dung bị báo cáo (Bài viết / Bình luận / Người dùng).
 * Xử lý nội dung dài với toggle "Xem thêm / Thu gọn" và hiển thị đầy đủ thông tin metadata.
 */
export function ContentPreview({ target, className }: ContentPreviewProps) {
  const [expanded, setExpanded] = useState(false)

  if (target.type === 'POST') {
    const isLong = target.content.length > 250
    const displayedContent =
      isLong && !expanded ? `${target.content.slice(0, 250)}...` : target.content

    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Avatar size="default">
                {target.author.avatarUrl && (
                  <AvatarImage src={target.author.avatarUrl} alt={target.author.displayName} />
                )}
                <AvatarFallback>{initialsOf(target.author.displayName)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">
                    {target.author.displayName}
                  </span>
                  <StatusBadge type="user-status" value={target.author.status} />
                </div>
                <div className="text-xs text-muted-foreground">
                  <DateTime value={target.createdAt} mode="both" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {target.isShare && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Share2 className="size-3" /> Chia sẻ
                </Badge>
              )}
              <StatusBadge type="post-status" value={target.status} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Nội dung bài viết */}
          <div className="rounded-lg bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {displayedContent}
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="ml-2 font-medium text-primary hover:underline focus:outline-hidden"
              >
                {expanded ? 'Thu gọn' : 'Xem thêm'}
              </button>
            )}
          </div>

          {/* Hashtags */}
          {target.hashtags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {target.hashtags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 text-xs font-normal">
                  <Hash className="size-3 text-muted-foreground" />
                  {tag.replace(/^#/, '')}
                </Badge>
              ))}
            </div>
          )}

          {/* Địa điểm */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground">{target.location.name}</span>
            <span>
              ({target.location.latitude.toFixed(4)}, {target.location.longitude.toFixed(4)})
            </span>
          </div>

          {/* Bộ đếm tương tác */}
          <div className="flex flex-wrap items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="size-3.5" /> {target.counts.views} lượt xem
            </span>
            <span className="flex items-center gap-1">
              <Heart className="size-3.5" /> {target.counts.likes} thích
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3.5" /> {target.counts.comments} bình luận
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="size-3.5" /> {target.counts.shares} chia sẻ
            </span>
            <span className="flex items-center gap-1">
              <Bookmark className="size-3.5" /> {target.counts.saves} lưu
            </span>
          </div>

          {/* ID thực thể */}
          <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileText className="size-3.5" /> Mã bài viết:
            </span>
            <CopyId id={target.id} truncate={false} />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (target.type === 'COMMENT') {
    const isLong = target.content.length > 250
    const displayedContent =
      isLong && !expanded ? `${target.content.slice(0, 250)}...` : target.content

    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Avatar size="default">
                {target.author.avatarUrl && (
                  <AvatarImage src={target.author.avatarUrl} alt={target.author.displayName} />
                )}
                <AvatarFallback>{initialsOf(target.author.displayName)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">
                    {target.author.displayName}
                  </span>
                  <StatusBadge type="user-status" value={target.author.status} />
                </div>
                <div className="text-xs text-muted-foreground">
                  <DateTime value={target.createdAt} mode="both" />
                </div>
              </div>
            </div>

            <StatusBadge type="post-status" value={target.status} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="rounded-lg bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {displayedContent}
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="ml-2 font-medium text-primary hover:underline focus:outline-hidden"
              >
                {expanded ? 'Thu gọn' : 'Xem thêm'}
              </button>
            )}
          </div>

          {/* Tham chiếu bài viết gốc */}
          <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileText className="size-3.5" /> Thuộc bài viết gốc:
            </span>
            <CopyId id={target.postId} truncate={true} prefixChars={8} suffixChars={6} />
          </div>

          {/* ID thực thể bình luận */}
          <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MessageCircle className="size-3.5" /> Mã bình luận:
            </span>
            <CopyId id={target.id} truncate={false} />
          </div>
        </CardContent>
      </Card>
    )
  }

  // target.type === 'USER'
  const user = target.user
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar size="default">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
              <AvatarFallback>{initialsOf(user.displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">{user.displayName}</span>
                <StatusBadge type="user-status" value={user.status} />
                <StatusBadge type="role" value={user.role} />
              </div>
              <div className="text-xs text-muted-foreground">
                Tạo lúc: <DateTime value={user.createdAt} formatString="dd/MM/yyyy" />
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Khối cảnh báo nếu tài khoản đang bị khoá */}
        {target.lock && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <p className="font-semibold">Tài khoản đang bị khoá:</p>
            <p className="mt-1">Lý do: {target.lock.reason}</p>
            <p className="mt-1 text-[11px] opacity-80">
              Khoá bởi {target.lock.lockedBy.email} vào{' '}
              <DateTime value={target.lock.lockedAt} formatString="dd/MM/yyyy HH:mm" />
            </p>
          </div>
        )}

        {/* Thống kê tài khoản */}
        {user.stats && (
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3 text-center text-xs">
            <div>
              <div className="text-base font-bold text-foreground">{user.stats.posts}</div>
              <div className="text-muted-foreground">Bài đăng</div>
            </div>
            <div>
              <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                {user.stats.reportsAgainst}
              </div>
              <div className="text-muted-foreground">Bị báo cáo</div>
            </div>
            <div>
              <div className="text-base font-bold text-destructive">{user.stats.warnings}</div>
              <div className="text-muted-foreground">Cảnh báo</div>
            </div>
          </div>
        )}

        {/* Bài viết gần đây */}
        {target.recentPosts && target.recentPosts.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Bài viết gần đây
            </CardTitle>
            <div className="space-y-1.5">
              {target.recentPosts.map((p) => (
                <div key={p.id} className="rounded-md border p-2 text-xs">
                  <p className="line-clamp-2 text-foreground">{p.content}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    <DateTime value={p.createdAt} mode="relative" />
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ID tài khoản */}
        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="size-3.5" /> Mã người dùng:
          </span>
          <CopyId id={user.id} truncate={false} />
        </div>
      </CardContent>
    </Card>
  )
}
