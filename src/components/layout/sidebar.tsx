import { LogIn, LogOut, Navigation, Plus, Sparkles, UserRound } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { navItems } from '@/lib/nav'
import { useAuth } from '@/lib/auth-context'
import { getDisplayName } from '@/features/auth/types/auth'
import { ThemeToggle } from './theme-toggle'
import { toast } from 'sonner'
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
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = user ? getDisplayName(user) : ''
  const avatarUrl = user && 'avatarUrl' in user ? user.avatarUrl : undefined

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

        {/* User profile / Login button */}
        <div className="mt-auto pt-4 border-t border-border/50">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-12 w-full items-center gap-3 rounded-xl p-1.5 outline-none hover:bg-muted text-left transition-colors">
                <Avatar className="size-9 shrink-0 border border-primary/20">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {displayName ? displayName.slice(0, 2).toUpperCase() : 'ME'}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(revealOnExpand, 'min-w-0 flex-1')}>
                  <p className="truncate text-xs font-semibold text-foreground">
                    {displayName || 'Người dùng'}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <div className="p-2 text-xs">
                  <p className="font-semibold text-foreground">{displayName}</p>
                  <p className="text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                  <UserRound className="mr-2 size-4" />
                  <span>Hồ sơ cá nhân</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout()
                    toast.success('Đã đăng xuất tài khoản')
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="flex h-11 w-full items-center justify-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-3.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              <LogIn className="size-5 shrink-0" />
              <span className={revealOnExpand}>Đăng nhập</span>
            </Link>
          )}
        </div>

        <ThemeToggle
          side="right"
          className="mt-2 h-11 w-full justify-start gap-3 rounded-xl px-3.5 text-muted-foreground"
          iconClassName="size-5"
          label={<span className={revealOnExpand}>Theme</span>}
        />

        <div
          className={cn(
            revealOnExpand,
            'mt-3 w-56 shrink-0 whitespace-normal rounded-2xl border border-border bg-muted/40 p-4',
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
