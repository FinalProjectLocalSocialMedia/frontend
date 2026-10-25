import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authEvents } from '../lib/auth-events'
import { permissionsForRole, roleHasPermission, type Permission } from '../lib/permissions'
import type { AuthUser, LoginRequest, RegisterRequest, Role } from '../types/auth'
import {
  authKeys,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useRegisterMutation,
} from '../api/auth-queries'

export interface AuthContextValue {
  user: AuthUser | null
  role?: Role
  permissions: readonly Permission[]
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<AuthUser>
  register: (data: RegisterRequest) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { data: user = null, isLoading } = useMeQuery()
  const loginMutation = useLoginMutation()
  const registerMutation = useRegisterMutation()
  const logoutMutation = useLogoutMutation()

  useEffect(() => {
    return authEvents.on('unauthorized', () => {
      queryClient.setQueryData(authKeys.me(), null)
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'auth',
      })
    })
  }, [queryClient])

  const login = async (credentials: LoginRequest): Promise<AuthUser> => {
    return await loginMutation.mutateAsync(credentials)
  }

  const register = async (data: RegisterRequest): Promise<AuthUser> => {
    return await registerMutation.mutateAsync(data)
  }

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync()
  }

  const refreshUser = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: authKeys.me() })
  }

  const role = user?.role as Role | undefined
  const permissions = permissionsForRole(role)

  const value: AuthContextValue = {
    user: user ?? null,
    role,
    permissions,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    hasPermission: (permission: Permission) => roleHasPermission(role, permission),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong <AuthProvider>')
  }
  return context
}
