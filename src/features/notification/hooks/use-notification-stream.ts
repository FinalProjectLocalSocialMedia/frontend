import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/context/auth-context'
import { notificationKeys } from '../api/notification-queries'
import {
  createNotificationStream,
  type NotificationStreamOptions,
} from '../api/notification-stream'

export function useNotificationStream(options?: Partial<NotificationStreamOptions>) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    // Chỉ kết nối stream khi người dùng đã đăng nhập và là USER thường (Staff không mở stream)
    if (!user || user.role !== 'USER') {
      return
    }

    const stream = createNotificationStream({
      ...options,
      onOpen: () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
        options?.onOpen?.()
      },
      onNotification: (data) => {
        if (typeof data.unreadCount === 'number') {
          queryClient.setQueryData(notificationKeys.unreadCount(), {
            unreadCount: data.unreadCount,
          })
        }
        queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
        options?.onNotification?.(data)
      },
      onUnreadCount: (data) => {
        if (typeof data.unreadCount === 'number') {
          queryClient.setQueryData(notificationKeys.unreadCount(), {
            unreadCount: data.unreadCount,
          })
        }
        options?.onUnreadCount?.(data)
      },
      onNotificationRemoved: (data) => {
        if (typeof data.unreadCount === 'number') {
          queryClient.setQueryData(notificationKeys.unreadCount(), {
            unreadCount: data.unreadCount,
          })
        }
        queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
        options?.onNotificationRemoved?.(data)
      },
    })

    stream.connect()

    return () => {
      stream.close()
    }
  }, [user, queryClient, options])
}

