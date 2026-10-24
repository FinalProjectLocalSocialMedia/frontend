import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Copy,
  FileText,
  Flame,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldAlert,
  User,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable, type DataTableColumn } from '@/features/admin-moderation/components/data-table'
import { PageHeader } from '@/features/admin-moderation/components/page-header'
import { StatusBadge } from '@/features/admin-moderation/components/status-badge'
import { REPORT_REASONS } from '@/features/admin-moderation/lib/constants'
import { formatDateTime } from '@/features/admin-moderation/lib/formatters'
import { reasonLabel } from '@/features/admin-moderation/lib/labels'
import type { ReportListItem, ReportStatus } from '@/features/admin-moderation/lib/types'
import { useUrlTableState } from '@/features/admin-moderation/lib/use-url-table-state'
import { useReports, useReportsSummary } from '../api/reports.queries'

export function ReportsPage() {
  const navigate = useNavigate()

  const {
    page,
    pageSize,
    sort,
    getParam,
    setPage,
    setPageSize,
    setSort,
    setParam,
  } = useUrlTableState({
    sort: { field: 'createdAt', direction: 'asc' },
  })

  // Target tab: 'content' | 'user'
  const activeTab = (getParam('target') as 'content' | 'user') || 'content'
  const selectedStatus = (getParam('status') as ReportStatus | 'ALL') || 'PENDING'
  const selectedReason = getParam('reason') || 'ALL'
  const searchQuery = getParam('q') || ''

  const [searchInput, setSearchInput] = useState(searchQuery)

  // Fetch summary đếm số lượng PENDING
  const { data: summary, refetch: refetchSummary } = useReportsSummary()

  // Fetch danh sách báo cáo
  const queryParams = useMemo(() => {
    return {
      page,
      pageSize,
      type: activeTab,
      status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      reason: selectedReason === 'ALL' ? undefined : selectedReason,
      q: searchQuery.trim() || undefined,
      sort: sort ? `${sort.field}:${sort.direction}` : 'createdAt:asc',
    }
  }, [page, pageSize, activeTab, selectedStatus, selectedReason, searchQuery, sort])

  const { data, isLoading, error, refetch } = useReports(queryParams)

  const handleTabChange = (value: string) => {
    setParam('target', value === 'content' ? undefined : value)
  }

  const handleStatusChange = (value: string | null) => {
    const val = value ?? 'PENDING'
    setParam('status', val === 'PENDING' ? undefined : val)
  }

  const handleReasonChange = (value: string | null) => {
    const val = value ?? 'ALL'
    setParam('reason', val === 'ALL' ? undefined : val)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setParam('q', searchInput.trim() || undefined)
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setParam('q', undefined)
    setParam('status', undefined)
    setParam('reason', undefined)
  }

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(id)
  }

  // Định nghĩa các cột cho bảng
  const columns: DataTableColumn<ReportListItem>[] = [
    {
      id: 'id',
      header: 'Mã BC',
      className: 'w-[110px]',
      cell: (item) => (
        <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
          <span title={item.id}>#{item.id.slice(0, 8)}</span>
          <button
            type="button"
            onClick={(e) => handleCopyId(e, item.id)}
            className="p-0.5 hover:text-foreground text-muted-foreground/60 rounded"
            title="Sao chép ID"
          >
            <Copy className="size-3" />
          </button>
        </div>
      ),
    },
    {
      id: 'targetType',
      header: 'Loại',
      className: 'w-[110px]',
      cell: (item) => {
        if (item.targetType === 'USER') {
          return (
            <Badge variant="outline" className="gap-1 text-xs">
              <User className="size-3" />
              Tài khoản
            </Badge>
          )
        }
        if (item.targetType === 'POST') {
          return (
            <Badge variant="secondary" className="gap-1 text-xs">
              <FileText className="size-3" />
              Bài viết
            </Badge>
          )
        }
        return (
          <Badge variant="secondary" className="gap-1 text-xs">
            <MessageSquare className="size-3" />
            Bình luận
          </Badge>
        )
      },
    },
    {
      id: 'reason',
      header: 'Lý do vi phạm',
      className: 'w-[180px]',
      cell: (item) => (
        <div className="space-y-0.5">
          <span className="text-xs font-medium text-foreground">
            {reasonLabel(item.reason)}
          </span>
          {item.targetSummary?.text && (
            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]" title={item.targetSummary.text}>
              {item.targetSummary.text}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'reportCount',
      header: 'Số báo cáo',
      sortable: true,
      align: 'center',
      className: 'w-[110px]',
      cell: (item) => {
        if (item.reportCount > 1) {
          return (
            <Badge variant="destructive" className="gap-1 text-xs font-mono font-semibold" title="Nhiều báo cáo trùng lặp">
              <Flame className="size-3" />
              {item.reportCount}
            </Badge>
          )
        }
        return <span className="text-xs font-mono text-muted-foreground">1</span>
      },
    },
    {
      id: 'reporter',
      header: 'Người báo cáo',
      className: 'w-[160px]',
      cell: (item) => (
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium truncate text-foreground">
            {item.reporter.displayName}
          </span>
          <span className="text-[11px] text-muted-foreground font-mono truncate">
            {item.reporter.id.slice(0, 8)}
          </span>
        </div>
      ),
    },
    {
      id: 'reportedAt',
      header: 'Thời gian gửi',
      sortable: true,
      className: 'w-[150px]',
      cell: (item) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(item.reportedAt)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      className: 'w-[120px]',
      cell: (item) => <StatusBadge type="report-status" value={item.status} />,
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      className: 'w-[110px]',
      cell: (item) => (
        <Button
          size="sm"
          variant={item.status === 'PENDING' ? 'default' : 'outline'}
          className="h-8 gap-1 text-xs"
          onClick={() => navigate(`/admin/reports/${item.id}`)}
        >
          {item.status === 'PENDING' ? 'Xử lý' : 'Chi tiết'}
          <ArrowRight className="size-3" />
        </Button>
      ),
    },
  ]

  const hasFilterActive =
    Boolean(searchQuery) || selectedStatus !== 'PENDING' || selectedReason !== 'ALL'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý báo cáo vi phạm"
        description="Tiếp nhận, thẩm tra và xử lý các báo cáo vi phạm tiêu chuẩn cộng đồng từ người dùng."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              refetch()
              refetchSummary()
            }}
          >
            <RefreshCw className="size-3.5" />
            Làm mới
          </Button>
        }
      />

      {/* Tabs Phân nhóm: Báo cáo Nội dung vs Báo cáo Người dùng */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between border-b pb-2">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="content" className="gap-2 text-xs">
              <FileText className="size-3.5" />
              Nội dung vi phạm
              {summary && summary.content.pending > 0 && (
                <Badge
                  variant="destructive"
                  className="size-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold"
                >
                  {summary.content.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="user" className="gap-2 text-xs">
              <Users className="size-3.5" />
              Tài khoản vi phạm
              {summary && summary.user.pending > 0 && (
                <Badge
                  variant="destructive"
                  className="size-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold"
                >
                  {summary.user.pending}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
            <ShieldAlert className="size-3.5 text-amber-500" />
            <span>
              Tổng chờ xử lý:{' '}
              <strong className="text-foreground">
                {summary?.pendingTotal ?? 0}
              </strong>
            </span>
          </div>
        </div>
      </Tabs>

      {/* Bộ lọc thanh công cụ */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã báo cáo, ID đối tượng, người báo cáo..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="h-9 text-xs">
            Tìm
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc Trạng thái */}
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING" className="text-xs">
                Chờ xử lý
              </SelectItem>
              <SelectItem value="RESOLVED" className="text-xs">
                Đã xử lý
              </SelectItem>
              <SelectItem value="REJECTED" className="text-xs">
                Đã bác bỏ
              </SelectItem>
              <SelectItem value="ALL" className="text-xs">
                Tất cả trạng thái
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Lọc Lý do */}
          <Select value={selectedReason} onValueChange={handleReasonChange}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Lý do vi phạm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                Tất cả lý do
              </SelectItem>
              {Object.entries(REPORT_REASONS).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sắp xếp */}
          <Select
            value={sort ? `${sort.field}:${sort.direction}` : 'createdAt:asc'}
            onValueChange={(val) => {
              if (!val) return
              const [field, direction] = val.split(':') as [string, 'asc' | 'desc']
              setSort({ field, direction })
            }}
          >
            <SelectTrigger className="w-[170px] h-9 text-xs">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:asc" className="text-xs">
                Ưu tiên cũ nhất trước
              </SelectItem>
              <SelectItem value="createdAt:desc" className="text-xs">
                Mới nhất trước
              </SelectItem>
              <SelectItem value="reportCount:desc" className="text-xs">
                Bị báo cáo nhiều nhất
              </SelectItem>
            </SelectContent>
          </Select>

          {hasFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 text-xs text-muted-foreground"
            >
              Đặt lại
            </Button>
          )}
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        rowKey={(item) => item.id}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        page={page}
        pageSize={pageSize}
        total={data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sort={sort}
        onSortChange={setSort}
        emptyTitle="Không có báo cáo nào"
        emptyDescription={
          hasFilterActive
            ? 'Không tìm thấy báo cáo vi phạm nào khớp với điều kiện lọc hiện tại.'
            : activeTab === 'content'
              ? 'Tuyệt vời! Hiện không còn báo cáo nội dung vi phạm nào cần giải quyết.'
              : 'Tuyệt vời! Hiện không còn báo cáo tài khoản nào cần giải quyết.'
        }
      />
    </div>
  )
}
