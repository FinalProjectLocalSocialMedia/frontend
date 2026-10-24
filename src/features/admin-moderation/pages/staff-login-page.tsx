import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { LoginForm } from '@/features/auth/components/login-form'
import { useAuth } from '@/features/auth/context/auth-context'
import type { AuthUser } from '@/features/auth/types/auth'
import { AdminThemeToggle } from '../components/admin-theme-toggle'
import { resolveAdminRedirect } from '../lib/nav'
import { usePageTitle } from '../lib/use-page-title'

export default function StaffLoginPage() {
  usePageTitle('Đăng nhập Quản trị')
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const from = searchParams.get('from') ?? undefined

  if (user && (user.role === 'ADMIN' || user.role === 'MODERATOR')) {
    return <Navigate to={resolveAdminRedirect(from, user.role)} replace />
  }

  const handleSuccess = (authed: AuthUser) => {
    const target = resolveAdminRedirect(from, authed.role)
    navigate(target, { replace: true })
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-4 right-4">
        <AdminThemeToggle />
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-xl shadow-md">
            N
          </div>
          <span className="font-bold tracking-tight text-xl">nearby.</span>
          <span className="text-xs text-muted-foreground">Hệ thống Quản trị & Kiểm duyệt</span>
        </div>

        <Card className="shadow-lg border-border/80">
          <CardHeader className="space-y-1 text-center">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Đăng nhập quản trị</h1>
            <CardDescription className="text-xs">
              Sử dụng tài khoản nhân viên được cấp để tiếp tục
            </CardDescription>
          </CardHeader>

          <CardContent>
            <LoginForm
              variant="admin"
              allowedRoles={['ADMIN', 'MODERATOR']}
              submitLabel="Đăng nhập quản trị"
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
