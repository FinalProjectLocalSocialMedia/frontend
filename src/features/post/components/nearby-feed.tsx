import { MapPin } from "lucide-react"
import { Spinner } from '@/components/ui/spinner'
import { PostCard } from '@/features/post/components/post-card'
import { Button } from '@/components/ui/button'
import { useCreatePost } from "@/components/layout/create-post-context"
import { useEffect, useState } from "react"
import { InfiniteData, useQueryClient } from "@tanstack/react-query"
import { PostCursorPage } from "../types/post"
import { postKeys, useFeedPosts, useLatestFeedPosts } from "../api/post-queries"
import { useFeedSSE } from "../hooks/use-feed-sse"
import { useInfiniteScroll } from "../hooks/use-infinite-scroll"
import { GeoPoint } from "../types/geo-point"
import { LatestFeed } from "./latest-feed"


export const NearbyFeed = ({ gpsPosition, radiusKm, activeTab, userLocation, isLoadingGps }
    : { gpsPosition: GeoPoint | null; radiusKm: number; activeTab: string; userLocation: any; isLoadingGps: boolean }
) => {

    const openCreate = useCreatePost()
    const [lastSeen, setLastSeen] = useState<{ id?: string; createdAt?: string } | undefined>(undefined)

    const feed = useFeedPosts(
        gpsPosition ? { latitude: gpsPosition.latitude, longitude: gpsPosition.longitude } : undefined,
        radiusKm,
        lastSeen,
    )
    

    const sentinelRef = useInfiniteScroll({
        enabled: activeTab === 'nearby' && !!feed.hasNextPage && !feed.isFetchingNextPage,
        onLoadMore: () => void feed.fetchNextPage(),
    })


    const posts = feed.data?.pages.flatMap((page) => page.items) ?? []


    useEffect(() => {
        if (!posts.length || lastSeen) return

        const firstPost = posts[0]

        setLastSeen({
            id: firstPost.id,
            createdAt: firstPost.createdAt,
        })
    }, [posts, lastSeen])



    console.log('lastSeen:', lastSeen)

    

    

    return (
        <>
            <button
                type="button"
                onClick={openCreate}
                className="w-full rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.02] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                <p className="text-sm font-medium text-muted-foreground">Có gì đang diễn ra quanh bạn?</p>
                <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                    <MapPin className="size-5 text-primary" />
                    {userLocation.isLoading || isLoadingGps ? (
                        <span>Đang tải...</span>
                    ) : (
                        userLocation.data?.placeName ?? userLocation.data?.formattedAddress
                    )}
                </div>
            </button>

            <LatestFeed
                gpsPosition={gpsPosition}
                lastSeen={lastSeen}
                setLastSeen={setLastSeen}
                radiusKm={radiusKm}
            />

            <div className="mt-5 flex flex-col gap-4">
                {posts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={{
                            ...post,
                            likeCount: post.likeCount ?? 0,
                            commentCount: post.commentCount ?? 0,
                        }}
                    />
                ))}

                {feed.isPending && (
                    <div role="status" className="flex justify-center py-12">
                        <Spinner />
                        <span className="sr-only">Đang tải bảng tin</span>
                    </div>
                )}

                {feed.isError && !feed.data && (
                    <div role="alert" className="rounded-2xl border border-destructive/30 bg-card p-5">
                        <p className="text-sm text-destructive">{feed.error.message}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => void feed.refetch()}
                        >
                            Thử lại
                        </Button>
                    </div>
                )}

                {!feed.isPending && !feed.isError && posts.length === 0 && (
                    <p className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
                        Chưa có bài viết nào quanh đây.
                    </p>
                )}

                {feed.isFetchNextPageError && (
                    <p role="alert" className="text-center text-sm text-destructive">
                        Không thể tải thêm bài viết. Vui lòng thử lại.
                    </p>
                )}



                {feed.hasNextPage && (
                    <Button
                        variant="outline"
                        onClick={() => void feed.fetchNextPage()}
                        disabled={feed.isFetchingNextPage}
                        className="self-center"
                    >
                        {feed.isFetchingNextPage ? (
                            <>
                                <Spinner /> Đang tải thêm...
                            </>
                        ) : feed.isFetchNextPageError ? (
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


