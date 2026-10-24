import { useState, type FormEvent } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  UserPlus,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

interface AuthPageProps {
  initialMode?: 'login' | 'register'
}

export default function AuthPage({ initialMode }: AuthPageProps) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, register } = useAuth()

  // Chọn tab từ query param ?mode=register hoặc prop
  const modeParam = searchParams.get('mode')
  const defaultTab = modeParam === 'register' || initialMode === 'register' ? 'register' : 'login'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab)

  // Form states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Login form inputs
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form inputs
  const [registerFullName, setRegisterFullName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu.')
      return
    }

    try {
      setIsSubmitting(true)
      const user = await login({
        email: loginEmail.trim(),
        password: loginPassword,
      })
      toast.success(`Chào mừng trở lại, ${user.fullName || 'bạn'}!`)
      navigate('/')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      const msg =
        error.response?.data?.message ||
        'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!registerFullName.trim() || !registerEmail.trim() || !registerPassword) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc.')
      return
    }

    if (registerPassword.length < 6) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 6 ký tự.')
      return
    }

    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.')
      return
    }

    try {
      setIsSubmitting(true)
      const user = await register({
        fullName: registerFullName.trim(),
        email: registerEmail.trim(),
        password: registerPassword,
        phoneNumber: registerPhone.trim() || undefined,
      })
      toast.success(`Đăng ký thành công! Chào mừng ${user.fullName} đến với nearby.`)
      navigate('/')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      const msg =
        error.response?.data?.message ||
        'Đăng ký không thành công. Email hoặc số điện thoại có thể đã tồn tại.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100dvh-5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      {/* Background ambient gradient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 size-[500px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-[500px] rounded-full bg-indigo-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl lg:grid-cols-12">
        {/* Left Side: Brand & Visual showcase */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-indigo-700 p-10 text-primary-foreground lg:col-span-5 lg:flex">
          <div className="space-y-6">
            <Link to="/" className="inline-flex items-center gap-3 font-bold tracking-tight text-2xl">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-lg">
                <Navigation className="size-6 text-white" />
              </span>
              <span className="text-2xl">
                nearby<span className="text-emerald-300">.</span>
              </span>
            </Link>

            <div className="pt-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="size-4 text-amber-300" />
                Mạng xã hội vị trí địa lý LBSN
              </div>
              <h2 className="mt-5 text-3xl font-extrabold leading-tight">
                Khám phá & kết nối những câu chuyện quanh bạn
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/85">
                Cập nhật tin tức xung quanh, trao đổi với cư dân lân cận, và chia sẻ trải nghiệm
                với hệ thống định vị không gian siêu tốc Uber H3.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-10">
            <div className="flex items-center gap-3.5 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <MapPin className="size-5" />
              </span>
              <div className="text-xs">
                <p className="font-bold text-sm">Bản đồ nhiệt lân cận</p>
                <p className="text-white/75 mt-0.5">Tìm bài viết và địa điểm theo bán kính GPS tức thì</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <ShieldCheck className="size-5" />
              </span>
              <div className="text-xs">
                <p className="font-bold text-sm">Bảo mật tối đa</p>
                <p className="text-white/75 mt-0.5">Xác thực HttpOnly Cookie & chống tấn công mạng tự động</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Forms (Strictly vertical layout with 100% full-width inputs) */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12 lg:col-span-7 w-full">
          {/* Header on top */}
          <div className="mb-6 space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {activeTab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản mới'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {activeTab === 'login'
                ? 'Nhập email và mật khẩu để tiếp tục vào nearby.'
                : 'Tham gia cộng đồng nearby. chỉ trong chưa đầy 1 phút.'}
            </p>
          </div>

          {/* Full-width Segmented Switcher */}
          <div className="mb-6 grid w-full grid-cols-2 p-1.5 bg-muted rounded-2xl border border-border/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login')
                setErrorMessage(null)
              }}
              className={cn(
                'h-11 sm:h-12 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
                activeTab === 'login'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LogIn className="size-4.5" />
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register')
                setErrorMessage(null)
              }}
              className={cn(
                'h-11 sm:h-12 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
                activeTab === 'register'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <UserPlus className="size-4.5" />
              <span>Tạo tài khoản</span>
            </button>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5 w-full">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm sm:text-base font-semibold text-foreground">
                  Email tài khoản
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="ban@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoComplete="username"
                    className="h-13 w-full pl-12 pr-4 text-base rounded-2xl border-border bg-background shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-sm sm:text-base font-semibold text-foreground">
                    Mật khẩu
                  </Label>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      toast.info('Tính năng quên mật khẩu qua email đang được kích hoạt.')
                    }}
                    className="text-xs sm:text-sm text-primary font-medium hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-13 w-full pl-12 pr-12 text-base rounded-2xl border-border bg-background shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 h-13 w-full gap-2 rounded-2xl text-base font-bold shadow-lg shadow-primary/25 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Đang xác thực...
                  </span>
                ) : (
                  <>
                    <span>Đăng nhập ngay</span>
                    <ArrowRight className="size-5" />
                  </>
                )}
              </Button>

              <div className="mt-8 text-center text-sm text-muted-foreground">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register')
                    setErrorMessage(null)
                  }}
                  className="font-bold text-primary hover:underline cursor-pointer ml-1"
                >
                  Đăng ký ngay
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER FORM (ALL INPUTS ARE FULL-WIDTH 100%) */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4.5 w-full">
              <div className="space-y-2">
                <Label htmlFor="reg-name" className="text-sm sm:text-base font-semibold text-foreground">
                  Họ và tên <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={registerFullName}
                    onChange={(e) => setRegisterFullName(e.target.value)}
                    required
                    className="h-13 w-full pl-12 pr-4 text-base rounded-2xl border-border bg-background shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-sm sm:text-base font-semibold text-foreground">
                  Email tài khoản <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="ban@example.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    className="h-13 w-full pl-12 pr-4 text-base rounded-2xl border-border bg-background shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-phone" className="text-sm sm:text-base font-semibold text-foreground">
                  Số điện thoại <span className="text-xs font-normal text-muted-foreground">(tùy chọn)</span>
                </Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="0912345678"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    className="h-13 w-full pl-12 pr-4 text-base rounded-2xl border-border bg-background shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-pass" className="text-sm sm:text-base font-semibold text-foreground">
                  Mật khẩu <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-pass"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ít nhất 6 ký tự"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    className="h-13 w-full pl-12 pr-12 text-base rounded-2xl border-border bg-background shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-confirm" className="text-sm sm:text-base font-semibold text-foreground">
                  Xác nhận lại mật khẩu <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại chính xác mật khẩu trên"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                    className="h-13 w-full pl-12 pr-12 text-base rounded-2xl border-border bg-background shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 h-13 w-full gap-2 rounded-2xl text-base font-bold shadow-lg shadow-primary/25 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Đang khởi tạo tài khoản...
                  </span>
                ) : (
                  <>
                    <span>Đăng ký tài khoản</span>
                    <ArrowRight className="size-5" />
                  </>
                )}
              </Button>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login')
                    setErrorMessage(null)
                  }}
                  className="font-bold text-primary hover:underline cursor-pointer ml-1"
                >
                  Đăng nhập
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
