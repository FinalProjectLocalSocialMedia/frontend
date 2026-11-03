import { createContext, useContext, useState, type ReactNode } from 'react'

type PostInteractionsContextValue = {
  savedIds: string[]
  likedIds: string[]
  removedIds: string[]
  removePost: (id: string) => void
  toggleSaved: (id: string) => void
  toggleLiked: (id: string) => void
}

const PostInteractionsContext = createContext<PostInteractionsContextValue | null>(null)

const toggle = (items: string[], id: string) =>
  items.includes(id) ? items.filter((item) => item !== id) : [...items, id]

export function PostInteractionsProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [likedIds, setLikedIds] = useState<string[]>([])
  const [removedIds, setRemovedIds] = useState<string[]>([])

  function removePost(id: string) {
    setRemovedIds((items) => (items.includes(id) ? items : [...items, id]))
    setSavedIds((items) => items.filter((item) => item !== id))
    setLikedIds((items) => items.filter((item) => item !== id))
  }

  function toggleSaved(id: string) {
    setSavedIds((items) => toggle(items, id))
  }

  function toggleLiked(id: string) {
    setLikedIds((items) => toggle(items, id))
  }

  return (
    <PostInteractionsContext.Provider
      value={{ savedIds, likedIds, removedIds, removePost, toggleSaved, toggleLiked }}
    >
      {children}
    </PostInteractionsContext.Provider>
  )
}

export function usePostInteractions() {
  const context = useContext(PostInteractionsContext)
  if (!context) {
    throw new Error('usePostInteractions must be used inside <PostInteractionsProvider>')
  }
  return context
}
