import { ReportTargetDialog } from '@/components/shared/report-target-dialog'
import { createReport } from '../api/profile-api'

interface ReportUserDialogProps {
  targetUserId: string
  onClose: () => void
}

export function ReportUserDialog({ targetUserId, onClose }: ReportUserDialogProps) {
  return (
    <ReportTargetDialog
      targetType="USER"
      targetId={targetUserId}
      onClose={onClose}
      onSubmitReport={createReport}
    />
  )
}
