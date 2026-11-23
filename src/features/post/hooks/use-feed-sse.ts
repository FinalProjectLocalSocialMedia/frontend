import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'

const SSE_URL = `${import.meta.env.VITE_API_BASE_URL}/feed/feed/events`
export const useFeedSSE = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [hasNewPosts, setHasNewPosts] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource(SSE_URL, {
      withCredentials: true,
    })

    eventSource.onopen = () => {
      console.log('SSE connected')
      setIsConnected(true)
    }

    eventSource.addEventListener('CONNECTED', (event) => {
      console.log('SSE server:', event.data)
    })

    eventSource.addEventListener('NEW_POST', (event) => {
      console.log('New posts:', event.data)

      setHasNewPosts(true)
    })

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      setIsConnected(false)
    }

    return () => {
      console.log('Closing SSE connection')

      eventSource.close()
      setIsConnected(false)
    }
  }, [])

  const clearNewPosts = () => {
    setHasNewPosts(false)
  }

  return {
    isConnected,
    hasNewPosts,
    clearNewPosts,
  }
}
