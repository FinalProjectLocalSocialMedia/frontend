import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { currentLocation, nearbyPosts, type NearbyPost } from '@/lib/mock-nearby'

type PostsContextValue = {
  posts: NearbyPost[]
  addPost: (text: string) => void
}

const PostsContext = createContext<PostsContextValue | null>(null)

// Mock "current user" – replace with real auth data once the backend is connected.
const author = {
  name: 'Nguyễn Minh',
  handle: '@minhnguyen',
  initials: 'NM',
  color: 'bg-amber-100 text-amber-700',
}

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<NearbyPost[]>(nearbyPosts)

  const addPost = useCallback((text: string) => {
    const post: NearbyPost = {
      ...author,
      id: `local-${Date.now()}`,
      time: 'Just now',
      location: currentLocation.name,
      text,
      topic: text.match(/#[\p{L}\p{N}_]+/u)?.[0] ?? '#Nearby',
      likes: '0',
      comments: '0',
    }
    setPosts((items) => [post, ...items])
  }, [])

  const value = useMemo(() => ({ posts, addPost }), [posts, addPost])
  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
}

export function usePosts() {
  const ctx = useContext(PostsContext)
  if (!ctx) throw new Error('usePosts must be used inside <PostsProvider>')
  return ctx
}
