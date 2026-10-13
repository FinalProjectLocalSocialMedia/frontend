import { Navigation, Plus, Sparkles } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { navItems } from '@/lib/nav'
import { ThemeToggle } from './theme-toggle'
import { cn } from '@/lib/utils'

// Text that only appears once the rail has expanded (on hover or keyboard focus).
const revealOnExpand =
  'whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 group-hover/sidebar:delay-75 group-has-[:focus-visible]/sidebar:opacity-100 group-has-[[aria-expanded=true]]/sidebar:opacity-100'

/**
 * Desktop navigation rail.
 *
 * The outer wrapper reserves a fixed 72px column in the page flow, so content never moves.
 * The <aside> is absolutely positioned inside it and grows to 256px on hover, overlaying the
 * page (like Instagram) instead of pushing it.
 */
export function Sidebar({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="sticky top-0 z-30 hidden h-dvh w-[72px] shrink-0 lg:block">
      <aside
        className={cn(
          'group/sidebar absolute inset-y-0 left-0 flex w-[72px] flex-col overflow-hidden border-r border-border/70 bg-card px-3 py-6',
          'transition-[width,box-shadow] duration-200 ease-out',
          'hover:w-64 hover:shadow-2xl hover:shadow-foreground/10',
          'has-[:focus-visible]:w-64 has-[:focus-visible]:shadow-2xl has-[:focus-visible]:shadow-foreground/10',
          // Stay open while a dropdown (e.g. theme picker) opened from inside the rail is showing.
          'has-[[aria-expanded=true]]:w-64 has-[[aria-expanded=true]]:shadow-2xl has-[[aria-expanded=true]]:shadow-foreground/10',
        )}
      >
        <Link
          to="/"
          aria-label="nearby. home"
          className="mb-10 flex h-11 items-center gap-3 rounded-xl px-1.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Navigation className="size-4" />
          </span>
          <span className={cn(revealOnExpand, 'text-xl font-semibold tracking-tight')}>
            nearby<span className="text-primary">.</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end, count }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="size-5 shrink-0" />
              <span className={revealOnExpand}>{label}</span>
              {count ? (
                <>
                  <Badge
                    variant="secondary"
                    className={cn(revealOnExpand, 'ml-auto')}
                    aria-label={`${count} new`}
                  >
                    {count}
                  </Badge>
                  {/* Collapsed state: a dot on the icon instead of the number. */}
                  <span
                    aria-hidden
                    className="absolute top-2.5 left-7 size-2 rounded-full bg-destructive ring-2 ring-card group-hover/sidebar:hidden group-has-[:focus-visible]/sidebar:hidden"
                  />
                </>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <Button
          aria-label="Create Post"
          onClick={onCreate}
          className="mt-6 h-11 w-full justify-start gap-3 rounded-xl px-3.5"
        >
          <Plus className="size-5 shrink-0" />
          <span className={revealOnExpand}>Create Post</span>
        </Button>

        <ThemeToggle
          side="right"
          className="mt-auto h-11 w-full justify-start gap-3 rounded-xl px-3.5 text-muted-foreground"
          iconClassName="size-5"
          label={<span className={revealOnExpand}>Theme</span>}
        />

        <div
          className={cn(
            revealOnExpand,
            'mt-4 w-56 shrink-0 whitespace-normal rounded-2xl border border-border bg-muted/40 p-4',
          )}
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 shrink-0 text-primary" /> Your neighborhood
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Stay in the loop with what people nearby are talking about.
          </p>
        </div>
      </aside>
    </div>
  )
}
