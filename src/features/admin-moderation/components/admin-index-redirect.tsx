import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/auth-context'
import { defaultRouteForRole } from '@/features/auth/lib/permissions'
import { ADMIN_BASE } from '../lib/constants'

export function AdminIndexRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to={`${ADMIN_BASE}/login`} replace />
  return <Navigate to={`${ADMIN_BASE}/${defaultRouteForRole(user.role)}`} replace />
}
