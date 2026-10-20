import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ADMIN_BASE } from '../lib/constants'
import { useAuth, usePermission } from './auth-context'
import { defaultRouteForRole, type Permission } from './permissions'

/** Chưa đăng nhập → `/admin/login?from=…`. Guard chỉ phục vụ UX; RBAC thật nằm ở server. */
export function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) {
    const from = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`${ADMIN_BASE}/login?from=${from}`} replace />
  }
  return <Outlet />
}

/** Thiếu quyền → `/admin/403`. Dùng làm layout route bọc các route con. */
export function RequirePermission({ permission }: { permission: Permission }) {
  const allowed = usePermission(permission)
  return allowed ? <Outlet /> : <Navigate to={`${ADMIN_BASE}/403`} replace />
}

/** Ẩn nút/menu khi thiếu quyền. */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}) {
  return usePermission(permission) ? <>{children}</> : <>{fallback}</>
}

/** `/admin` → moderator: `/admin/reports`; admin: `/admin/dashboard` (mục 5.3). */
export function AdminIndexRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to={`${ADMIN_BASE}/login`} replace />
  return <Navigate to={`${ADMIN_BASE}/${defaultRouteForRole(user.role)}`} replace />
}
