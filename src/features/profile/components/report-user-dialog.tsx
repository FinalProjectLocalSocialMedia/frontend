import { useState } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { useReportUserMutation } from '../api/profile-queries'
import { OTHER_REPORT_REASON, REPORT_USER_REASONS } from '../types/profile'

interface ReportUserDialogProps {
  targetUserId: string
  onClose: () => void
}

function getApiErrorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || 'Không thể gửi báo cáo. Vui lòng thử lại.'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Không thể gửi báo cáo. Vui lòng thử lại.'
}

export function ReportUserDialog({ targetUserId, onClose }: ReportUserDialogProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const reportMutation = useReportUserMutation()

  const isOtherSelected = selectedReason === OTHER_REPORT_REASON
  const finalReason = isOtherSelected ? customReason.trim() : selectedReason
  const canSubmit = Boolean(finalReason) && !reportMutation.isPending

  async function handleSubmit() {
    if (!finalReason || reportMutation.isPending) return
    setSubmitError(null)
    try {
      await reportMutation.mutateAsync({ targetId: targetUserId, reason: finalReason })
      toast.success('Đã gửi báo cáo', {
        description: 'Cảm ơn bạn đã góp phần giữ an toàn cho Nearby.',
      })
      onClose()
    } catch (error) {
      const message = getApiErrorMessage(error)
      setSubmitError(message)
      toast.error('Không thể gửi báo cáo', { description: message })
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !reportMutation.isPending) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tại sao bạn báo cáo người dùng này?</DialogTitle>
          <DialogDescription>
            Chọn một lý do phù hợp nhất để đội ngũ Nearby xem xét và xử lý.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selectedReason}
          onValueChange={(value) => {
            setSelectedReason(String(value))
            setSubmitError(null)
          }}
          className="gap-1.5"
        >
          {REPORT_USER_REASONS.map((reason, index) => {
            const optionId = `report-user-reason-${index}`
            return (
              <label
                key={reason}
                htmlFor={optionId}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm transition-colors hover:bg-muted has-data-checked:border-primary/30 has-data-checked:bg-primary/5"
              >
                <RadioGroupItem id={optionId} value={reason} />
                <span className="leading-snug text-foreground">{reason}</span>
              </label>
            )
          })}
        </RadioGroup>

        {isOtherSelected && (
          <Textarea
            value={customReason}
            onChange={(e) => {
              setCustomReason(e.target.value)
              setSubmitError(null)
            }}
            placeholder="Nhập lý do báo cáo của bạn..."
            maxLength={1000}
            className="min-h-24"
          />
        )}

        {submitError && (
          <p role="alert" className="text-sm text-destructive">
            {submitError}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={reportMutation.isPending}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {reportMutation.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
