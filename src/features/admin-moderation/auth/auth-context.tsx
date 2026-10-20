import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authService } from '../api/auth.service'
import type { AuthUser, LoginInput } from '../lib/types'
import { authEvents } from './auth-events'
import { permissionsForRole, roleHasPermission, type Permission } from './permissions'
import { clearStoredSession, readStoredSession, writeStoredSession } from './session-storage'

type AuthContextValue = {
  /** `null` = chưa đăng nhập. */
  user: AuthUser | null
  permissions: readonly Permission[]
  login: (input: LoginInput) => Promise<AuthUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const NO_PERMISSIONS: readonly Permission[] = []

/**
 * Quản lý phiên đăng nhập của khu vực admin (mục 5.5).
 * - Khôi phục phiên từ sessionStorage ngay lần render đầu (không nhấp nháy), sau đó xác thực lại bằng `me()`.
 * - Lắng nghe sự kiện `unauthorized` (401 từ http client / mock) → đăng xuất + toast.
 * Phải nằm trong `QueryClientProvider` để xoá cache khi đăng xuất.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<AuthUser | null>(readStoredSession)

  // Ref để listener `unauthorized` biết có đang đăng nhập hay không mà không phải đăng ký lại.
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])

  // Xác thực lại phiên đã khôi phục. Lỗi 401 đã được xử lý qua sự kiện `unauthorized`;
  // lỗi mạng thì giữ phiên hiện tại (người dùng sẽ gặp lỗi khi gọi API tiếp theo).
  useEffect(() => {
    if (!readStoredSession()) return
    const controller = new AbortController()
    authService
      .me({ signal: controller.signal })
      .then((fresh) => {
        writeStoredSession(fresh)
        setUser(fresh)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(
    () =>
      authEvents.on('unauthorized', () => {
        if (!userRef.current) return
        clearStoredSession()
        setUser(null)
        queryClient.clear()
        toast.error('Phiên đăng nhập đã hết hạn', { description: 'Vui lòng đăng nhập lại.' })
      }),
    [queryClient],
  )

  const login = async (input: LoginInput) => {
    const authed = await authService.login(input)
    writeStoredSession(authed)
    setUser(authed)
    return authed
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch {
      /* dù server lỗi vẫn đăng xuất phía client */
    }
    clearStoredSession()
    setUser(null)
    queryClient.clear()
  }

  const value: AuthContextValue = {
    user,
    permissions: user ? permissionsForRole(user.role) : NO_PERMISSIONS,
    login,
    logout,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth phải được dùng bên trong <AuthProvider>')
  return context
}

/** Quy ước 4: kiểm tra quyền qua hook này (hoặc `<Can>`), không so sánh chuỗi vai trò rải rác. */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth()
  return roleHasPermission(user?.role, permission)
}
