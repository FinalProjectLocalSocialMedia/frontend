import { useLocation, Link } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ADMIN_BASE } from '../lib/constants'
import { BREADCRUMB_LABELS } from '../lib/nav'
import { AdminThemeToggle } from './admin-theme-toggle'
import { NotificationBell } from './notification-bell'
import { UserMenu } from './user-menu'

/**
 * Thanh tiêu đề trên cùng của AdminLayout, tích hợp SidebarTrigger, Breadcrumb động và tiện ích bên phải.
 */
export function AdminHeader() {
  const location = useLocation()

  // Phân tích đường dẫn để tạo breadcrumbs tự động
  const relativePath = location.pathname.startsWith(ADMIN_BASE)
    ? location.pathname.slice(ADMIN_BASE.length).replace(/^\/+/, '')
    : ''

  const segments = relativePath ? relativePath.split('/').filter(Boolean) : []

  // Xây dựng danh sách breadcrumbs
  const breadcrumbItems = segments.map((segment, index) => {
    const fullPath = `${ADMIN_BASE}/${segments.slice(0, index + 1).join('/')}`
    const label =
      BREADCRUMB_LABELS[segment] ??
      (segment.length > 10 ? `${segment.slice(0, 8)}...` : segment)
    const isLast = index === segments.length - 1

    return { fullPath, label, isLast }
  })

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-3">
        <SidebarTrigger aria-label="Thu gọn hoặc mở rộng thanh điều hướng" />
        <Separator orientation="vertical" className="h-4" />

        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link to={ADMIN_BASE} />}
              >
                Quản trị
              </BreadcrumbLink>
            </BreadcrumbItem>

            {breadcrumbItems.map((item) => (
              <span key={item.fullPath} className="inline-flex items-center gap-1.5">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {item.isLast ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      render={<Link to={item.fullPath} />}
                    >
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <AdminThemeToggle />
        <Separator orientation="vertical" className="h-4" />
        <UserMenu />
      </div>
    </header>
  )
}
