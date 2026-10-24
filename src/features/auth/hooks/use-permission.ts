import { useAuth } from '../context/auth-context'
import { roleHasPermission, type Permission } from '../lib/permissions'

export function usePermission(permission: Permission): boolean {
  const { user } = useAuth()
  return roleHasPermission(user?.role, permission)
}
