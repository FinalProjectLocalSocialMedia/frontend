import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { currentLocation, nearbyPosts, type NearbyPost } from '@/lib/mock-nearby'

type PostsContextValue = {
  posts: NearbyPost[]
  savedIds: string[]
  likedIds: string[]
  addPost: (text: string) => void
  removePost: (id: string) => void
  toggleSaved: (id: string) => void
  toggleLiked: (id: string) => void
}

const PostsContext = createContext<PostsContextValue | null>(null)

// Mock "current user" – replace with real auth data once the backend is connected.
export const currentUserHandle = '@minhnguyen'
const author = {
  name: 'Nguyễn Minh',
  handle: currentUserHandle,
  initials: 'NM',
  color: 'bg-amber-100 text-amber-700',
}

const toggle = (items: string[], id: string) =>
  items.includes(id) ? items.filter((item) => item !== id) : [...items, id]

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<NearbyPost[]>(nearbyPosts)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [likedIds, setLikedIds] = useState<string[]>([])

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

  const removePost = useCallback((id: string) => {
    setPosts((items) => items.filter((post) => post.id !== id))
    setSavedIds((items) => items.filter((item) => item !== id))
    setLikedIds((items) => items.filter((item) => item !== id))
  }, [])

  const toggleSaved = useCallback((id: string) => setSavedIds((items) => toggle(items, id)), [])
  const toggleLiked = useCallback((id: string) => setLikedIds((items) => toggle(items, id)), [])

  const value = useMemo(
    () => ({ posts, savedIds, likedIds, addPost, removePost, toggleSaved, toggleLiked }),
    [posts, savedIds, likedIds, addPost, removePost, toggleSaved, toggleLiked],
  )
  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
}

export function usePosts() {
  const ctx = useContext(PostsContext)
  if (!ctx) throw new Error('usePosts must be used inside <PostsProvider>')
  return ctx
}
