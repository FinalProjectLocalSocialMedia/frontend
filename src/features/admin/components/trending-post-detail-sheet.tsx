import {
  Bookmark,
  Calendar,
  Eye,
  Heart,
  MapPin,
  MessageSquare,
  Share2,
  Sparkles,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDateTime } from '@/features/admin-moderation/lib/formatters'
import { initialsOf } from '@/features/admin-moderation/lib/labels'
import type { TrendingPost } from '@/features/admin-moderation/lib/types'

interface TrendingPostDetailSheetProps {
  post: TrendingPost | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TrendingPostDetailSheet({
  post,
  open,
  onOpenChange,
}: TrendingPostDetailSheetProps) {
  if (!post) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6 space-y-6">
        <SheetHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 font-semibold text-xs"
            >
              <Sparkles className="size-3" />
              Điểm thịnh hành: {post.score}
            </Badge>
          </div>
          <SheetTitle className="text-base font-bold text-foreground">
            Chi tiết bài viết nổi bật
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground font-mono">
            ID: {post.id}
          </SheetDescription>
        </SheetHeader>

        {/* Tác giả & Thời gian */}
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <Avatar className="size-10 border">
            {post.author.avatarUrl && (
              <AvatarImage src={post.author.avatarUrl} alt={post.author.displayName} />
            )}
            <AvatarFallback>{initialsOf(post.author.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">
              {post.author.displayName}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
              <Calendar className="size-3 shrink-0" />
              <span>{formatDateTime(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Địa điểm gắn kèm */}
        {post.locationName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg border">
            <MapPin className="size-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground truncate">{post.locationName}</span>
          </div>
        )}

        {/* Toàn văn nội dung */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Nội dung bài viết
          </h4>
          <div className="rounded-xl border bg-card p-4 text-xs leading-relaxed text-foreground whitespace-pre-wrap select-text">
            {post.content}
          </div>
        </div>

        {/* Phân rã chỉ số tương tác */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Chỉ số tương tác & Trọng số tính điểm
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <Eye className="size-3.5" />
                <span>Lượt xem</span>
              </div>
              <p className="text-base font-bold text-foreground">
                {post.counts.views.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">× 0.05</p>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="flex items-center gap-1.5 text-rose-500 text-[11px]">
                <Heart className="size-3.5 fill-rose-500/20" />
                <span>Lượt thích</span>
              </div>
              <p className="text-base font-bold text-foreground">
                {post.counts.likes.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">× 0.15</p>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="flex items-center gap-1.5 text-blue-500 text-[11px]">
                <MessageSquare className="size-3.5" />
                <span>Bình luận</span>
              </div>
              <p className="text-base font-bold text-foreground">
                {post.counts.comments.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">× 0.30</p>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-500 text-[11px]">
                <Share2 className="size-3.5" />
                <span>Chia sẻ</span>
              </div>
              <p className="text-base font-bold text-foreground">
                {post.counts.shares.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">× 0.40</p>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="flex items-center gap-1.5 text-amber-500 text-[11px]">
                <Bookmark className="size-3.5" />
                <span>Lưu bài</span>
              </div>
              <p className="text-base font-bold text-foreground">
                {post.counts.saves.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">× 0.10</p>
            </div>

            <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-1">
              <div className="flex items-center gap-1.5 text-primary text-[11px] font-medium">
                <Sparkles className="size-3.5" />
                <span>Tổng điểm</span>
              </div>
              <p className="text-base font-extrabold text-primary">{post.score}</p>
              <p className="text-[10px] text-primary/70">Σ (count × weight)</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
