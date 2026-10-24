import { useState } from 'react'
import { LogIn, MapPin, Navigation, ShieldCheck, Sparkles, UserPlus } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { LoginForm } from '../components/login-form'
import { RegisterForm } from '../components/register-form'
import type { AuthUser } from '../types/auth'

export interface AuthPageProps {
  initialMode?: 'login' | 'register'
}

export default function AuthPage({ initialMode }: AuthPageProps) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const modeParam = searchParams.get('mode')
  const defaultTab = modeParam === 'register' || initialMode === 'register' ? 'register' : 'login'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab)

  const handleLoginSuccess = (user: AuthUser) => {
    const name = ('fullName' in user && user.fullName) || user.email.split('@')[0]
    toast.success(`Chào mừng trở lại, ${name}!`)
    const from = searchParams.get('from')
    navigate(from ? decodeURIComponent(from) : '/')
  }

  const handleRegisterSuccess = (user: AuthUser) => {
    const name = ('fullName' in user && user.fullName) || user.email.split('@')[0]
    toast.success(`Đăng ký thành công! Chào mừng ${name} đến với nearby.`)
    navigate('/')
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
            <Link
              to="/"
              className="inline-flex items-center gap-3 font-bold tracking-tight text-2xl"
            >
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
                Cập nhật tin tức xung quanh, trao đổi với cư dân lân cận, và chia sẻ trải nghiệm với
                hệ thống định vị không gian siêu tốc Uber H3.
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
                <p className="text-white/75 mt-0.5">
                  Tìm bài viết và địa điểm theo bán kính GPS tức thì
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <ShieldCheck className="size-5" />
              </span>
              <div className="text-xs">
                <p className="font-bold text-sm">Bảo mật tối đa</p>
                <p className="text-white/75 mt-0.5">
                  Xác thực HttpOnly Cookie & bảo vệ phiên an toàn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12 lg:col-span-7 w-full">
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

          {/* Segmented Switcher */}
          <div className="mb-6 grid w-full grid-cols-2 p-1.5 bg-muted rounded-2xl border border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
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
              onClick={() => setActiveTab('register')}
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

          {activeTab === 'login' ? (
            <LoginForm
              onSuccess={handleLoginSuccess}
              allowedRoles={['USER']}
              submitLabel="Đăng nhập ngay"
            />
          ) : (
            <RegisterForm onSuccess={handleRegisterSuccess} />
          )}
        </div>
      </div>
    </div>
  )
}
