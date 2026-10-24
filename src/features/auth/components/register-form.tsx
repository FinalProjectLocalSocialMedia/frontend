import { useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, Mail, Phone, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '../context/auth-context'
import type { AuthUser } from '../types/auth'

export interface RegisterFormProps {
  onSuccess?: (user: AuthUser) => void
  submitLabel?: string
  className?: string
}

export function RegisterForm({
  onSuccess,
  submitLabel = 'Đăng ký tài khoản',
  className = '',
}: RegisterFormProps) {
  const { register } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 6 ký tự.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.')
      return
    }

    try {
      setIsSubmitting(true)
      const user = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phoneNumber: phone.trim() || undefined,
      })
      onSuccess?.(user)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      const msg =
        error.response?.data?.message ||
        'Đăng ký không thành công. Email hoặc số điện thoại có thể đã tồn tại.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 w-full ${className}`}>
      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs sm:text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="reg-name" className="text-xs sm:text-sm font-semibold text-foreground">
          Họ và tên <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reg-name"
            type="text"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={isSubmitting}
            className="h-12 w-full pl-10 pr-4 text-sm sm:text-base rounded-2xl border-border bg-background shadow-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-email" className="text-xs sm:text-sm font-semibold text-foreground">
          Email tài khoản <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reg-email"
            type="email"
            placeholder="ban@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            className="h-12 w-full pl-10 pr-4 text-sm sm:text-base rounded-2xl border-border bg-background shadow-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-phone" className="text-xs sm:text-sm font-semibold text-foreground">
          Số điện thoại{' '}
          <span className="text-xs font-normal text-muted-foreground">(tùy chọn)</span>
        </Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reg-phone"
            type="tel"
            placeholder="0912345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSubmitting}
            className="h-12 w-full pl-10 pr-4 text-sm sm:text-base rounded-2xl border-border bg-background shadow-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-pass" className="text-xs sm:text-sm font-semibold text-foreground">
          Mật khẩu <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reg-pass"
            type={showPassword ? 'text' : 'password'}
            placeholder="Ít nhất 6 ký tự"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
            className="h-12 w-full pl-10 pr-10 text-sm sm:text-base rounded-2xl border-border bg-background shadow-xs"
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

      <div className="space-y-1.5">
        <Label htmlFor="reg-confirm" className="text-xs sm:text-sm font-semibold text-foreground">
          Xác nhận lại mật khẩu <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reg-confirm"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Nhập lại chính xác mật khẩu trên"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isSubmitting}
            className="h-12 w-full pl-10 pr-10 text-sm sm:text-base rounded-2xl border-border bg-background shadow-xs"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 h-12 w-full gap-2 rounded-2xl text-base font-bold shadow-lg shadow-primary/25 cursor-pointer"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <Spinner className="size-4" />
            Đang khởi tạo tài khoản...
          </span>
        ) : (
          <>
            <span>{submitLabel}</span>
            <ArrowRight className="size-4.5" />
          </>
        )}
      </Button>
    </form>
  )
}
