import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AdminHeader } from './admin-header'
import { AdminSidebar } from './admin-sidebar'

/**
 * Layout chính cho toàn bộ khu vực Admin và Moderation.
 * Tích hợp SidebarProvider, AdminSidebar, Header và Outlet chứa các trang chức năng.
 */
export function AdminLayout() {
  return (
    <SidebarProvider defaultOpen>
      <AdminSidebar />
      <SidebarInset className="min-w-0">
        <AdminHeader />
        <div className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
