import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiClient } from '@/lib/api'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<User>
  register: (data: RegisterRequest) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const response = await apiClient.get<User>('/user/auth/me')
      setUser(response.data)
    } catch {
      setUser(null)
    }
  }

  // Khởi tạo: kiểm tra phiên đăng nhập tự động khi mở trang web
  useEffect(() => {
    let mounted = true

    async function initAuth() {
      try {
        const response = await apiClient.get<User>('/user/auth/me')
        if (mounted) {
          setUser(response.data)
        }
      } catch {
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      mounted = false
    }
  }, [])

  const login = async (credentials: LoginRequest): Promise<User> => {
    const response = await apiClient.post<AuthResponse>('/user/auth/login', credentials)
    const loggedInUser = response.data.user
    setUser(loggedInUser)
    return loggedInUser
  }

  const register = async (data: RegisterRequest): Promise<User> => {
    const response = await apiClient.post<AuthResponse>('/user/auth/register', data)
    const registeredUser = response.data.user
    setUser(registeredUser)
    return registeredUser
  }

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post('/user/auth/logout')
    } catch {
      // Dù API logout có lỗi thì client vẫn dọn dẹp state
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
