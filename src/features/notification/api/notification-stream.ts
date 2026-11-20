import { API_BASE_URL } from '@/config/env'
import { authEvents } from '@/features/auth/lib/auth-events'
import { isAuthExpiredError, refreshAccessToken } from '@/lib/api-client'
import type { AppNotification } from '../types/notification'

export interface NotificationPayload {
  notification: AppNotification
  unreadCount: number
}

export interface UnreadCountPayload {
  unreadCount: number
}

export interface NotificationRemovedPayload {
  id: string
  unreadCount: number
}

export interface NotificationStreamOptions {
  url?: string
  withCredentials?: boolean
  initialBackoffMs?: number
  maxBackoffMs?: number
  EventSourceClass?: typeof EventSource
  refreshAuth?: () => Promise<void>
  onOpen?: () => void
  onNotification?: (data: NotificationPayload) => void
  onUnreadCount?: (data: UnreadCountPayload) => void
  onNotificationRemoved?: (data: NotificationRemovedPayload) => void
  onError?: (error: unknown) => void
}

export interface NotificationStream {
  connect: () => void
  reconnect: (options?: { immediate?: boolean }) => Promise<void>
  close: () => void
  getState: () => {
    isClosed: boolean
    currentBackoff: number
  }
}

export function createNotificationStream(
  options: NotificationStreamOptions = {},
): NotificationStream {
  const baseUrl = (options.url || API_BASE_URL || '').replace(/\/+$/, '')
  const streamUrl = `${baseUrl}/notification/stream`
  const withCredentials = options.withCredentials ?? true
  const initialBackoffMs = options.initialBackoffMs ?? 1000
  const maxBackoffMs = options.maxBackoffMs ?? 30000
  const EventSourceConstructor =
    options.EventSourceClass ??
    (typeof window !== 'undefined' ? window.EventSource : undefined)
  const refreshAuth = options.refreshAuth ?? refreshAccessToken

  let isClosed = false
  let currentBackoff = initialBackoffMs
  let es: EventSource | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  const clearTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  const closeEs = () => {
    if (es) {
      try {
        es.close()
      } catch {
        // Bỏ qua lỗi khi đóng kết nối
      }
      es = null
    }
  }

  const close = () => {
    isClosed = true
    clearTimer()
    closeEs()
  }

  const reconnect = async ({ immediate = false }: { immediate?: boolean } = {}) => {
    if (isClosed) return

    clearTimer()
    closeEs()

    const executeReconnect = async () => {
      if (isClosed) return

      try {
        await refreshAuth()
      } catch (err) {
        if (isClosed) return

        if (isAuthExpiredError(err)) {
          authEvents.emit('unauthorized')
          close()
          return
        }

        // Lỗi mạng: tăng backoff và thử lại
        options.onError?.(err)
        currentBackoff = Math.min(currentBackoff * 2, maxBackoffMs)
        reconnect({ immediate: false })
        return
      }

      if (!isClosed) {
        connect()
      }
    }

    if (immediate) {
      await executeReconnect()
    } else {
      const jitter = Math.floor(Math.random() * 500)
      const delay = currentBackoff + jitter
      currentBackoff = Math.min(currentBackoff * 2, maxBackoffMs)

      reconnectTimer = setTimeout(() => {
        executeReconnect()
      }, delay)
    }
  }

  const connect = () => {
    if (isClosed) return
    if (!EventSourceConstructor) {
      console.warn('EventSource is not supported in this environment')
      return
    }

    clearTimer()
    closeEs()

    try {
      es = new EventSourceConstructor(streamUrl, { withCredentials })
    } catch (err) {
      options.onError?.(err)
      reconnect({ immediate: false })
      return
    }

    es.onopen = () => {
      currentBackoff = initialBackoffMs
      options.onOpen?.()
    }

    es.addEventListener('notification', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as NotificationPayload
        options.onNotification?.(data)
      } catch (err) {
        console.error('Failed to parse notification event data:', err)
      }
    })

    es.addEventListener('unread-count', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as UnreadCountPayload
        options.onUnreadCount?.(data)
      } catch (err) {
        console.error('Failed to parse unread-count event data:', err)
      }
    })

    es.addEventListener('notification-removed', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as NotificationRemovedPayload
        options.onNotificationRemoved?.(data)
      } catch (err) {
        console.error('Failed to parse notification-removed event data:', err)
      }
    })

    es.addEventListener('reauth', () => {
      // Server đóng stream sau 15 phút: refresh token rồi kết nối lại ngay lập tức
      closeEs()
      reconnect({ immediate: true })
    })

    es.onerror = (err) => {
      // Đóng EventSource thủ công để ngăn trình duyệt tự động reconnect mà chưa refresh token
      closeEs()
      options.onError?.(err)
      reconnect({ immediate: false })
    }
  }

  return {
    connect,
    reconnect,
    close,
    getState: () => ({
      isClosed,
      currentBackoff,
    }),
  }
}

