import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { usePendingReportCount } from '../api/shell.queries'
import { useAuth } from '../auth/auth-context'
import { roleHasPermission } from '../auth/permissions'
import { ADMIN_BASE } from '../lib/constants'
import { ADMIN_NAV } from '../lib/nav'

/**
 * Sidebar quản trị & kiểm duyệt.
 * Tự động lọc mục theo quyền của role hiện tại (mục 5.6).
 * Hiển thị huy hiệu số lượng báo cáo chờ xử lý (pending reports).
 */
export function AdminSidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const { data: pendingReportCount = 0 } = usePendingReportCount(!!user)

  if (!user) return null

  // Lọc các nhóm và mục điều hướng theo quyền hạn của role hiện tại
  const visibleGroups = ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => roleHasPermission(user.role, item.permission)),
  })).filter((group) => group.items.length > 0)

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link
          to={`${ADMIN_BASE}`}
          className="flex items-center gap-2 font-bold tracking-tight text-sidebar-foreground transition-opacity hover:opacity-90"
        >
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary font-mono text-sm font-black text-primary-foreground">
            N
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold leading-none">nearby.</span>
            <span className="text-[10px] font-medium text-muted-foreground">Admin Console</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const targetPath = `${ADMIN_BASE}/${item.to}`
                  const isActive =
                    location.pathname === targetPath ||
                    location.pathname.startsWith(`${targetPath}/`)

                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        render={
                          <Link
                            to={targetPath}
                            onClick={handleLinkClick}
                            aria-current={isActive ? 'page' : undefined}
                          />
                        }
                      >
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>

                      {item.badge === 'pendingReports' && pendingReportCount > 0 && (
                        <SidebarMenuBadge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold">
                          {pendingReportCount > 99 ? '99+' : pendingReportCount}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:hidden">
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Hệ thống quản trị</span>
          <span>v0.1.0 · Bảo mật</span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
