import { useId, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  FileText,
  Lock,
  MessageSquareWarning,
  ShieldAlert,
  Trash2,
  XCircle,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { StaffCell } from '@/features/admin-moderation/components/staff-cell'
import { TEXT_MAX_LENGTH } from '@/features/admin-moderation/lib/constants'
import { formatDateTime } from '@/features/admin-moderation/lib/formatters'
import type {
  ModerationAction,
  ReportDetail,
  ResolveReportInput,
} from '@/features/admin-moderation/lib/types'
import { ResolveConfirmDialog } from './resolve-confirm-dialog'

type ActionPanelProps = {
  report: ReportDetail
  onSubmit: (data: ResolveReportInput) => Promise<void>
  isSubmitting?: boolean
  readOnly?: boolean
}

type ActionConfig = {
  id: ModerationAction
  label: string
  description: string
  icon: typeof Trash2
  badgeVariant?: 'default' | 'destructive' | 'secondary' | 'outline'
  disabled: boolean
  disabledReason?: string
}

export function ActionPanel({
  report,
  onSubmit,
  isSubmitting = false,
  readOnly = false,
}: ActionPanelProps) {
  const noteId = useId()
  const [selectedActions, setSelectedActions] = useState<ModerationAction[]>([])
  const [internalNote, setInternalNote] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Phân tích đối tượng từ report.target
  const target = report.target
  const isContentTarget = target.type === 'POST' || target.type === 'COMMENT'
  const isUserTarget = target.type === 'USER'

  const isContentAlreadyRemoved = isContentTarget && target.status === 'REMOVED'

  const targetUserStatus = isUserTarget ? target.user.status : target.author.status
  const isUserAlreadyLocked = targetUserStatus === 'LOCKED'

  const targetUserRole = isUserTarget ? target.user.role : 'NORMAL_USER'
  const isTargetStaff = targetUserRole === 'ADMIN' || targetUserRole === 'MODERATOR'

  const availableActions = useMemo<ActionConfig[]>(() => {
    if (isContentTarget) {
      return [
        {
          id: 'REMOVE_CONTENT',
          label: 'Gỡ bỏ nội dung',
          description: 'Nội dung sẽ bị ẩn vĩnh viễn khỏi bảng tin và kết quả tìm kiếm.',
          icon: Trash2,
          badgeVariant: 'destructive',
          disabled: isContentAlreadyRemoved,
          disabledReason: isContentAlreadyRemoved
            ? 'Nội dung này đã bị gỡ hoặc đã bị xoá trước đó'
            : undefined,
        },
        {
          id: 'WARN_OWNER',
          label: 'Cảnh báo tác giả',
          description: 'Gửi thông báo cảnh báo vi phạm tiêu chuẩn cộng đồng đến tác giả.',
          icon: MessageSquareWarning,
          badgeVariant: 'secondary',
          disabled: isTargetStaff,
          disabledReason: isTargetStaff ? 'Không thể áp dụng cảnh báo lên tài khoản quản trị' : undefined,
        },
        {
          id: 'LOCK_OWNER',
          label: 'Khoá tài khoản tác giả',
          description: 'Khoá tài khoản tác giả (không thời hạn cho đến khi mở lại).',
          icon: Lock,
          badgeVariant: 'destructive',
          disabled: isUserAlreadyLocked || isTargetStaff,
          disabledReason: isTargetStaff
            ? 'Không thể áp dụng biện pháp chế tài lên tài khoản quản trị'
            : isUserAlreadyLocked
              ? 'Tài khoản tác giả hiện đang ở trạng thái khoá'
              : undefined,
        },
        {
          id: 'REJECT',
          label: 'Bác bỏ báo cáo',
          description: 'Xác nhận nội dung không vi phạm tiêu chuẩn cộng đồng.',
          icon: CheckCircle2,
          badgeVariant: 'outline',
          disabled: false,
        },
      ]
    }

    if (isUserTarget) {
      return [
        {
          id: 'WARN_USER',
          label: 'Cảnh báo người dùng',
          description: 'Gửi thông báo cảnh báo vi phạm tiêu chuẩn cộng đồng đến người dùng.',
          icon: MessageSquareWarning,
          badgeVariant: 'secondary',
          disabled: isTargetStaff,
          disabledReason: isTargetStaff ? 'Không thể áp dụng cảnh báo lên tài khoản quản trị' : undefined,
        },
        {
          id: 'LOCK_USER',
          label: 'Khoá tài khoản người dùng',
          description: 'Khoá tài khoản người dùng (không thời hạn cho đến khi mở lại).',
          icon: Ban,
          badgeVariant: 'destructive',
          disabled: isUserAlreadyLocked || isTargetStaff,
          disabledReason: isTargetStaff
            ? 'Không thể áp dụng chế tài lên tài khoản quản trị'
            : isUserAlreadyLocked
              ? 'Tài khoản người dùng hiện đang ở trạng thái khoá'
              : undefined,
        },
        {
          id: 'REJECT',
          label: 'Bác bỏ báo cáo',
          description: 'Xác nhận tài khoản không vi phạm tiêu chuẩn cộng đồng.',
          icon: CheckCircle2,
          badgeVariant: 'outline',
          disabled: false,
        },
      ]
    }

    return []
  }, [
    isContentTarget,
    isUserTarget,
    isContentAlreadyRemoved,
    isUserAlreadyLocked,
    isTargetStaff,
  ])

  // Quản lý toggle hành động với luật loại trừ lẫn nhau giữa REJECT và các vi phạm
  const handleToggleAction = (actionId: ModerationAction, checked: boolean) => {
    if (checked) {
      if (actionId === 'REJECT') {
        setSelectedActions(['REJECT'])
      } else {
        setSelectedActions((prev) => [...prev.filter((a) => a !== 'REJECT'), actionId])
      }
    } else {
      setSelectedActions((prev) => prev.filter((a) => a !== actionId))
    }
  }

  const handleOpenConfirm = () => {
    if (selectedActions.length === 0) return
    setConfirmOpen(true)
  }

  const handleConfirmDecision = async (data: {
    warningMessage?: string
    lockReason?: string
    resolutionNote: string
  }) => {
    const payload: ResolveReportInput = {
      actions: selectedActions,
      resolutionNote: data.resolutionNote || internalNote.trim() || undefined,
      warning: data.warningMessage ? { message: data.warningMessage } : undefined,
      lock: data.lockReason ? { reason: data.lockReason } : undefined,
    }

    await onSubmit(payload)
    setConfirmOpen(false)
  }

  const isResolvedOrRejected = report.status === 'RESOLVED' || report.status === 'REJECTED'

  // Giao diện đã giải quyết / Read-only
  if (readOnly || isResolvedOrRejected) {
    const isResolved = report.status === 'RESOLVED'
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold">Kết quả xử lý</CardTitle>
            <Badge variant={isResolved ? 'default' : 'secondary'} className="gap-1">
              {isResolved ? (
                <>
                  <CheckCircle2 className="size-3" />
                  Đã giải quyết
                </>
              ) : (
                <>
                  <XCircle className="size-3" />
                  Đã bác bỏ
                </>
              )}
            </Badge>
          </div>
          <CardDescription>
            Báo cáo này đã được kết luận và lưu trữ lịch sử xử lý.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
            {report.handledBy && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Người xử lý:</span>
                <StaffCell staff={report.handledBy} showRole={true} />
              </div>
            )}
            {report.handledAt && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Thời gian:</span>
                <span className="font-medium text-foreground">
                  {formatDateTime(report.handledAt)}
                </span>
              </div>
            )}
            {report.resolutionNote && (
              <div className="pt-2 border-t text-xs">
                <span className="text-muted-foreground block mb-1">Ghi chú quyết định:</span>
                <p className="rounded bg-background p-2 italic text-muted-foreground">
                  "{report.resolutionNote}"
                </p>
              </div>
            )}
          </div>

          {isTargetStaff && (
            <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="size-4" />
              <AlertTitle className="text-xs font-semibold">Tài khoản quản trị viên</AlertTitle>
              <AlertDescription className="text-xs">
                Chủ thể liên quan là nhân sự nội bộ, được bảo vệ theo chính sách nhân sự.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  // Tên chủ thể
  const ownerDisplayName = isUserTarget
    ? target.user.id
    : target.author.displayName

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold">Quyết định xử lý</CardTitle>
            <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 gap-1">
              <ShieldAlert className="size-3" />
              Đang chờ xử lý
            </Badge>
          </div>
          <CardDescription>
            Chọn các biện pháp xử lý vi phạm hoặc bác bỏ báo cáo nếu không có vi phạm.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <FieldLabel className="text-xs font-semibold uppercase text-muted-foreground">
              Hành động kiểm duyệt
            </FieldLabel>

            <div className="space-y-2">
              {availableActions.map((action) => {
                const Icon = action.icon
                const isChecked = selectedActions.includes(action.id)
                return (
                  <label
                    key={action.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                      action.disabled
                        ? 'opacity-50 cursor-not-allowed bg-muted/30 border-muted'
                        : isChecked
                          ? 'border-primary/50 bg-primary/5 cursor-pointer'
                          : 'hover:bg-muted/50 cursor-pointer border-border'
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      disabled={action.disabled}
                      onCheckedChange={(checked) => handleToggleAction(action.id, Boolean(checked))}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium leading-none">{action.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {action.description}
                      </p>
                      {action.disabled && action.disabledReason && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          ⚠ {action.disabledReason}
                        </p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <FieldGroup className="pt-2">
            <Field>
              <div className="flex justify-between items-center">
                <FieldLabel htmlFor={noteId} className="text-xs font-semibold text-muted-foreground uppercase">
                  Ghi chú nội bộ (tuỳ chọn)
                </FieldLabel>
                <span className="text-[11px] text-muted-foreground">
                  {internalNote.length}/{TEXT_MAX_LENGTH}
                </span>
              </div>
              <Textarea
                id={noteId}
                rows={3}
                placeholder="Nhập lý do kiểm duyệt, căn cứ điều khoản tiêu chuẩn cộng đồng..."
                value={internalNote}
                maxLength={TEXT_MAX_LENGTH}
                onChange={(e) => setInternalNote(e.target.value)}
                className="text-xs resize-none"
              />
              <FieldDescription className="text-[11px]">
                Ghi chú này chỉ lưu vào nhật ký kiểm duyệt nội bộ và không hiển thị cho người dùng.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t pt-4">
          <Button
            className="w-full"
            disabled={selectedActions.length === 0 || isSubmitting}
            onClick={handleOpenConfirm}
          >
            <FileText className="size-4 mr-1.5" />
            Xác nhận quyết định ({selectedActions.length})
          </Button>
          {selectedActions.length === 0 && (
            <p className="text-[11px] text-center text-muted-foreground">
              Vui lòng chọn ít nhất một hành động để tiếp tục
            </p>
          )}
        </CardFooter>
      </Card>

      <ResolveConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        actions={selectedActions}
        targetType={report.targetType}
        reportCount={report.reportCount}
        ownerName={ownerDisplayName}
        initialResolutionNote={internalNote}
        onConfirm={handleConfirmDecision}
        isSubmitting={isSubmitting}
      />
    </>
  )
}
