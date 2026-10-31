import { Bell, Home, MessageCircle, Search, UserRound, type LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  /** Match only the exact path (needed for "/"). */
  end?: boolean
  /** Unread/notification count shown as a badge. */
  count?: number
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Trang chủ', icon: Home, end: true },
  { to: '/explore', label: 'Khám phá', icon: Search },
  // { to: '/notifications', label: 'Thông báo', icon: Bell, count: 3 },
  { to: '/messages', label: 'Tin nhắn', icon: MessageCircle },
  { to: '/profile', label: 'Trang cá nhân', icon: UserRound },
]

/** Destinations shown in the mobile bottom nav (the Create button sits between the two pairs). */
export const bottomNavLeft = navItems.filter((item) => ['/', '/explore'].includes(item.to))
export const bottomNavRight = navItems.filter((item) => ['/messages', '/profile'].includes(item.to))
