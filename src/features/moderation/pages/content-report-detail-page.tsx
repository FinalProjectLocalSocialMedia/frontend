import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Flame,
  MessageSquareWarning,
  RefreshCw,
  Shield,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { ErrorState } from '@/features/admin-moderation/components/error-state'
import { PageHeader } from '@/features/admin-moderation/components/page-header'
import { StatusBadge } from '@/features/admin-moderation/components/status-badge'
import { formatDateTime } from '@/features/admin-moderation/lib/formatters'
import {
  initialsOf,
  reasonLabel,
  REPORT_TARGET_LABELS,
  SANCTION_TYPE_LABELS,
} from '@/features/admin-moderation/lib/labels'
import type { ResolveReportInput } from '@/features/admin-moderation/lib/types'
import { useReportDetail, useResolveReport } from '../api/reports.queries'
import { ActionPanel } from '../components/action-panel'
import { ContentPreview } from '../components/content-preview'
import { ReportTimeline } from '../components/report-timeline'

export function ContentReportDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [conflictError, setConflictError] = useState<string | null>(null)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)

  const { data: report, isLoading, error, refetch } = useReportDetail(id)
  const resolveMutation = useResolveReport()

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">Đang tải hồ sơ báo cáo vi phạm...</p>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Chi tiết báo cáo"
          description="Không thể tải hoặc không tìm thấy dữ liệu báo cáo."
        />
        <ErrorState
          error={error ?? new Error('Không tìm thấy thông tin báo cáo')}
          onRetry={refetch}
        />
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/reports')}>
            <ArrowLeft className="size-4 mr-1.5" />
            Quay lại danh sách báo cáo
          </Button>
        </div>
      </div>
    )
  }

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleResolve = async (payload: ResolveReportInput) => {
    if (!id) return
    setConflictError(null)
    setActionSuccessMessage(null)

    try {
      await resolveMutation.mutateAsync({
        id,
        input: payload,
      })

      setActionSuccessMessage('Quyết định kiểm duyệt đã được thực thi và lưu trữ thành công.')
      refetch()
    } catch (err: unknown) {
      const anyErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string }
      if (anyErr?.response?.status === 409) {
        setConflictError(
          'Báo cáo này vừa được một kiểm duyệt viên khác xử lý trước đó. Dữ liệu đã được cập nhật sang chế độ chỉ đọc.'
        )
        refetch()
      } else {
        setConflictError(
          anyErr?.response?.data?.message || anyErr?.message || 'Có lỗi xảy ra trong quá trình xử lý báo cáo.'
        )
      }
    }
  }

  const isPending = report.status === 'PENDING'
  const isConflict = Boolean(conflictError && conflictError.includes('kiểm duyệt viên khác'))

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`Báo cáo #${report.id.slice(0, 8)}`}
        description={`Tiếp nhận lúc ${formatDateTime(report.reportedAt)} • Phân loại: ${REPORT_TARGET_LABELS[report.targetType] ?? report.targetType}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => navigate('/admin/reports')}
            >
              <ArrowLeft className="size-3.5" />
              Danh sách
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => refetch()}
            >
              <RefreshCw className="size-3.5" />
              Làm mới
            </Button>
          </div>
        }
      />

      {/* Thông báo thành công nếu vừa xử lý */}
      {actionSuccessMessage && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="text-sm font-semibold">Xử lý thành công</AlertTitle>
          <AlertDescription className="text-xs">{actionSuccessMessage}</AlertDescription>
        </Alert>
      )}

      {/* Cảnh báo xung đột 409 hoặc lỗi */}
      {conflictError && (
        <Alert
          variant={isConflict ? 'default' : 'destructive'}
          className={
            isConflict
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200'
              : undefined
          }
        >
          <AlertCircle className="size-4" />
          <AlertTitle className="text-sm font-semibold">
            {isConflict ? 'Xung đột kiểm duyệt (409 Conflict)' : 'Không thể thực thi quyết định'}
          </AlertTitle>
          <AlertDescription className="text-xs">{conflictError}</AlertDescription>
        </Alert>
      )}

      {/* Cảnh báo nếu có nhiều báo cáo trùng đối tượng (D7) */}
      {report.reportCount > 1 && (
        <Alert className="border-sky-500/30 bg-sky-500/10 text-sky-950 dark:text-sky-200">
          <Flame className="size-4 text-sky-600 dark:text-sky-400" />
          <AlertDescription className="text-xs">
            Đối tượng này đã nhận được <strong>{report.reportCount}</strong> lượt báo cáo vi phạm
            từ người dùng. Khi bạn xác nhận quyết định xử lý, hệ thống sẽ tự động gộp và đồng bộ kết
            quả đến tất cả {report.reportCount} báo cáo tương ứng.
          </AlertDescription>
        </Alert>
      )}

      {/* Grid 2 cột: Cột chính (Nội dung & Lịch sử) - Cột phụ (Quyết định xử lý & Lịch sử chế tài) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT CHÍNH */}
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          {/* Card Thông tin người báo cáo và lý do */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Mã: {report.id}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => handleCopyId(report.id)}
                    className="p-1 hover:bg-muted rounded text-muted-foreground"
                    title="Sao chép ID"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
                <StatusBadge type="report-status" value={report.status} />
              </div>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-3">
                {/* Người gửi báo cáo */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Người gửi báo cáo
                  </span>
                  <div className="flex items-center gap-2.5">
                    <Avatar size="sm">
                      <AvatarFallback className="text-xs">
                        {initialsOf(report.reporter.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-xs truncate text-foreground">
                        {report.reporter.displayName}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">
                        ID: {report.reporter.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lý do báo cáo */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Lý do báo cáo
                  </span>
                  <div>
                    <Badge variant="destructive" className="text-xs">
                      {reasonLabel(report.reason)}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Gửi lúc {formatDateTime(report.reportedAt)}
                  </span>
                </div>
              </div>

              {/* Thông tin thêm nếu có */}
              {report.targetSummary?.text && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Tóm tắt nội dung báo cáo
                  </span>
                  <div className="rounded-lg border bg-background p-3 text-xs leading-relaxed text-foreground">
                    "{report.targetSummary.text}"
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Xem trước nội dung bị khiếu nại */}
          <ContentPreview target={report.target} />

          {/* Lịch sử xử lý / Nhật ký */}
          <ReportTimeline history={report.history} />
        </div>

        {/* CỘT PHỤ */}
        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          {/* Panel Hành động kiểm duyệt */}
          <ActionPanel
            report={report}
            onSubmit={handleResolve}
            isSubmitting={resolveMutation.isPending}
            readOnly={!isPending || isConflict}
          />

          {/* Lịch sử chế tài trước đây của chủ thể vi phạm */}
          {report.sanctions && report.sanctions.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquareWarning className="size-4 text-amber-500" />
                  <CardTitle className="text-sm font-semibold">Lịch sử vi phạm trước đây</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Các biện pháp chế tài đã từng áp dụng cho tài khoản này.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {report.sanctions.map((sanction) => (
                  <div
                    key={sanction.id}
                    className="rounded-lg border bg-muted/20 p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <Badge
                        variant={sanction.type === 'LOCK' ? 'destructive' : 'secondary'}
                        className="text-[10px]"
                      >
                        {SANCTION_TYPE_LABELS[sanction.type] ?? sanction.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDateTime(sanction.issuedAt)}
                      </span>
                    </div>
                    {sanction.reason && (
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {sanction.reason}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quy chuẩn cộng đồng tóm tắt */}
          <Card className="bg-muted/30 border-dashed">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Shield className="size-3.5 text-primary" />
                Hướng dẫn kiểm duyệt
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
              <p>
                • <strong>Nguyên tắc khách quan:</strong> Đánh giá nội dung dựa trên bằng chứng ngữ cảnh thực tế, tôn trọng sự đa dạng quan điểm nhưng kiên quyết ngăn chặn nội dung độc hại.
              </p>
              <p>
                • <strong>Cảnh báo trước khi khoá:</strong> Ưu tiên cảnh báo vi phạm lần đầu trừ trường hợp nghiêm trọng liên quan đến bạo lực, khiêu dâm trẻ em hoặc lừa đảo.
              </p>
              <p>
                • <strong>Quy định gộp:</strong> Xử lý một báo cáo sẽ tự động kết luận các báo cáo tương tự cùng đối tượng để tránh trùng lặp công việc.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
