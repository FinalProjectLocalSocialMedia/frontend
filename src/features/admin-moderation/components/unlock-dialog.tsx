import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Unlock } from 'lucide-react'
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
import { formatDateTime } from '../lib/formatters'
import { initialsOf } from '../lib/labels'
import type { LockInfo, UserRef } from '../lib/types'

type UnlockDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: (UserRef & { lock?: LockInfo }) | null
  onSubmit: (note?: string) => Promise<void> | void
}

const unlockSchema = z.object({
  note: z
    .string()
    .trim()
    .max(255, 'Ghi chú mở khoá tối đa 255 ký tự')
    .optional(),
})

type UnlockFormValues = z.infer<typeof unlockSchema>

export function UnlockDialog({ open, onOpenChange, user, onSubmit }: UnlockDialogProps) {
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UnlockFormValues>({
    resolver: zodResolver(unlockSchema),
    defaultValues: { note: '' },
  })

  const currentNote = useWatch({ control, name: 'note' }) || ''

  const handleFormSubmit = async (data: UnlockFormValues) => {
    try {
      setSubmitting(true)
      await onSubmit(data.note || undefined)
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
            <div className="flex items-center gap-2 text-primary">
              <Unlock className="size-5 shrink-0" />
              <DialogTitle>Mở khoá tài khoản người dùng</DialogTitle>
            </div>
            <DialogDescription>
              Khôi phục quyền truy cập bình thường cho tài khoản. Người dùng sẽ có thể đăng nhập lại sau khi mở khoá.
            </DialogDescription>
          </DialogHeader>

          {/* Thông tin người dùng */}
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

          {/* Chi tiết lệnh khoá trước đó nếu có */}
          {user.lock && (
            <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1.5">
              <div className="font-semibold text-muted-foreground">Thông tin lệnh khoá hiện tại:</div>
              <p className="text-foreground">
                <span className="text-muted-foreground">Lý do: </span>
                {user.lock.reason}
              </p>
              <p className="text-muted-foreground text-[11px]">
                Khoá bởi <span className="font-medium text-foreground">{user.lock.lockedBy.email}</span> vào lúc{' '}
                {formatDateTime(user.lock.lockedAt)}
              </p>
            </div>
          )}

          <FieldGroup>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="unlock-note">Ghi chú mở khoá (tuỳ chọn)</FieldLabel>
                <span className="text-[11px] text-muted-foreground">
                  {currentNote.length}/255
                </span>
              </div>
              <Textarea
                id="unlock-note"
                rows={3}
                placeholder="Ví dụ: Người dùng đã giải trình và cam kết không tái phạm..."
                maxLength={255}
                {...register('note')}
                disabled={submitting}
              />
              {errors.note && <FieldError>{errors.note.message}</FieldError>}
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
              disabled={submitting}
              className="gap-1.5"
            >
              {submitting ? (
                <Spinner className="size-4 mr-1" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Xác nhận mở khoá
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
