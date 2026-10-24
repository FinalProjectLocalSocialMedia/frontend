import { createContext, useContext } from 'react'

export const CreatePostContext = createContext<() => void>(() => {})

export const useCreatePost = () => useContext(CreatePostContext)
