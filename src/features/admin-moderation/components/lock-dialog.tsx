import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Lock } from 'lucide-react'
import { z } from 'zod'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { initialsOf } from '../lib/labels'
import type { UserRef } from '../lib/types'

type LockDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserRef | null
  onSubmit: (reason: string) => Promise<void> | void
}

const lockSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập lý do khoá tài khoản')
    .max(1000, 'Lý do khoá tối đa 1000 ký tự'),
})

type LockFormValues = z.infer<typeof lockSchema>

export function LockDialog({ open, onOpenChange, user, onSubmit }: LockDialogProps) {
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<LockFormValues>({
    resolver: zodResolver(lockSchema),
    defaultValues: { reason: '' },
  })

  const currentReason = useWatch({ control, name: 'reason' }) || ''

  const handleFormSubmit = async (data: LockFormValues) => {
    try {
      setSubmitting(true)
      await onSubmit(data.reason)
      reset()
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <Lock className="size-5 shrink-0" />
              <DialogTitle>Khoá tài khoản người dùng</DialogTitle>
            </div>
            <DialogDescription>
              Tài khoản sẽ bị đình chỉ hoạt động ngay lập tức và không có thời hạn (cho đến khi được mở lại thủ công).
            </DialogDescription>
          </DialogHeader>

          {/* Thông tin đối tượng bị khoá */}
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
            <Avatar size="default">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
              <AvatarFallback>{initialsOf(user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm text-foreground truncate">
                {user.displayName}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                ID: {user.id}
              </div>
            </div>
          </div>

          {/* Cảnh báo tính chất khoá không thời hạn (D8) */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-semibold">Lưu ý quan trọng:</strong> Biện pháp khoá tài khoản áp dụng{' '}
              <strong>cho đến khi được mở lại</strong> (không có thời hạn tự động hết hiệu lực). Người dùng sẽ không thể đăng nhập hoặc thực hiện bất kỳ tương tác nào trên ứng dụng.
            </div>
          </div>

          <FieldGroup>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="lock-reason">Lý do khoá tài khoản</FieldLabel>
                <span className="text-[11px] text-muted-foreground">
                  {currentReason.length}/1000
                </span>
              </div>
              <Textarea
                id="lock-reason"
                rows={4}
                placeholder="Ví dụ: Tài khoản tái phạm nhiều lần hành vi đăng tải nội dung phản cảm và quấy rối người dùng khác..."
                maxLength={1000}
                {...register('reason')}
                disabled={submitting}
              />
              {errors.reason && <FieldError>{errors.reason.message}</FieldError>}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={submitting}
            >
              {submitting && <Spinner className="size-4 mr-2" />}
              Xác nhận khoá tài khoản
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
