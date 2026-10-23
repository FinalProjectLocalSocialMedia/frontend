import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Shield, User, UserCheck, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type {
  AdminUserDetail,
  AdminUserListItem,
  CreateUserInput,
  Role,
  UpdateUserInput,
} from '@/features/admin-moderation/lib/types'
import { useCreateUser, useUpdateUser } from '../api/users.queries'

type UserFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: AdminUserListItem | AdminUserDetail | null
  onSuccess?: () => void
}

const userFormSchema = z
  .object({
    role: z.enum(['NORMAL_USER', 'MODERATOR', 'ADMIN']),
    email: z.string().trim().email('Email không đúng định dạng'),
    password: z.string().optional(),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^0[0-9]{9}$/, 'Số điện thoại gồm 10 chữ số bắt đầu bằng 0')
      .or(z.literal('')),
    fullName: z.string().trim().max(100, 'Họ tên tối đa 100 ký tự').optional(),
    avatarUrl: z.string().trim().optional(),
    bio: z.string().trim().max(500, 'Tiểu sử tối đa 500 ký tự').optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['0', '1', '2']),
  })
  .superRefine((data, ctx) => {
    // Khi tạo mới: bắt buộc có mật khẩu ≥ 8 ký tự
    // (Chúng ta kiểm tra context hoặc mode sau)
    if (data.role === 'NORMAL_USER' && (!data.fullName || data.fullName.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fullName'],
        message: 'Họ tên là bắt buộc đối với người dùng thông thường',
      })
    }
  })

