import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth-context'
import { usePermission } from '../hooks/use-permission'
import type { Permission } from '../lib/permissions'
import type { Role } from '../types/auth'

export interface RequireAuthProps {
  loginPath?: string
  allowedRoles?: Role[]
}

/** Bảo vệ route yêu cầu đăng nhập. Hỗ trợ chuyển hướng và kiểm tra role cơ bản. */
export function RequireAuth({ loginPath = '/login', allowedRoles }: RequireAuthProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (!user) {
    const from = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`${loginPath}?from=${from}`} replace />
  }

  if (allowedRoles && user.role && !allowedRoles.includes(user.role as Role)) {
    // Nếu staff cố truy cập trang người dùng thường
    if (loginPath === '/login' && user.role !== 'USER') {
      return <Navigate to="/admin" replace />
    }
    // Nếu user thường cố truy cập admin
    return <Navigate to="/admin/403" replace />
  }

  return <Outlet />
}

/** Yêu cầu quyền cụ thể, chuyển hướng tới 403 nếu thiếu quyền. */
export function RequirePermission({
  permission,
  forbiddenPath = '/admin/403',
}: {
  permission: Permission
  forbiddenPath?: string
}) {
  const allowed = usePermission(permission)
  return allowed ? <Outlet /> : <Navigate to={forbiddenPath} replace />
}

/** Ẩn/hiện thành phần UI theo quyền hạn. */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}) {
  const allowed = usePermission(permission)
  return allowed ? <>{children}</> : <>{fallback}</>
}
