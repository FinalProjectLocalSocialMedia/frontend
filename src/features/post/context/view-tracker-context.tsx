import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { ViewTracker } from '@/lib/view-tracking/view-tracker'
import type { ObservedPostMeta } from '@/lib/view-tracking/types'
import { sendViewBatch, sendViewBatchKeepalive } from '../api/interaction-api'

export interface ViewTrackerController {
  observe: (el: Element, post: ObservedPostMeta) => () => void
  trackActive: (postId: string, authorId?: string) => void
  flush: (opts?: { keepalive?: boolean }) => Promise<void>
  reset: () => void
}

const noopController: ViewTrackerController = {
  observe: () => () => {},
  trackActive: () => {},
  flush: async () => {},
  reset: () => {},
}

const ViewTrackerContext = createContext<ViewTrackerController>(noopController)

export function ViewTrackerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const activeUserId = user?.role === 'USER' ? user.id : null

  const [tracker] = useState(() => {
    const instance = new ViewTracker({
      send: sendViewBatch,
      sendKeepalive: sendViewBatchKeepalive,
    })
    instance.setUserId(activeUserId)
    return instance
  })

  useEffect(() => {
    tracker.setUserId(activeUserId)
  }, [activeUserId, tracker])

  useEffect(() => {
    tracker.activate()
    return () => {
      tracker.destroy()
    }
  }, [tracker])

  return <ViewTrackerContext.Provider value={tracker}>{children}</ViewTrackerContext.Provider>
}

export function useViewTracker(): ViewTrackerController {
  return useContext(ViewTrackerContext)
}
