import { useSearchParams } from 'react-router-dom'
import { PostSearchForm } from '@/features/post/components/post-search-form'

import { useInfiniteScroll } from '@/features/post/hooks/use-infinite-scroll'
import { usePostSearch } from '@/features/post/hooks/use-post-search'
import { PostSearchResults } from '../components/post-search-result'
import { PostSearchItem } from '../types/post'

export default function PostSearch() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const search = usePostSearch(query)

  const sentinelRef = useInfiniteScroll({
    enabled: !!search.hasNextPage && !search.isFetchingNextPage,
    onLoadMore: () => void search.fetchNextPage(),
  })

  const posts: PostSearchItem[] =
    search.data?.pages
      .flatMap((page) => page.items)
      .map((post) => ({
        ...post,
        likeCount: post.likeCount ?? 0,
        commentCount: post.commentCount ?? 0,
      })) ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:py-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Discover</p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Search posts</h1>

        <div className="mt-4">
          <PostSearchForm />
        </div>
      </header>

      <PostSearchResults
        query={query}
        posts={posts}
        isPending={search.isPending}
        isError={search.isError}
        errorMessage={search.error?.message}
        hasData={!!search.data}
        hasNextPage={!!search.hasNextPage}
        isFetchingNextPage={search.isFetchingNextPage}
        isFetchNextPageError={search.isFetchNextPageError}
        onRetry={() => void search.refetch()}
        onFetchNextPage={() => void search.fetchNextPage()}
      />

      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
    </div>
  )
}
