import { createContext, useContext } from 'react'

/** Lets any page open the global "Create Post" dialog owned by AppLayout. */
export const CreatePostContext = createContext<() => void>(() => {})

export const useCreatePost = () => useContext(CreatePostContext)
