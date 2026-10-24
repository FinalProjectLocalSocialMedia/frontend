import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { TEXT_MAX_LENGTH } from '../lib/constants'

type ReasonDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  label?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  requireReason?: boolean
  maxLength?: number
  variant?: 'default' | 'destructive'
  onSubmit: (reason: string) => Promise<void> | void
}

function ReasonFormInner({
  title,
  description,
  label = 'Lý do / Ghi chú',
  placeholder = 'Nhập nội dung...',
  confirmText = 'Xác nhận',
  cancelText = 'Huỷ',
  requireReason = true,
  maxLength = TEXT_MAX_LENGTH,
  variant = 'default',
  onSubmit,
  onClose,
}: Omit<ReasonDialogProps, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false)

  const schema = z.object({
    reason: requireReason
      ? z.string().trim().min(1, 'Vui lòng nhập lý do').max(maxLength, `Tối đa ${maxLength} ký tự`)
      : z.string().trim().max(maxLength, `Tối đa ${maxLength} ký tự`),
  })

  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  })

  // Dùng useWatch theo quy ước React Compiler (mục 9.4)
  const currentReason = useWatch({ control, name: 'reason' }) || ''
  const currentCount = currentReason.length

  const onFormSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true)
      await onSubmit(data.reason)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>

      <FieldGroup>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>{label}</FieldLabel>
            <span
              className={`text-xs ${
                currentCount > maxLength
                  ? 'text-destructive font-semibold'
                  : 'text-muted-foreground'
              }`}
            >
              {currentCount}/{maxLength}
            </span>
          </div>
          <Textarea
            {...register('reason')}
            placeholder={placeholder}
            rows={4}
            disabled={submitting}
            className="resize-none"
          />
          {errors.reason?.message && <FieldError errors={[{ message: errors.reason.message }]} />}
        </Field>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          {cancelText}
        </Button>
        <Button type="submit" variant={variant} disabled={submitting} className="gap-2">
          {submitting && <Spinner className="size-4" />}
          <span>{confirmText}</span>
        </Button>
      </DialogFooter>
    </form>
  )
}

/**
 * Hộp thoại nhập lý do hoặc ghi chú (cho Khoá tài khoản, Gỡ bài, Cảnh báo, Bác bỏ báo cáo,...).
 * Giới hạn tối đa 255 ký tự (hoặc maxLength tuỳ chọn). Reset form sạch mỗi lần mở lại.
 */
export function ReasonDialog({ open, onOpenChange, ...props }: ReasonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <ReasonFormInner {...props} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
