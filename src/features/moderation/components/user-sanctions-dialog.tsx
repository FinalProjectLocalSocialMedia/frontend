import { AlertTriangle, History, Lock, Unlock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { StaffCell } from '@/features/admin-moderation/components/staff-cell'
import { formatDateTime } from '@/features/admin-moderation/lib/formatters'
import type { UserRef } from '@/features/admin-moderation/lib/types'
import { useUserSanctions } from '../api/accounts.queries'

type UserSanctionsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserRef | null
}

export function UserSanctionsDialog({
  open,
  onOpenChange,
  user,
}: UserSanctionsDialogProps) {
  const { data: sanctions = [], isLoading } = useUserSanctions(
    user?.id ?? '',
    open && !!user?.id
  )

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            <DialogTitle>Lịch sử xử phạt tài khoản</DialogTitle>
          </div>
          <DialogDescription>
            Danh sách các quyết định cảnh báo, tạm khoá và mở khoá đối với{' '}
            <strong className="text-foreground">{user.displayName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground gap-2">
              <Spinner className="size-5" />
              <span>Đang tải lịch sử xử phạt...</span>
            </div>
          ) : sanctions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-xs text-muted-foreground">
              Tài khoản này chưa từng ghi nhận vi phạm, cảnh báo hoặc quyết định khoá nào.
            </div>
          ) : (
            <div className="space-y-3">
              {sanctions.map((s) => {
                const isLock = s.type === 'LOCK'
                const isCurrentlyLocked = isLock && !s.liftedAt

                return (
                  <div
                    key={s.id}
                    className="rounded-lg border bg-card p-3 shadow-xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2">
                        {isLock ? (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <Lock className="size-3" />
                            Khoá tài khoản
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <AlertTriangle className="size-3" />
                            Cảnh báo
                          </Badge>
                        )}

                        {isCurrentlyLocked && (
                          <Badge variant="destructive" className="text-[10px] animate-pulse">
                            Đang bị khoá
                          </Badge>
                        )}
                      </div>

                      <span className="text-[11px] text-muted-foreground">
                        {formatDateTime(s.issuedAt)}
                      </span>
                    </div>

                    <div>
                      <span className="font-medium text-foreground">Lý do: </span>
                      <span className="text-muted-foreground">{s.reason}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                      <span>Người ban hành:</span>
                      <StaffCell staff={s.issuedBy} showRole={true} />
                    </div>

                    {/* Trường hợp lệnh khoá đã được mở */}
                    {s.liftedAt && (
                      <div className="rounded border border-primary/20 bg-primary/5 p-2 text-[11px] space-y-1 mt-1 text-primary">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-semibold">
                            <Unlock className="size-3" /> Đã mở khoá
                          </span>
                          <span className="text-muted-foreground">
                            {formatDateTime(s.liftedAt)}
                          </span>
                        </div>
                        {s.liftedBy && (
                          <div className="text-muted-foreground flex items-center gap-1.5">
                            <span>Người mở khoá:</span>
                            <StaffCell staff={s.liftedBy} showRole={true} />
                          </div>
                        )}
                        {s.liftNote && (
                          <p className="text-muted-foreground">
                            Ghi chú: {s.liftNote}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
