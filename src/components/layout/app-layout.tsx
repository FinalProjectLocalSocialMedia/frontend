import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './bottom-nav'
import { CreatePostContext } from './create-post-context'
import { CreatePostDialog } from './create-post-dialog'
import { MobileHeader } from './mobile-header'
import { Sidebar } from './sidebar'

/**
 * Shared shell for every page:
 *   desktop → Sidebar rail + page content
 *   mobile  → top header + page content + bottom nav
 * Pages render only their own content through <Outlet />.
 */
export function AppLayout() {
  const { pathname } = useLocation()
  const [createOpen, setCreateOpen] = useState(false)
  const openCreate = () => setCreateOpen(true)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <CreatePostContext.Provider value={openCreate}>
      <div className="mx-auto flex min-h-dvh max-w-[1440px] bg-background text-foreground">
        <Sidebar onCreate={openCreate} />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* The chat and explore pages have their own headers/full-height layout, so skip the global one. */}
          {pathname !== '/messages' && pathname !== '/explore' && <MobileHeader />}
          <main className="min-w-0 flex-1 pb-[var(--bottom-nav-h)]">
            <Outlet />
          </main>
        </div>
      </div>
      <BottomNav onCreate={openCreate} />
      <CreatePostDialog open={createOpen} onOpenChange={setCreateOpen} />
    </CreatePostContext.Provider>
  )
}
