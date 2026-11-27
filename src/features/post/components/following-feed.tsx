import { Spinner } from "@/components/ui/spinner"
import { useFollowingPosts } from "../api/post-queries"
import { useInfiniteScroll } from "../hooks/use-infinite-scroll"
import { PostCard } from "./post-card"
import { Button } from "@/components/ui/button"


export const FollowingFeed = ({activeTab}: {activeTab: string}) => {
    const followingFeed = useFollowingPosts()
    
    const sentinelRef = useInfiniteScroll({
        enabled: activeTab === 'following' && !!followingFeed.hasNextPage && !followingFeed.isFetchingNextPage,
        onLoadMore: () => void followingFeed.fetchNextPage(),
    })
    const followingPosts = followingFeed.data?.pages.flatMap((page) => page.items) ?? []

    return (
        <>
             <div className="mt-5 flex flex-col gap-4">
                {followingPosts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={{
                            ...post,
                            likeCount: post.likeCount ?? 0,
                            commentCount: post.commentCount ?? 0,
                        }}
                    />
                ))}

                {followingFeed.isPending && (
                    <div role="status" className="flex justify-center py-12">
                        <Spinner />
                        <span className="sr-only">Đang tải bảng tin</span>
                    </div>
                )}

                {followingFeed.isError && !followingFeed.data && (
                    <div role="alert" className="rounded-2xl border border-destructive/30 bg-card p-5">
                        <p className="text-sm text-destructive">{followingFeed.error.message}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => void followingFeed.refetch()}
                        >
                            Thử lại
                        </Button>
                    </div>
                )}

                {!followingFeed.isPending && !followingFeed.isError && followingPosts.length === 0 && (
                    <p className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
                        Chưa có bài viết nào quanh đây.
                    </p>
                )}

                {followingFeed.isFetchNextPageError && (
                    <p role="alert" className="text-center text-sm text-destructive">
                        Không thể tải thêm bài viết. Vui lòng thử lại.
                    </p>
                )}



                {followingFeed.hasNextPage && (
                    <Button
                        variant="outline"
                        onClick={() => void followingFeed.fetchNextPage()}
                        disabled={followingFeed.isFetchingNextPage}
                        className="self-center"
                    >
                        {followingFeed.isFetchingNextPage ? (
                            <>
                                <Spinner /> Đang tải thêm...
                            </>
                        ) : followingFeed.isFetchNextPageError ? (
                            'Thử tải lại'
                        ) : (
                            'Xem thêm'
                        )}
                    </Button>
                )}
                <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
            </div>
        </>
    )

}