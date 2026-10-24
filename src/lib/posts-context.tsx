import { createContext,  useContext, useState, type ReactNode } from 'react'
import type { PostCursorPage } from '@/features/post/types/post'

type PostsContextValue = {
  posts: PostCursorPage
  savedIds: string[]
  likedIds: string[]
  addPost: (post: PostCursorPage) => void
  nextPost:(post: PostCursorPage) => void
  removePost: (id: string) => void
  toggleSaved: (id: string) => void
  toggleLiked: (id: string) => void
}

const PostsContext = createContext<PostsContextValue | null>(null)

export const currentUserId = 'minhnguyen'
export const currentUserHandle = '@minhnguyen'

const toggle = (items: string[], id: string) =>
  items.includes(id) ? items.filter((item) => item !== id) : [...items]

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<PostCursorPage>({
    items: [],
    page: { 
    nextCursor: null,
    hasMore: false,
    },
  })
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [likedIds, setLikedIds] = useState<string[]>([])

  const addPost = (post: PostCursorPage) => {
    setPosts((current) => ({
      ...current,
      items: [
        ...post.items.filter((item) => !current.items.some((existing) => existing.id === item.id)),
        ...current.items,
      ],
    }))
  }
  
const nextPost = (post: PostCursorPage) => {
  setPosts((current) => ({
    ...current,
    items: [
      ...current.items,
      ...post.items.filter(
        (item) => !current.items.some(
          (existing) => existing.id === item.id
        )
      ),
    ],
    page: post.page,
  }))
}

  function removePost(id: string) {
    setPosts((current) => ({
      ...current,
      items: current.items.filter((post) => post.id !== id),
    }))
    setSavedIds((items) => items.filter((item) => item !== id))
    setLikedIds((items) => items.filter((item) => item !== id))
  }

  function toggleSaved(id: string) {
    setSavedIds((items) => toggle(items, id))
  }

  function toggleLiked(id: string) {
    setLikedIds((items) => toggle(items, id))
  }

  const value = {
    posts,
    savedIds,
    likedIds,
    addPost,
    nextPost,
    removePost,
    toggleSaved,
    toggleLiked,
  }
  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
}

export function usePosts() {
  const ctx = useContext(PostsContext)
  if (!ctx) throw new Error('usePosts must be used inside <PostsProvider>')
  return ctx
}
