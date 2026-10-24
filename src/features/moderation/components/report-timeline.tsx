import { useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  History,
  Info,
  Layers,
  Lock,
  MessageSquare,
  ShieldAlert,
  Trash2,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StaffCell } from '@/features/admin-moderation/components/staff-cell'
import { formatDateTime } from '@/features/admin-moderation/lib/formatters'
import type { AuditLog } from '@/features/admin-moderation/lib/types'

type ReportTimelineProps = {
  history?: AuditLog[]
  className?: string
}

const ACTION_MAP: Record<
  string,
  { label: string; icon: typeof Info; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  REPORT_RESOLVED: {
    label: 'Đã giải quyết báo cáo',
    icon: CheckCircle2,
    variant: 'default',
  },
  REPORT_REJECTED: {
    label: 'Đã bác bỏ báo cáo',
    icon: XCircle,
    variant: 'secondary',
  },
  POST_REMOVED: {
    label: 'Gỡ bài viết vi phạm',
    icon: Trash2,
    variant: 'destructive',
  },
  COMMENT_REMOVED: {
    label: 'Gỡ bình luận vi phạm',
    icon: Trash2,
    variant: 'destructive',
  },
  USER_LOCKED: {
    label: 'Khoá tài khoản người dùng',
    icon: Lock,
    variant: 'destructive',
  },
  USER_WARNED: {
    label: 'Cảnh báo vi phạm',
    icon: AlertTriangle,
    variant: 'outline',
  },
  USER_UNLOCKED: {
    label: 'Mở khoá tài khoản',
    icon: CheckCircle2,
    variant: 'outline',
  },
  DEFAULT: {
    label: 'Thao tác nghiệp vụ',
    icon: History,
    variant: 'outline',
  },
}

const MODERATION_ACTION_LABELS: Record<
  string,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    icon: typeof ShieldAlert
  }
> = {
  REMOVE_CONTENT: {
    label: 'Gỡ nội dung vi phạm',
    variant: 'destructive',
    icon: Trash2,
  },
  WARN_OWNER: {
    label: 'Cảnh báo chủ nội dung',
    variant: 'outline',
    icon: AlertTriangle,
  },
  WARN_USER: {
    label: 'Cảnh báo tài khoản',
    variant: 'outline',
    icon: AlertTriangle,
  },
  LOCK_OWNER: {
    label: 'Khoá tài khoản vi phạm',
    variant: 'destructive',
    icon: Lock,
  },
  LOCK_USER: {
    label: 'Khoá tài khoản người dùng',
    variant: 'destructive',
    icon: Lock,
  },
  REJECT: {
    label: 'Bác bỏ / Không vi phạm',
    variant: 'secondary',
    icon: XCircle,
  },
}

