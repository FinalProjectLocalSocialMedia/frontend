import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Route, Routes } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createAdminQueryClient } from '../features/admin-moderation/api/query-client'
import { AuthProvider } from '../features/admin-moderation/auth/auth-context'
import {
  AdminIndexRedirect,
  RequireAuth,
  RequirePermission,
} from '../features/admin-moderation/auth/guards'
import { AdminLayout } from '../features/admin-moderation/components/admin-layout'
import { ComingSoon } from '../features/admin-moderation/components/coming-soon'
import AdminNotFoundPage from '../features/admin-moderation/pages/admin-not-found-page'
import ForbiddenPage from '../features/admin-moderation/pages/forbidden-page'
import LoginPage from '../features/admin-moderation/pages/login-page'
import { ContentReportDetailPage } from '../features/moderation/pages/content-report-detail-page'
import { FlaggedAccountsPage } from '../features/moderation/pages/flagged-accounts-page'
import { ReportsPage } from '../features/moderation/pages/reports-page'
import { UserDetailPage } from '../features/admin/pages/user-detail-page'
import { UsersPage } from '../features/admin/pages/users-page'

/**
 * Root Router cho toàn bộ khu vực Quản trị & Kiểm duyệt (`/admin/*`).
 * Được tải lười (lazy loaded) từ App.tsx để không làm phình bundle người dùng thông thường.
 * Cung cấp QueryClient độc lập, AuthProvider khôi phục phiên và bảo vệ quyền hạn.
 */
export default function AdminRoutes() {
  const [queryClient] = useState(createAdminQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            {/* Các trang công khai trong khu vực admin */}
            <Route path="login" element={<LoginPage />} />
            <Route path="403" element={<ForbiddenPage />} />

            {/* Các trang yêu cầu đăng nhập nhân viên */}
            <Route element={<RequireAuth />}>
              <Route element={<AdminLayout />}>
                {/* Trang gốc /admin tự động chuyển hướng theo vai trò (mục 5.3) */}
                <Route index element={<AdminIndexRedirect />} />

                {/* Nhóm Kiểm duyệt: Báo cáo vi phạm (Pha 3) */}
                <Route element={<RequirePermission permission="reports.read" />}>
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="reports/:id" element={<ContentReportDetailPage />} />
                  <Route path="reports/content/:id" element={<ContentReportDetailPage />} />
                  <Route path="reports/users/:id" element={<ContentReportDetailPage />} />
                </Route>

                {/* Nhóm Kiểm duyệt: Tài khoản vi phạm (Pha 4) */}
                <Route element={<RequirePermission permission="accounts.read.flagged" />}>
                  <Route path="accounts" element={<FlaggedAccountsPage />} />
                </Route>

                {/* Nhóm Quản trị: Tổng quan (Pha 6) & Nội dung (Pha 5) */}
                <Route element={<RequirePermission permission="content.analytics" />}>
                  <Route
                    path="dashboard"
                    element={
                      <ComingSoon
                        title="Tổng quan hệ thống"
                        description="Báo cáo các chỉ số thời gian thực và biểu đồ phân tích."
                        phaseText="Trang tổng quan thống kê sẽ được hoàn thiện ở Pha 6."
                      />
                    }
                  />
                  <Route
                    path="content"
                    element={
                      <ComingSoon
                        title="Quản lý nội dung"
                        description="Tra cứu, duyệt và kiểm soát các bài viết, bình luận trong toàn hệ thống."
                        phaseText="Chức năng quản lý nội dung sẽ được hoàn thiện ở Pha 5."
                      />
                    }
                  />
                </Route>

                {/* Nhóm Quản trị: Người dùng (Pha 5) */}
                <Route element={<RequirePermission permission="users.read" />}>
                  <Route path="users" element={<UsersPage />} />
                  <Route path="users/:id" element={<UserDetailPage />} />
                </Route>

                {/* Nhóm Quản trị: Địa điểm (Pha 8) */}
                <Route element={<RequirePermission permission="locations.manage" />}>
                  <Route
                    path="locations"
                    element={
                      <ComingSoon
                        title="Quản lý địa điểm"
                        description="Danh mục địa điểm, toạ độ địa lý và bán kính hoạt động."
                        phaseText="Chức năng quản lý địa điểm sẽ được hoàn thiện ở Pha 8."
                      />
                    }
                  />
                </Route>

                {/* Nhóm Quản trị: Bản đồ nhiệt (Pha 9) */}
                <Route element={<RequirePermission permission="heatmap.view" />}>
                  <Route
                    path="heatmap"
                    element={
                      <ComingSoon
                        title="Bản đồ nhiệt hoạt động"
                        description="Trực quan hoá mật độ tương tác và bài viết theo vùng địa lý H3."
                        phaseText="Chức năng bản đồ nhiệt Deck.gl sẽ được hoàn thiện ở Pha 9."
                      />
                    }
                  />
                </Route>

                {/* Nhóm Quản trị: Cấu hình hệ thống (Pha 8) */}
                <Route element={<RequirePermission permission="settings.manage" />}>
                  <Route
                    path="settings"
                    element={
                      <ComingSoon
                        title="Cấu hình hệ thống"
                        description="Điều chỉnh các tham số cấu hình vận hành và tương tác."
                        phaseText="Chức năng cấu hình hệ thống sẽ được hoàn thiện ở Pha 8."
                      />
                    }
                  />
                </Route>

                {/* Nhóm Quản trị: Nhật ký Audit (Pha 8) */}
                <Route element={<RequirePermission permission="audit.read" />}>
                  <Route
                    path="audit-log"
                    element={
                      <ComingSoon
                        title="Nhật ký Audit"
                        description="Lịch sử ghi nhận mọi thao tác nhạy cảm của nhân viên quản trị."
                        phaseText="Chức năng xem nhật ký kiểm toán sẽ được hoàn thiện ở Pha 8."
                      />
                    }
                  />
                </Route>

                {/* Thông báo nội bộ nhân viên */}
                <Route element={<RequirePermission permission="notifications.read" />}>
                  <Route
                    path="notifications"
                    element={
                      <ComingSoon
                        title="Thông báo hệ thống"
                        description="Danh sách thông báo gửi đến nhân viên quản trị và kiểm duyệt."
                        phaseText="Trang toàn bộ thông báo sẽ được hoàn thiện ở các pha tiếp theo."
                      />
                    }
                  />
                </Route>

                {/* Route không tồn tại bên trong AdminLayout */}
                <Route path="*" element={<AdminNotFoundPage />} />
              </Route>
            </Route>

            {/* Route không tồn tại ngoài khu vực admin */}
            <Route path="*" element={<AdminNotFoundPage />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
