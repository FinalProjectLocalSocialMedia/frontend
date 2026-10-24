import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Lock, Mail } from 'lucide-react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { isApiError } from '@/lib/http-client'
import { z } from 'zod'
import { useAuth } from '../auth/auth-context'
import { AdminThemeToggle } from '../components/admin-theme-toggle'
import { resolveAdminRedirect } from '../lib/nav'
import { usePageTitle } from '../lib/use-page-title'

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập địa chỉ email')
    .email('Địa chỉ email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

type LoginFormValues = z.infer<typeof loginSchema>

/**
 * Trang đăng nhập khu vực quản trị và kiểm duyệt.
 * Tuân thủ mục 5.5: bắt lỗi chuẩn theo mã INVALID_CREDENTIALS, ACCOUNT_LOCKED, NOT_STAFF.
 */
export default function LoginPage() {
  usePageTitle('Đăng nhập')
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = searchParams.get('from') ?? undefined

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // Nếu đã đăng nhập, tự động chuyển về trang đích hợp lệ
  if (user) {
    return <Navigate to={resolveAdminRedirect(from, user.role)} replace />
  }

  const onSubmit = async (values: LoginFormValues) => {
    setGeneralError(null)
    setSubmitting(true)

    try {
      const authed = await login(values)
      const target = resolveAdminRedirect(from, authed.role)
      navigate(target, { replace: true })
    } catch (err) {
      if (isApiError(err)) {
        if (err.fieldErrors) {
          for (const [field, msg] of Object.entries(err.fieldErrors)) {
            if (field === 'email' || field === 'password') {
              setError(field, { message: msg })
            }
          }
        }

        if (err.code === 'ACCOUNT_LOCKED') {
          setGeneralError('Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị viên.')
        } else if (err.code === 'NOT_STAFF') {
          setGeneralError('Tài khoản này không có quyền truy cập khu vực quản trị.')
        } else if (err.code === 'INVALID_CREDENTIALS' || err.status === 401) {
          setGeneralError('Email hoặc mật khẩu không chính xác.')
        } else if (err.status === 0) {
          setGeneralError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.')
        } else {
          setGeneralError(err.message || 'Đăng nhập không thành công. Vui lòng thử lại.')
        }
      } else {
        setGeneralError('Đã có lỗi không mong muốn xảy ra. Vui lòng thử lại.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
      {/* Nút chuyển theme góc trên */}
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
            {/* Thẻ h1 duy nhất cho trang đăng nhập */}
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Đăng nhập quản trị
            </h1>
            <CardDescription className="text-xs">
              Sử dụng tài khoản nhân viên được cấp để tiếp tục
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {generalError && (
                <Alert variant="destructive" className="py-2.5 px-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <AlertDescription className="text-xs leading-normal">
                      {generalError}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@nearby.local"
                      autoComplete="email"
                      disabled={submitting}
                      {...register('email')}
                      className="pl-9"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {errors.email?.message && (
                    <FieldError errors={[{ message: errors.email.message }]} />
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={submitting}
                      {...register('password')}
                      className="pl-9"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {errors.password?.message && (
                    <FieldError errors={[{ message: errors.password.message }]} />
                  )}
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full gap-2 font-medium"
              >
                {submitting && <Spinner className="size-4" />}
                <span>{submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
