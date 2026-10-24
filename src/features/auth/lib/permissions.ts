import type { Role } from '../types/auth'

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

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  USER: [],
  MODERATOR: MODERATOR_PERMISSIONS,
  ADMIN: [...MODERATOR_PERMISSIONS, ...ADMIN_ONLY_PERMISSIONS],
}

export const permissionsForRole = (role?: Role | string): readonly Permission[] => {
  if (!role || !(role in ROLE_PERMISSIONS)) return []
  return ROLE_PERMISSIONS[role as Role]
}

export const roleHasPermission = (
  role: Role | string | undefined,
  permission: Permission,
): boolean => {
  if (!role || !(role in ROLE_PERMISSIONS)) return false
  return ROLE_PERMISSIONS[role as Role].includes(permission)
}

/** Trang mặc định sau khi đăng nhập khu vực quản trị */
export const defaultRouteForRole = (role?: Role | string) =>
  role === 'ADMIN' ? 'dashboard' : 'reports'
