import { useState } from 'react'
import { AlertCircle, ShieldAlert } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { TEXT_MAX_LENGTH } from '@/features/admin-moderation/lib/constants'
import type { ModerationAction, ReportTargetType } from '@/features/admin-moderation/lib/types'

type ResolveConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  actions: ModerationAction[]
  targetType: ReportTargetType
  reportCount: number
  ownerName: string
  initialResolutionNote: string
  onConfirm: (data: {
    warningMessage?: string
    lockReason?: string
    resolutionNote: string
  }) => Promise<void>
  isSubmitting?: boolean
}

const ACTION_LABELS: Record<ModerationAction, string> = {
  REMOVE_CONTENT: 'Gỡ bỏ nội dung vi phạm',
  WARN_OWNER: 'Gửi cảnh báo tới tác giả',
  LOCK_OWNER: 'Khoá tài khoản tác giả',
  WARN_USER: 'Gửi cảnh báo người dùng',
  LOCK_USER: 'Khoá tài khoản người dùng',
  REJECT: 'Bác bỏ báo cáo (Không vi phạm)',
}

/**
 * Hộp thoại tóm tắt và xác nhận quyết định xử lý báo cáo.
 * Thu thập nội dung cảnh báo / lý do khoá nếu có hành động tương ứng.
 */
export function ResolveConfirmDialog({
  open,
  onOpenChange,
  actions,
  reportCount,
  ownerName,
  initialResolutionNote,
  onConfirm,
  isSubmitting = false,
}: ResolveConfirmDialogProps) {
  const [warningMessage, setWarningMessage] = useState(
    'Nội dung của bạn đã vi phạm tiêu chuẩn cộng đồng về quy chuẩn ứng xử.',
  )
  const [lockReason, setLockReason] = useState(
    'Tài khoản có hành vi vi phạm nghiêm trọng hoặc tái phạm nhiều lần tiêu chuẩn cộng đồng.',
  )
  const [resolutionNote, setResolutionNote] = useState(initialResolutionNote)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const hasWarn = actions.includes('WARN_OWNER') || actions.includes('WARN_USER')
  const hasLock = actions.includes('LOCK_OWNER') || actions.includes('LOCK_USER')
  const isReject = actions.includes('REJECT')

  const handleConfirm = async () => {
    setErrorMessage(null)

    if (hasWarn && !warningMessage.trim()) {
      setErrorMessage('Vui lòng nhập nội dung cảnh báo gửi tới người dùng.')
      return
    }

    if (hasLock && !lockReason.trim()) {
      setErrorMessage('Vui lòng nhập lý do khoá tài khoản.')
      return
    }

    try {
      await onConfirm({
        warningMessage: hasWarn ? warningMessage.trim() : undefined,
        lockReason: hasLock ? lockReason.trim() : undefined,
        resolutionNote: resolutionNote.trim(),
      })
      onOpenChange(false)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setErrorMessage(String((err as { message: unknown }).message))
      } else {
        setErrorMessage('Không thể xử lý báo cáo. Vui lòng thử lại.')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-primary" />
            <span>Xác nhận quyết định xử lý</span>
          </DialogTitle>
          <DialogDescription>
            Xem lại danh sách hành động và thông tin chế tài trước khi áp dụng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1 text-sm">
          {errorMessage && (
            <Alert variant="destructive" className="py-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* Danh sách hành động đã chọn */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Hành động áp dụng:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {actions.map((act) => (
                <Badge
                  key={act}
                  variant={act === 'REJECT' ? 'secondary' : 'default'}
                  className="text-xs py-1 px-2.5"
                >
                  {ACTION_LABELS[act]}
                </Badge>
              ))}
            </div>
          </div>

          {/* Thông báo phạm vi xử lý (D7) */}
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            {isReject ? (
              <p>
                Quyết định này sẽ bác bỏ <strong>{reportCount}</strong> báo cáo đang chờ cùng đối
                tượng. Tác giả ({ownerName}) sẽ <strong>không</strong> nhận thông báo.
              </p>
            ) : (
              <p>
                Quyết định này sẽ xử lý đồng thời <strong>{reportCount}</strong> báo cáo đang chờ
                cùng đối tượng, gửi thông báo cảm ơn tới tất cả người báo cáo và áp dụng chế tài lên{' '}
                <strong>{ownerName}</strong>.
              </p>
            )}
          </div>

          <FieldGroup className="space-y-3">
            {/* Nhập nội dung cảnh báo nếu có WARN */}
            {hasWarn && (
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Nội dung gửi cảnh báo</FieldLabel>
                  <span className="text-[11px] text-muted-foreground">
                    {warningMessage.length}/{TEXT_MAX_LENGTH}
                  </span>
                </div>
                <Textarea
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  maxLength={TEXT_MAX_LENGTH}
                  rows={2}
                  className="resize-none text-xs"
                  placeholder="Nhập thông điệp cảnh báo..."
                  disabled={isSubmitting}
                />
              </Field>
            )}

            {/* Nhập lý do khoá nếu có LOCK */}
            {hasLock && (
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Lý do khoá tài khoản</FieldLabel>
                  <span className="text-[11px] text-muted-foreground">
                    {lockReason.length}/{TEXT_MAX_LENGTH}
                  </span>
                </div>
                <Textarea
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  maxLength={TEXT_MAX_LENGTH}
                  rows={2}
                  className="resize-none text-xs"
                  placeholder="Nhập lý do khoá tài khoản..."
                  disabled={isSubmitting}
                />
                <p className="text-[11px] text-destructive">
                  * Tài khoản sẽ bị khoá không thời hạn cho đến khi được mở lại thủ công (D8).
                </p>
              </Field>
            )}

            {/* Ghi chú nội bộ */}
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>Ghi chú nội bộ cho ban quản trị</FieldLabel>
                <span className="text-[11px] text-muted-foreground">
                  {resolutionNote.length}/{TEXT_MAX_LENGTH}
                </span>
              </div>
              <Textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                maxLength={TEXT_MAX_LENGTH}
                rows={2}
                className="resize-none text-xs"
                placeholder="Ghi chú nội bộ (tuỳ chọn, lưu audit)..."
                disabled={isSubmitting}
              />
            </Field>
          </FieldGroup>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Huỷ
          </Button>
          <Button
            type="button"
            variant={isReject ? 'secondary' : 'default'}
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting && <Spinner className="size-4" />}
            <span>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận xử lý'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