function TimelineItem({ log }: { log: AuditLog }) {
  const [showRawJson, setShowRawJson] = useState(false)
  const meta = ACTION_MAP[log.action] ?? ACTION_MAP.DEFAULT
  const Icon = meta.icon

  const details = (log.details || {}) as Record<string, unknown>

  // Trích xuất ghi chú hoặc lý do
  const note =
    (typeof details.resolutionNote === 'string' && details.resolutionNote.trim()) ||
    (typeof details.reason === 'string' && details.reason.trim()) ||
    (typeof details.note === 'string' && details.note.trim()) ||
    (typeof details.message === 'string' && details.message.trim()) ||
    null

  // Trích xuất các hành động can thiệp
  const actions: string[] = Array.isArray(details.actions) ? (details.actions as string[]) : []

  // Trích xuất số lượng thông báo đã phát
  const notifications =
    typeof details.notifications === 'object' && details.notifications !== null
      ? (details.notifications as { reporters?: number; owner?: number })
      : null

  // Trích xuất danh sách báo cáo cùng đối tượng được giải quyết gộp
  const reportIds: string[] = Array.isArray(details.reportIds)
    ? (details.reportIds as string[])
    : []

  const hasRawDetails = Object.keys(details).length > 0

  return (
    <div className="relative group">
      {/* Dot indicator */}
      <span className="absolute -left-[27px] top-1 flex size-5 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-xs group-hover:border-primary transition-colors">
        <Icon className="size-3" />
      </span>

      <div className="rounded-lg border bg-card p-3.5 shadow-xs space-y-3">
        {/* Dòng tiêu đề: Hành động + mã log + Thời gian */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
          <div className="flex items-center gap-2">
            <Badge variant={meta.variant} className="text-xs font-medium gap-1">
              <Icon className="size-3" />
              {meta.label}
            </Badge>
            <span className="text-[11px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">
              {log.action}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {formatDateTime(log.occurredAt)}
          </span>
        </div>

        {/* Người thực hiện */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">Người thực hiện:</span>
          <StaffCell staff={log.actor} showRole={true} />
        </div>

        {/* Các biện pháp can thiệp đã áp dụng (nếu có) */}
        {actions.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Biện pháp can thiệp:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {actions.map((act) => {
                const actMeta = MODERATION_ACTION_LABELS[act]
                const ActIcon = actMeta?.icon ?? ShieldAlert
                return (
                  <Badge
                    key={act}
                    variant={actMeta?.variant ?? 'outline'}
                    className="gap-1 text-xs py-0.5"
                  >
                    <ActIcon className="size-3" />
                    <span>{actMeta?.label ?? act}</span>
                  </Badge>
                )
              })}
            </div>
          </div>
        )}

        {/* Ghi chú xử lý / Lý do */}
        {note && (
          <div className="rounded-md border border-border/70 bg-muted/30 p-2.5 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <MessageSquare className="size-3.5 text-primary shrink-0" />
              <span>
                {log.action === 'REPORT_RESOLVED'
                  ? 'Ghi chú xử lý:'
                  : log.action === 'REPORT_REJECTED'
                    ? 'Lý do bác bỏ:'
                    : log.action.includes('LOCK')
                      ? 'Lý do khoá tài khoản:'
                      : log.action.includes('WARN')
                        ? 'Nội dung cảnh báo:'
                        : 'Ghi chú / Lý do:'}
              </span>
            </div>
            <p className="text-muted-foreground whitespace-pre-wrap pl-5 leading-relaxed font-normal">
              {note}
            </p>
          </div>
        )}

        {/* Thông tin thông báo & phạm vi gộp */}
        {((notifications &&
          (notifications.reporters !== undefined || notifications.owner !== undefined)) ||
          reportIds.length > 1) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            {notifications && (
              <div className="inline-flex items-center gap-1.5 rounded bg-muted/50 px-2 py-1">
                <Bell className="size-3 text-muted-foreground shrink-0" />
                <span>Thông báo:</span>
                {notifications.reporters !== undefined && (
                  <span className="font-medium text-foreground">
                    {notifications.reporters} người báo cáo
                  </span>
                )}
                {notifications.owner !== undefined && (
                  <span>
                    ·{' '}
                    <span className="font-medium text-foreground">
                      {notifications.owner} chủ nội dung
                    </span>
                  </span>
                )}
              </div>
            )}

            {reportIds.length > 1 && (
              <div className="inline-flex items-center gap-1.5 rounded bg-muted/50 px-2 py-1">
                <Layers className="size-3 text-muted-foreground shrink-0" />
                <span>
                  Đã gộp xử lý <strong className="text-foreground">{reportIds.length}</strong> báo
                  cáo cùng đối tượng
                </span>
              </div>
            )}
          </div>
        )}

        {/* Chi tiết kỹ thuật: Mặc định ẩn, bấm để mở rộng JSON */}
        {hasRawDetails && (
          <div className="pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={() => setShowRawJson((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Code2 className="size-3" />
              <span>
                {showRawJson ? 'Thu gọn dữ liệu kỹ thuật' : 'Xem dữ liệu kỹ thuật (JSON)'}
              </span>
              {showRawJson ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>

            {showRawJson && (
              <pre className="mt-2 text-[11px] text-muted-foreground font-mono bg-muted/40 p-2.5 rounded border border-border/60 overflow-x-auto max-h-48 leading-relaxed">
                {JSON.stringify(details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function ReportTimeline({ history = [], className }: ReportTimelineProps) {
  // Sắp xếp mới nhất lên đầu
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Nhật ký xử lý</CardTitle>
        </div>
        <CardDescription>
          Lịch sử can thiệp, quyết định kiểm duyệt và chế tài đã được ghi nhận.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {sortedHistory.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
            Chưa có lịch sử can thiệp hoặc ghi chép kiểm duyệt nào trước đây đối với báo cáo này.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {sortedHistory.map((log) => (
              <TimelineItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
