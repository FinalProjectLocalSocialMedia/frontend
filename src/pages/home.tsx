import { Link } from 'react-router-dom'
import { MapPin, Users } from 'lucide-react'
import { useCreatePost } from '@/components/layout/create-post-context'
import { PostCard } from '@/components/post-card'
import { currentLocation, trending } from '@/lib/mock-nearby'
import { usePosts } from '@/lib/posts-context'

export default function HomePage() {
  const { posts } = usePosts()
  const openCreate = useCreatePost()
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-10 lg:py-8">
      <section>
        <header className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Your local pulse
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Home feed</h1>
        </header>
        <button
          type="button"
          onClick={openCreate}
          className="w-full rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.02] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <p className="text-sm font-medium text-muted-foreground">
            What&apos;s happening around you?
          </p>
          <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
            <MapPin className="size-5 text-primary" /> {currentLocation.name}
          </div>
        </button>
        <div className="mt-5 flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
      <aside className="hidden flex-col gap-5 lg:flex lg:pt-[76px]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-5 font-semibold">Trending near you</h2>
          {trending.map((item) => (
            <Link key={item.tag} to="/explore" className="mb-4 block text-left">
              <p className="text-sm font-semibold">{item.tag}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.posts.toLocaleString()} posts · {item.location}
              </p>
            </Link>
          ))}
        </section>
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <h2 className="font-semibold">People nearby</h2>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            24 people you may know are active around {currentLocation.name.split(',')[0]}.
          </p>
        </section>
      </aside>
    </div>
  )
}
