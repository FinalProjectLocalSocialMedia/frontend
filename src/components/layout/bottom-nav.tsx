import { Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { bottomNavLeft, bottomNavRight, type NavItem } from '@/lib/nav'
import { useNavBadges } from './nav-badges-context'
import { cn } from '@/lib/utils'

function BottomNavLink({ to, label, icon: Icon, end, badgeCount = 0 }: NavItem & { badgeCount?: number }) {
  const badgeText = badgeCount > 99 ? '99+' : String(badgeCount)

  return (
    <NavLink
      to={to}
      end={end}
      aria-label={badgeCount > 0 ? `${label}, ${badgeCount} chưa đọc` : undefined}
      className={({ isActive }) =>
        cn(
          'relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium outline-none transition-colors focus-visible:bg-muted',
          isActive ? 'text-primary' : 'text-muted-foreground',
        )
      }
    >
      <span className="relative">
        <Icon className="size-5" />
        {badgeCount > 0 ? (
          <Badge
            variant="default"
            className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 text-[10px] leading-none"
          >
            {badgeText}
          </Badge>
        ) : null}
      </span>
      {label}
    </NavLink>
  )
}

/** Mobile/tablet navigation (hidden from `lg` up, where the Sidebar takes over). */
export function BottomNav({ onCreate }: { onCreate: () => void }) {
  const { notificationUnread, chatUnread } = useNavBadges()

  const getBadgeCount = (to: string, count?: number) => {
    if (to === '/notifications') return notificationUnread
    if (to === '/messages') return chatUnread
    return count ?? 0
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 h-[var(--bottom-nav-h)] border-t border-border/70 bg-card/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur lg:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {bottomNavLeft.map((item) => (
          <BottomNavLink
            key={item.to}
            {...item}
            badgeCount={getBadgeCount(item.to, item.count)}
          />
        ))}
        <div className="flex items-center justify-center">
          <Button
            aria-label="Tạo bài viết"
            size="icon-lg"
            onClick={onCreate}
            className="size-11 rounded-full shadow-md"
          >
            <Plus className="size-5" />
          </Button>
        </div>
        {bottomNavRight.map((item) => (
          <BottomNavLink
            key={item.to}
            {...item}
            badgeCount={getBadgeCount(item.to, item.count)}
          />
        ))}
      </div>
    </nav>
  )
}
