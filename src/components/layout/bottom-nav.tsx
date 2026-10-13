import { Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { bottomNavLeft, bottomNavRight, type NavItem } from '@/lib/nav'
import { cn } from '@/lib/utils'

function BottomNavLink({ to, label, icon: Icon, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-1 text-[11px] font-medium outline-none transition-colors focus-visible:bg-muted',
          isActive ? 'text-primary' : 'text-muted-foreground',
        )
      }
    >
      <Icon className="size-5" />
      {label}
    </NavLink>
  )
}

/** Mobile/tablet navigation (hidden from `lg` up, where the Sidebar takes over). */
export function BottomNav({ onCreate }: { onCreate: () => void }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 h-[var(--bottom-nav-h)] border-t border-border/70 bg-card/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur lg:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {bottomNavLeft.map((item) => (
          <BottomNavLink key={item.to} {...item} />
        ))}
        <div className="flex items-center justify-center">
          <Button
            aria-label="Create Post"
            size="icon-lg"
            onClick={onCreate}
            className="size-11 rounded-full shadow-md"
          >
            <Plus className="size-5" />
          </Button>
        </div>
        {bottomNavRight.map((item) => (
          <BottomNavLink key={item.to} {...item} />
        ))}
      </div>
    </nav>
  )
}
