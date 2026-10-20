import { createContext, useContext, useState, type ReactNode } from 'react'
import { currentLocation, nearbyPosts } from '@/lib/mock-nearby'
import type { Post } from '@/features/post/types/Post'
import type { NormalUser } from '@/features/post/types/NormalUser'

type PostsContextValue = {
  posts: Post[]
  savedIds: string[]
  likedIds: string[]
  addPost: (text: string) => void
  removePost: (id: string) => void
  toggleSaved: (id: string) => void
  toggleLiked: (id: string) => void
}

const PostsContext = createContext<PostsContextValue | null>(null)

export const currentUserId = 'minhnguyen'
export const currentUserHandle = '@minhnguyen'

const currentUser: NormalUser = {
  id: currentUserId,
  fullName: 'Nguyễn Minh',
  avatarUrl: '',
  bio: '',
  dateOfBirth: '',
  gender: '',
  currentLocation: {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
  },
  currentH3Index: '',
  locationUpdateAt: new Date().toISOString(),
}

const toggle = (items: string[], id: string) =>
  items.includes(id) ? items.filter((item) => item !== id) : [...items, id]

function toPost(post: (typeof nearbyPosts)[number]): Post {
  const minutesAgo = Number.parseInt(post.time, 10)
  const createdAt = new Date(
    Date.now() - (Number.isNaN(minutesAgo) ? 0 : minutesAgo) * 60_000,
  ).toISOString()

  return {
    id: post.id,
    author: {
      ...currentUser,
      id: post.handle.replace(/^@/, ''),
      fullName: post.name,
    },
    content: post.text,
    media: '',
    location: {
      id: post.id,
      name: post.location,
      description: '',
      h3Index: '',
      locationType: '',
    },
    status: 'PUBLISHED',
    createdAt,
    updatedAt: createdAt,
    sharedPost: null,
    likeCount: Number.parseInt(post.likes.replace(/,/g, ''), 10) || 0,
    commentCount: Number.parseInt(post.comments.replace(/,/g, ''), 10) || 0,
    shareCount: 0,
    comments: [{
      id: '1',
      author: currentUser,
      content: 'me too',
      media: null,
      createdAt: '2023-06-01T12:00:00Z',
      updatedAt: '2023-06-01T12:00:00Z',
      parentComment: null,
      likes:  null
    },
    {
      id: '2',
      author: currentUser,
      content: 'me too 2',
      media: null,
      createdAt: '2023-06-01T12:00:00Z',
      updatedAt: '2023-06-01T12:00:00Z',
      parentComment: null,
      likes:  null
    }
  
  ],
    likes: null,
  }
}

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(() => nearbyPosts.map(toPost))
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [likedIds, setLikedIds] = useState<string[]>([])

  function addPost(text: string) {
    const now = new Date().toISOString()
    const post: Post = {
      id: `local-${Date.now()}`,
      author: currentUser,
      content: text,
      media: '',
      location: {
        id: 'current-location',
        name: currentLocation.name,
        description: '',
        h3Index: '',
        locationType: '',
      },
      status: 'PUBLISHED',
      createdAt: now,
      updatedAt: now,
      sharedPost: null,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      comments: null,
      likes: null,
    }
    setPosts((items) => [post, ...items])
  }

  function removePost(id: string) {
    setPosts((items) => items.filter((post) => post.id !== id))
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
