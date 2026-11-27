import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Flame } from "lucide-react"
import { PostCard } from "./post-card"
import { TrendingPostDto } from "../types/trending"
import { UseQueryResult } from "@tanstack/react-query"
import { useMemo } from "react"
import { PostSearchItem } from "../types/post"


function mapTrendingDtoToPostSearchItem(dto: TrendingPostDto): PostSearchItem {
  let media = null
  if (dto.mediaJson) {
    try {
      media = JSON.parse(dto.mediaJson)
    } catch {
      media = null
    }
  }

  return {
    id: dto.postId,
    author: {
      id: dto.authorId || '',
      fullName: dto.authorName || 'Người dùng',
      avatarUrl: dto.authorAvatarUrl,
    },
    content: dto.content || '',
    media,
    location: dto.locationName ? { name: dto.locationName } : null,
    status: 'ACTIVE',
    likeCount: Math.round(dto.score || 0),
    commentCount: 0,
    createdAt: dto.createdAt || new Date().toISOString(),
  }
}

export const TrendingFeed = ({trendingPostsQuery}: {trendingPostsQuery: UseQueryResult<TrendingPostDto[], Error>}) => {

    const trendingPosts = (trendingPostsQuery.data ?? []).map(mapTrendingDtoToPostSearchItem)
  

    return (
        <>
            {trendingPostsQuery.isPending && (
                <div role="status" className="flex justify-center py-12">
                    <Spinner />
                    <span className="sr-only">Đang tải bài viết thịnh hành</span>
                </div>
            )}

            {trendingPostsQuery.isError && (
                <div role="alert" className="rounded-2xl border border-destructive/30 bg-card p-5">
                    <p className="text-sm text-destructive">
                        {trendingPostsQuery.error?.message || 'Không thể tải danh sách thịnh hành.'}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => void trendingPostsQuery.refetch()}
                    >
                        Thử lại
                    </Button>
                </div>
            )}

            {!trendingPostsQuery.isPending &&
                !trendingPostsQuery.isError &&
                trendingPosts.length === 0 && (
                    <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
                        <Flame className="mx-auto mb-2 size-8 text-orange-500/60" />
                        <p className="font-medium text-foreground">Chưa có bài viết thịnh hành nào.</p>
                        <p className="mt-1 text-xs">
                            Hãy bấm Like hoặc tạo bài viết mới để hệ thống tính điểm Trending theo thời gian thực!
                        </p>
                    </div>
                )}

            {trendingPosts.map((post, index) => (
                <div key={post.id} className="relative flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 px-1 text-xs font-semibold text-orange-500">
                        <Flame className="size-3.5 fill-orange-500" />
                        <span>
                            Top #{index + 1} Thịnh hành · {post.likeCount} điểm tương tác
                        </span>
                    </div>
                    <PostCard post={post} />
                </div>
            ))}
        </>
    )
}