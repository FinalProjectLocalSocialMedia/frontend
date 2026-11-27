import { GeoPoint } from "@/components/map/map-types";
import { useFeedSSE } from "../hooks/use-feed-sse";
import { PostCursorPage } from "../types/post";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { postKeys, useLatestFeedPosts } from "../api/post-queries";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";


export const LatestFeed = ({ gpsPosition, radiusKm, lastSeen, setLastSeen}
    : { gpsPosition: GeoPoint | null; radiusKm: number; 
        lastSeen:{ id?: string; createdAt?: string } | undefined,
        setLastSeen: any }
) => {

    const latestFeed = useLatestFeedPosts(
        gpsPosition ? { latitude: gpsPosition.latitude, longitude: gpsPosition.longitude } : undefined,
        radiusKm,
        lastSeen,
    )

    const queryClient = useQueryClient()
    const { hasNewPosts, clearNewPosts } = useFeedSSE()
    const mergeLatestPosts = (data: InfiniteData<PostCursorPage, unknown>) => {
        const latestItems = data.pages.flatMap((page) => page.items)
        const newestPost = latestItems[0]

        queryClient.setQueryData<InfiniteData<PostCursorPage, string | undefined>>(
            postKeys.feed(),
            (current) => mergeLatestFeed(current, data.pages),
        )
        if (newestPost) {
            setLastSeen({
                id: newestPost.id,
                createdAt: newestPost.createdAt,
            })
        }
    }

    const handleLoadLatest = async () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })

        const result = await latestFeed.refetch()
        if (result.data) {
            mergeLatestPosts(result.data)
            clearNewPosts()
        }
    }

    const handleLoadMoreLatest = async () => {
        const result = await latestFeed.fetchNextPage()
        if (result.data) {
            mergeLatestPosts(result.data)
        }
    }

    return (
        <>
            {(hasNewPosts) && (
                <div className="sticky top-2 z-20 mt-5 flex justify-center">
                    <Button
                        size="sm"
                        onClick={() => void handleLoadLatest()}
                        disabled={latestFeed.isFetching}
                        className="rounded-full shadow-md"
                    >
                        {latestFeed.isFetching ? (
                            <>
                                <Spinner /> Đang tải bài mới...
                            </>
                        ) : (
                            'Có bài viết mới'
                        )}
                    </Button>
                </div>
            )}
            {latestFeed.hasNextPage && (
                <Button
                    variant="outline"
                    onClick={() => void handleLoadMoreLatest()}
                    disabled={latestFeed.isFetchingNextPage}
                    className="self-center"
                >
                    {latestFeed.isFetchingNextPage ? (
                        <>
                            <Spinner /> Đang tải bài mới...
                        </>
                    ) : latestFeed.isFetchNextPageError ? (
                        'Thử tải lại bài mới'
                    ) : (
                        'Xem thêm bài mới'
                    )}
                </Button>
            )}
        </>
    )

}

function mergeLatestFeed(
    current: InfiniteData<PostCursorPage, string | undefined> | undefined,
    latestPages: PostCursorPage[],
): InfiniteData<PostCursorPage, string | undefined> {
    const latestItems = latestPages.flatMap((page) => page.items)
    const seen = new Set<string>()
    const uniqueLatestItems = latestItems.filter((item) => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
    })

    if (!current?.pages.length) {
        return {
            pages: [
                {
                    items: uniqueLatestItems,
                    page: { nextCursor: null, hasMore: false },
                },
            ],
            pageParams: [undefined],
        }
    }

    const existingIds = new Set(current.pages.flatMap((page) => page.items.map((item) => item.id)))
    const newItems = uniqueLatestItems.filter((item) => !existingIds.has(item.id))

    return {
        ...current,
        pages: [
            {
                ...current.pages[0],
                items: [...newItems, ...current.pages[0].items],
            },
            ...current.pages.slice(1),
        ],
    }
}