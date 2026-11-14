import type { ReactNode } from 'react'
import { NavBadgesProvider } from '@/components/layout/nav-badges-context'
import { useAuth } from '@/features/auth/context/auth-context'
import { useUnreadCountQuery } from '@/features/notification/api/notification-queries'

export function NavBadgesBridge({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const isNormalUser = !!user && user.role === 'USER'

  const { data } = useUnreadCountQuery({ enabled: isNormalUser })
  const notificationUnread = isNormalUser ? (data?.unreadCount ?? 0) : 0

  return (
    <NavBadgesProvider value={{ notificationUnread, chatUnread: 0 }}>
      {children}
    </NavBadgesProvider>
  )
}
