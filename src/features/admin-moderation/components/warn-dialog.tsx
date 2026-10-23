import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
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

type WarnDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserRef | null
  onSubmit: (message: string) => Promise<void> | void
}

const warnSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập nội dung cảnh báo')
    .max(255, 'Nội dung cảnh báo tối đa 255 ký tự'),
})

type WarnFormValues = z.infer<typeof warnSchema>

export function WarnDialog({ open, onOpenChange, user, onSubmit }: WarnDialogProps) {
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<WarnFormValues>({
    resolver: zodResolver(warnSchema),
    defaultValues: { message: '' },
  })

  const currentMessage = useWatch({ control, name: 'message' }) || ''

  const handleFormSubmit = async (data: WarnFormValues) => {
    try {
      setSubmitting(true)
      await onSubmit(data.message)
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
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <AlertTriangle className="size-5 shrink-0" />
              <DialogTitle>Gửi cảnh báo người dùng</DialogTitle>
            </div>
            <DialogDescription>
              Cảnh báo sẽ được lưu vào lịch sử xử phạt của tài khoản và gửi thông báo trực tiếp đến người dùng.
            </DialogDescription>
          </DialogHeader>

          {/* Thông tin đối tượng nhận cảnh báo */}
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

          <FieldGroup>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="warn-message">Nội dung cảnh báo</FieldLabel>
                <span className="text-[11px] text-muted-foreground">
                  {currentMessage.length}/255
                </span>
              </div>
              <Textarea
                id="warn-message"
                rows={4}
                placeholder="Ví dụ: Bài viết của bạn vi phạm quy định tiêu chuẩn cộng đồng về ngôn từ kích động..."
                maxLength={255}
                {...register('message')}
                disabled={submitting}
              />
              {errors.message && <FieldError>{errors.message.message}</FieldError>}
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
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={submitting}
            >
              {submitting && <Spinner className="size-4 mr-2" />}
              Gửi cảnh báo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
