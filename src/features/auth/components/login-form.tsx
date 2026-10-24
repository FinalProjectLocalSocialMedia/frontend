import { useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '../context/auth-context'
import type { AuthUser, Role } from '../types/auth'

export interface LoginFormProps {
  onSuccess?: (user: AuthUser) => void
  allowedRoles?: Role[]
  submitLabel?: string
  variant?: 'default' | 'admin'
  className?: string
}

export function LoginForm({
  onSuccess,
  allowedRoles,
  submitLabel = 'Đăng nhập',
  variant = 'default',
  className = '',
}: LoginFormProps) {
  const { login, logout } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu.')
      return
    }

    try {
      setIsSubmitting(true)
      const user = await login({
        email: email.trim(),
        password,
      })

      // Kiểm tra vai trò được phép
      if (allowedRoles && allowedRoles.length > 0) {
        const userRole = (user.role || 'USER') as Role
        if (!allowedRoles.includes(userRole)) {
          await logout()
          if (allowedRoles.includes('USER')) {
            setErrorMessage(
              'Tài khoản quản trị vui lòng đăng nhập tại trang quản trị (/admin/login).',
            )
          } else {
            setErrorMessage('Tài khoản không có quyền truy cập khu vực quản trị.')
          }
          return
        }
      }

      onSuccess?.(user)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      const msg =
        error.response?.data?.message || 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isAdmin = variant === 'admin'

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 w-full ${className}`}>
      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs sm:text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="space-y-1.5">
        <Label
          htmlFor={`login-email-${variant}`}
          className="text-xs sm:text-sm font-semibold text-foreground"
        >
          Email tài khoản
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`login-email-${variant}`}
            type="email"
            placeholder="ban@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            disabled={isSubmitting}
            className={`w-full pl-10 pr-4 text-sm rounded-xl border-border bg-background shadow-xs ${
              isAdmin ? 'h-10' : 'h-12 text-base'
            }`}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor={`login-password-${variant}`}
          className="text-xs sm:text-sm font-semibold text-foreground"
        >
          Mật khẩu
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`login-password-${variant}`}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={isSubmitting}
            className={`w-full pl-10 pr-10 text-sm rounded-xl border-border bg-background shadow-xs ${
              isAdmin ? 'h-10' : 'h-12 text-base'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className={`w-full gap-2 font-bold cursor-pointer ${
          isAdmin ? 'h-10 text-sm' : 'h-12 text-base rounded-2xl shadow-lg shadow-primary/25'
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <Spinner className="size-4" />
            Đang xác thực...
          </span>
        ) : (
          <>
            <span>{submitLabel}</span>
            {!isAdmin && <ArrowRight className="size-4.5" />}
          </>
        )}
      </Button>
    </form>
  )
}