type UserFormValues = z.infer<typeof userFormSchema>

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserFormDialogProps) {
  const isEdit = Boolean(user)
  const [submitting, setSubmitting] = useState(false)

  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()

  const defaultRole: Role = user?.role
    ? user.role === 'USER'
      ? 'NORMAL_USER'
      : user.role
    : 'NORMAL_USER'

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      role: defaultRole,
      email: user?.email || '',
      password: '',
      phoneNumber: user?.phoneNumber || '',
      fullName: user?.displayName || '',
      avatarUrl: user?.avatarUrl || '',
      bio: '',
      dateOfBirth: '',
      gender: '1',
    },
  })

  const selectedRole = useWatch({ control, name: 'role' })

  // Cập nhật giá trị khi mở modal hoặc thay đổi user edit
  useEffect(() => {
    if (open) {
      if (user) {
        const uRole = user.role === 'USER' ? 'NORMAL_USER' : user.role
        const detail = 'profile' in user ? (user as AdminUserDetail) : null
        reset({
          role: uRole as 'NORMAL_USER' | 'MODERATOR' | 'ADMIN',
          email: user.email || '',
          password: '',
          phoneNumber: user.phoneNumber || '',
          fullName: user.displayName || '',
          avatarUrl: user.avatarUrl || '',
          bio: detail?.profile?.bio || '',
          dateOfBirth: detail?.profile?.dateOfBirth || '',
          gender: detail?.profile?.gender !== undefined ? (String(detail.profile.gender) as '0' | '1' | '2') : '1',
        })
      } else {
        reset({
          role: 'NORMAL_USER',
          email: '',
          password: '',
          phoneNumber: '',
          fullName: '',
          avatarUrl: '',
          bio: '',
          dateOfBirth: '',
          gender: '1',
        })
      }
    }
  }, [open, user, reset])

  const onSubmit = async (values: UserFormValues) => {
    if (!isEdit && (!values.password || values.password.length < 8)) {
      setError('password', {
        message: 'Mật khẩu là bắt buộc và phải có ít nhất 8 ký tự',
      })
      return
    }

    setSubmitting(true)
    try {
      if (isEdit && user) {
        const updatePayload: UpdateUserInput = {
          email: values.email !== user.email ? values.email : undefined,
          phoneNumber: values.phoneNumber || undefined,
          profile:
            values.role === 'NORMAL_USER'
              ? {
                  fullName: values.fullName || '',
                  avatarUrl: values.avatarUrl || '',
                  bio: values.bio || '',
                  dateOfBirth: values.dateOfBirth || '',
                  gender: Number(values.gender),
                }
              : undefined,
        }

        await updateMutation.mutateAsync({
          id: user.id,
          input: updatePayload,
        })
        toast.success(`Đã cập nhật thông tin tài khoản ${values.fullName || values.email}`)
      } else {
        let createPayload: CreateUserInput
        if (values.role === 'NORMAL_USER') {
          createPayload = {
            role: 'NORMAL_USER',
            email: values.email,
            password: values.password || '',
            phoneNumber: values.phoneNumber || '',
            profile: {
              fullName: values.fullName || '',
              avatarUrl: values.avatarUrl || undefined,
              bio: values.bio || undefined,
              dateOfBirth: values.dateOfBirth || '2000-01-01',
              gender: Number(values.gender),
            },
          }
        } else {
          createPayload = {
            role: values.role,
            email: values.email,
            password: values.password || '',
            phoneNumber: values.phoneNumber || '',
          }
        }

        await createMutation.mutateAsync(createPayload)
        toast.success(`Đã tạo tài khoản mới: ${values.email}`)
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu thông tin'
      if (msg.includes('Email đã tồn tại')) {
        setError('email', { message: 'Email đã tồn tại trong hệ thống' })
      } else if (msg.includes('Số điện thoại đã tồn tại')) {
        setError('phoneNumber', { message: 'Số điện thoại đã tồn tại trong hệ thống' })
      } else {
        toast.error(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {isEdit ? <UserCheck className="size-5" /> : <UserPlus className="size-5" />}
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {isEdit ? 'Chỉnh sửa tài khoản người dùng' : 'Thêm tài khoản người dùng mới'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isEdit
                  ? 'Cập nhật thông tin định danh và hồ sơ tài khoản trong hệ thống.'
                  : 'Khởi tạo tài khoản Người dùng, Kiểm duyệt viên hoặc Quản trị viên mới.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Lựa chọn vai trò (chỉ khi tạo mới) */}
          {!isEdit ? (
            <Field>
              <FieldLabel className="text-xs font-semibold">Vai trò tài khoản *</FieldLabel>
              <Tabs
                value={selectedRole}
                onValueChange={(val) => {
                  if (val) setValue('role', String(val) as 'NORMAL_USER' | 'MODERATOR' | 'ADMIN')
                }}
              >
                <TabsList className="grid grid-cols-3 w-full bg-muted/60">
                  <TabsTrigger value="NORMAL_USER" className="gap-1.5 text-xs cursor-pointer">
                    <User className="size-3.5" />
                    Người dùng
                  </TabsTrigger>
                  <TabsTrigger value="MODERATOR" className="gap-1.5 text-xs cursor-pointer">
                    <Shield className="size-3.5" />
                    Kiểm duyệt viên
                  </TabsTrigger>
                  <TabsTrigger value="ADMIN" className="gap-1.5 text-xs cursor-pointer">
                    <Shield className="size-3.5 text-amber-500" />
                    Quản trị viên
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </Field>
          ) : (
            <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2.5 text-xs">
              <span className="text-muted-foreground">Vai trò:</span>
              <span className="font-semibold text-foreground">
                {selectedRole === 'ADMIN'
                  ? 'Quản trị viên (ADMIN)'
                  : selectedRole === 'MODERATOR'
                    ? 'Kiểm duyệt viên (MODERATOR)'
                    : 'Người dùng thông thường (USER)'}
              </span>
            </div>
          )}

          {/* Thông tin tài khoản đăng nhập */}
          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel className="text-xs font-medium">Email đăng nhập *</FieldLabel>
              <Input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                className="text-xs"
              />
              {errors.email && <FieldError className="text-xs">{errors.email.message}</FieldError>}
            </Field>

            <Field data-invalid={Boolean(errors.phoneNumber)}>
              <FieldLabel className="text-xs font-medium">Số điện thoại</FieldLabel>
              <Input
                {...register('phoneNumber')}
                placeholder="0912345678"
                className="text-xs"
              />
              {errors.phoneNumber && (
                <FieldError className="text-xs">{errors.phoneNumber.message}</FieldError>
              )}
            </Field>
          </FieldGroup>

          {!isEdit && (
            <Field data-invalid={Boolean(errors.password)}>
              <FieldLabel className="text-xs font-medium">Mật khẩu khởi tạo *</FieldLabel>
              <Input
                {...register('password')}
                type="password"
                placeholder="Tối thiểu 8 ký tự..."
                className="text-xs"
              />
              {errors.password && (
                <FieldError className="text-xs">{errors.password.message}</FieldError>
              )}
            </Field>
          )}

          {/* Thông tin hồ sơ (Chỉ áp dụng cho NORMAL_USER) */}
          {selectedRole === 'NORMAL_USER' && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-3 pt-2.5">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="size-3.5 text-primary" />
                Hồ sơ người dùng (Normal User Profile)
              </p>

              <Field data-invalid={Boolean(errors.fullName)}>
                <FieldLabel className="text-xs font-medium">Họ và tên *</FieldLabel>
                <Input
                  {...register('fullName')}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="text-xs"
                />
                {errors.fullName && (
                  <FieldError className="text-xs">{errors.fullName.message}</FieldError>
                )}
              </Field>

              <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field>
                  <FieldLabel className="text-xs font-medium">Ngày sinh</FieldLabel>
                  <Input
                    {...register('dateOfBirth')}
                    type="date"
                    className="text-xs"
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-xs font-medium">Giới tính</FieldLabel>
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectItem value="1">Nam</SelectItem>
                          <SelectItem value="0">Nữ</SelectItem>
                          <SelectItem value="2">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </FieldGroup>

              <Field>
                <FieldLabel className="text-xs font-medium">Đường dẫn ảnh đại diện (Avatar URL)</FieldLabel>
                <Input
                  {...register('avatarUrl')}
                  placeholder="https://..."
                  className="text-xs font-mono"
                />
              </Field>

              <Field data-invalid={Boolean(errors.bio)}>
                <FieldLabel className="text-xs font-medium">Tiểu sử (Bio)</FieldLabel>
                <Textarea
                  {...register('bio')}
                  placeholder="Giới thiệu ngắn về bản thân..."
                  rows={2}
                  className="text-xs"
                />
                {errors.bio && <FieldError className="text-xs">{errors.bio.message}</FieldError>}
              </Field>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-xs"
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="text-xs gap-1.5"
            >
              {submitting && <Spinner className="size-3.5" />}
              {isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
