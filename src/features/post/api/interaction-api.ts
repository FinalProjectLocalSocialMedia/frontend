import { API_BASE_URL } from '@/config/env'
import { apiClient } from '@/lib/api-client'
import type { ViewEventPayload } from '@/lib/view-tracking/types'

export const VIEW_BATCH_ENDPOINT = '/post/posts/view'

export async function sendViewBatch(events: ViewEventPayload[]): Promise<void> {
  if (events.length === 0) return
  try {
    await apiClient.post(VIEW_BATCH_ENDPOINT, events)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[view-tracking] Failed to send view batch:', error)
    }
    throw error
  }
}

export async function sendViewBatchKeepalive(events: ViewEventPayload[]): Promise<void> {
  if (events.length === 0) return
  const baseUrl = API_BASE_URL.replace(/\/+$/, '')
  const url = `${baseUrl}${VIEW_BATCH_ENDPOINT}`

  try {
    await fetch(url, {
      method: 'POST',
      keepalive: true,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(events),
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[view-tracking] Failed to send keepalive view batch:', error)
    }
  }
}
