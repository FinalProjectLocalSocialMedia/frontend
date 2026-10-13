import { Bell, Navigation } from 'lucide-react'
import { Link } from 'react-router-dom'
import { navItems } from '@/lib/nav'
import { ThemeToggle } from './theme-toggle'

const notifications = navItems.find((item) => item.to === '/notifications')

export function MobileHeader() {
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
      <div className="flex items-center gap-1">
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
      </div>
    </header>
  )
}
