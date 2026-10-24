import { useState } from 'react'
import {
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
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { POST_PREVIEW_CHARS } from '@/features/admin-moderation/lib/constants'
import { formatDateTime, truncateText } from '@/features/admin-moderation/lib/formatters'
import { initialsOf } from '@/features/admin-moderation/lib/labels'
import type { TrendingPost } from '@/features/admin-moderation/lib/types'
import { cn } from '@/lib/utils'
import { TrendingPostDetailSheet } from './trending-post-detail-sheet'

interface TrendingPostsCardProps {
  posts?: TrendingPost[]
  isLoading?: boolean
}

export function TrendingPostsCard({
  posts = [],
  isLoading = false,
}: TrendingPostsCardProps) {
  const [selectedPost, setSelectedPost] = useState<TrendingPost | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleRowClick = (post: TrendingPost) => {
    setSelectedPost(post)
    setSheetOpen(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44 mb-2" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                Bài viết thịnh hành
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Xếp hạng theo điểm tương tác tổng hợp từ lượt xem, thích, bình luận, chia sẻ và lưu bài
              </CardDescription>
            </div>
            <div className="text-[11px] text-muted-foreground bg-muted/30 px-2.5 py-1 rounded border">
              Nhấn vào dòng bất kỳ để xem toàn văn bài viết
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {posts.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Chưa có dữ liệu bài viết thịnh hành trong khoảng thời gian này
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs hover:bg-transparent">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead className="w-[180px]">Tác giả</TableHead>
                    <TableHead className="min-w-[280px]">Nội dung bài viết</TableHead>
                    <TableHead className="w-[180px]">Tương tác</TableHead>
                    <TableHead className="w-24 text-right">Điểm số</TableHead>
                    <TableHead className="w-20 text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post, index) => (
                    <TableRow
                      key={post.id}
                      onClick={() => handleRowClick(post)}
                      className="text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-mono text-center text-muted-foreground">
                        <span
                          className={cn(
                            'inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
                            index === 0 && 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold',
                            index === 1 && 'bg-slate-500/20 text-slate-700 dark:text-slate-300',
                            index === 2 && 'bg-amber-700/20 text-amber-900 dark:text-amber-500',
                            index > 2 && 'text-muted-foreground'
                          )}
                        >
                          {index + 1}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-7 shrink-0">
                            {post.author.avatarUrl && (
                              <AvatarImage
                                src={post.author.avatarUrl}
                                alt={post.author.displayName}
                              />
                            )}
                            <AvatarFallback className="text-[10px]">
                              {initialsOf(post.author.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {post.author.displayName}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Calendar className="size-2.5 shrink-0" />
                              <span>{formatDateTime(post.createdAt).slice(0, 10)}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <p className="line-clamp-2 text-foreground font-normal leading-relaxed">
                            {truncateText(post.content, POST_PREVIEW_CHARS)}
                          </p>
                          {post.locationName && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MapPin className="size-2.5 text-primary shrink-0" />
                              <span className="truncate">{post.locationName}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground font-mono">
                          <span className="flex items-center gap-1" title="Lượt xem">
                            <Eye className="size-3 text-muted-foreground/70" />
                            {post.counts.views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1" title="Lượt thích">
                            <Heart className="size-3 text-rose-500/70" />
                            {post.counts.likes.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1" title="Lượt bình luận">
                            <MessageSquare className="size-3 text-blue-500/70" />
                            {post.counts.comments.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1" title="Lượt chia sẻ">
                            <Share2 className="size-3 text-emerald-500/70" />
                            {post.counts.shares.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold font-mono text-xs"
                        >
                          {post.score}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick(post)
                          }}
                          className="text-[11px] h-7 px-2"
                        >
                          Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TrendingPostDetailSheet
        post={selectedPost}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  )
}
