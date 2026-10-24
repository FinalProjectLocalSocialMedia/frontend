import { Bell, LogIn, Navigation } from 'lucide-react'
import { Link } from 'react-router-dom'
import { navItems } from '@/lib/nav'
import { useAuth } from '@/lib/auth-context'
import { getDisplayName } from '@/features/auth/types/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from './theme-toggle'

const notifications = navItems.find((item) => item.to === '/notifications')

export function MobileHeader() {
  const { user, isAuthenticated } = useAuth()
  const displayName = user ? getDisplayName(user) : ''
  const avatarUrl = user && 'avatarUrl' in user ? user.avatarUrl : undefined

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/70 bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
      <Link to="/" className="flex items-center gap-2 font-semibold">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Navigation className="size-4" />
        </span>
        <span>
          nearby<span className="text-primary">.</span>
        </span>
      </Link>
      <div className="flex items-center gap-1.5">
        <ThemeToggle iconClassName="size-5" className="size-9 text-muted-foreground" />
        <Link
          to="/notifications"
          aria-label={`Notifications${notifications?.count ? `, ${notifications.count} new` : ''}`}
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted"
        >
          <Bell className="size-5" />
          {notifications?.count ? (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive ring-2 ring-card" />
          ) : null}
        </Link>
        {isAuthenticated && user ? (
          <Link to="/profile" className="ml-1 shrink-0">
            <Avatar className="size-8 border border-primary/20">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-[11px] font-bold text-primary">
                {displayName ? displayName.slice(0, 2).toUpperCase() : 'ME'}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Link
            to="/login"
            className="ml-1 inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
          >
            <LogIn className="size-3.5" />
            <span>Vào</span>
          </Link>
        )}
      </div>
    </header>
  )
}
