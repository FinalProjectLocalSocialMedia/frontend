import type { Role } from '../lib/types'

/**
 * Quyền là chuỗi `domain.action` (mục 4). UI chỉ PHẢN CHIẾU quyền (ẩn/khoá);
 * backend mới là nơi cưỡng chế.
 */
export type Permission =
  | 'reports.read'
  | 'reports.resolve'
  | 'content.remove'
  | 'users.warn'
  | 'users.lock'
  | 'users.unlock'
  | 'accounts.read.flagged'
  | 'notifications.read'
  | 'users.read'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'users.pii.read'
  | 'content.analytics'
  | 'locations.manage'
  | 'heatmap.view'
  | 'settings.manage'
  | 'audit.read'

const MODERATOR_PERMISSIONS: readonly Permission[] = [
  'reports.read',
  'reports.resolve',
  'content.remove',
  'users.warn',
  'users.lock',
  'users.unlock',
  'accounts.read.flagged',
  'notifications.read',
]

const ADMIN_ONLY_PERMISSIONS: readonly Permission[] = [
  'users.read',
  'users.create',
  'users.update',
  'users.delete',
  'users.pii.read',
  'content.analytics',
  'locations.manage',
  'heatmap.view',
  'settings.manage',
  'audit.read',
]

/** Admin ⊇ Moderator (D2). Người dùng thường không có quyền nào. */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  NORMAL_USER: [],
  MODERATOR: MODERATOR_PERMISSIONS,
  ADMIN: [...MODERATOR_PERMISSIONS, ...ADMIN_ONLY_PERMISSIONS],
}

export const permissionsForRole = (role: Role): readonly Permission[] => ROLE_PERMISSIONS[role]

export const roleHasPermission = (role: Role | undefined, permission: Permission) =>
  role !== undefined && ROLE_PERMISSIONS[role].includes(permission)

/** Trang mặc định sau khi đăng nhập / khi vào `/admin` (mục 5.3). */
export const defaultRouteForRole = (role: Role) => (role === 'ADMIN' ? 'dashboard' : 'reports')
