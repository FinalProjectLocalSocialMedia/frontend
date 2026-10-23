import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Copy,
  History,
  Lock,
  MoreHorizontal,
  RefreshCw,
  Search,
  Unlock,
  UserX,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/features/admin-moderation/auth/auth-context'
import { DataTable, type DataTableColumn } from '@/features/admin-moderation/components/data-table'
import { LockDialog } from '@/features/admin-moderation/components/lock-dialog'
import { PageHeader } from '@/features/admin-moderation/components/page-header'
import { StatusBadge } from '@/features/admin-moderation/components/status-badge'
import { UnlockDialog } from '@/features/admin-moderation/components/unlock-dialog'
import { WarnDialog } from '@/features/admin-moderation/components/warn-dialog'
import { formatDateTime } from '@/features/admin-moderation/lib/formatters'
import { initialsOf } from '@/features/admin-moderation/lib/labels'
import type {
  FlaggedAccount,
  LockInfo,
  UserRef,
  UserStatus,
} from '@/features/admin-moderation/lib/types'
import { useUrlTableState } from '@/features/admin-moderation/lib/use-url-table-state'
import {
  useFlaggedAccounts,
  useLockUser,
  useUnlockUser,
  useWarnUser,
} from '../api/accounts.queries'
import { UserSanctionsDialog } from '../components/user-sanctions-dialog'

export function FlaggedAccountsPage() {
  const { user: currentStaff } = useAuth()

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
    sort: { field: 'pendingReports', direction: 'desc' },
  })

  const selectedStatus = (getParam('status') as UserStatus | 'ALL') || 'ALL'
  const searchQuery = getParam('q') || ''
  const [searchInput, setSearchInput] = useState(searchQuery)

  // Dialog states
  const [warnTarget, setWarnTarget] = useState<UserRef | null>(null)
  const [lockTarget, setLockTarget] = useState<UserRef | null>(null)
  const [unlockTarget, setUnlockTarget] = useState<(UserRef & { lock?: LockInfo }) | null>(null)
  const [historyTarget, setHistoryTarget] = useState<UserRef | null>(null)

  // API mutations
  const warnMutation = useWarnUser()
  const lockMutation = useLockUser()
  const unlockMutation = useUnlockUser()

  // Query parameters
  const queryParams = useMemo(
    () => ({
      status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      q: searchQuery || undefined,
      sort: sort ? `${sort.field}:${sort.direction}` : undefined,
      page,
      pageSize,
    }),
    [selectedStatus, searchQuery, sort, page, pageSize]
  )

  const {
    data: flaggedData,
    isLoading,
    isFetching,
    refetch,
  } = useFlaggedAccounts(queryParams)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setParam('q', searchInput.trim() || undefined)
  }

  const handleStatusChange = (status: string) => {
    setParam('status', status === 'ALL' ? undefined : status)
  }

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(id)
    toast.success('Đã sao chép ID vào bộ nhớ tạm')
  }

  // Hành động cảnh báo
  const handleWarnConfirm = async (message: string) => {
    if (!warnTarget) return
    try {
      await warnMutation.mutateAsync({
        userId: warnTarget.id,
        input: { message },
      })
      toast.success(`Đã gửi cảnh báo tới ${warnTarget.displayName}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi cảnh báo'
      toast.error(msg)
    }
  }

  // Hành động khoá
  const handleLockConfirm = async (reason: string) => {
    if (!lockTarget) return
    try {
      await lockMutation.mutateAsync({
        userId: lockTarget.id,
        input: { reason },
      })
      toast.success(`Đã khoá tài khoản của ${lockTarget.displayName}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể khoá tài khoản'
      toast.error(msg)
    }
  }

  // Hành động mở khoá
  const handleUnlockConfirm = async (note?: string) => {
    if (!unlockTarget) return
    try {
      await unlockMutation.mutateAsync({
        userId: unlockTarget.id,
        input: { note },
      })
      toast.success(`Đã mở khoá tài khoản của ${unlockTarget.displayName}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể mở khoá tài khoản'
      toast.error(msg)
    }
  }

  const columns: DataTableColumn<FlaggedAccount>[] = [
    {
      id: 'user',
      header: 'Tài khoản người dùng',
      className: 'min-w-[220px]',
      cell: (item) => (
        <div className="flex items-center gap-3">
          <Avatar size="default">
            {item.user.avatarUrl && (
              <AvatarImage src={item.user.avatarUrl} alt={item.user.displayName} />
            )}
            <AvatarFallback>{initialsOf(item.user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex flex-col">
            <span className="font-semibold text-xs text-foreground truncate">
              {item.user.displayName}
            </span>
            {item.user.email && (
              <span className="text-[11px] text-muted-foreground truncate">
                {item.user.email}
              </span>
            )}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 font-mono">
              <span>{item.user.id.slice(0, 8)}...</span>
              <button
                type="button"
                onClick={(e) => handleCopyId(e, item.user.id)}
                className="hover:text-foreground"
                title="Sao chép ID"
              >
                <Copy className="size-2.5" />
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      className: 'w-[130px]',
      cell: (item) => {
        const isSelf = currentStaff?.id === item.user.id
        const isTargetAdmin = item.user.role === 'ADMIN'
        const canToggle = !isSelf && !isTargetAdmin

        return (
          <button
            type="button"
            disabled={!canToggle}
            onClick={() => {
              if (item.user.status === 'LOCKED') {
                setUnlockTarget({ ...item.user, lock: item.lock })
              } else {
                setLockTarget(item.user)
              }
            }}
            className={cn(
              'inline-flex text-left transition-transform',
              canToggle && 'cursor-pointer hover:scale-105 active:scale-95'
            )}
            title={
              !canToggle
                ? undefined
                : item.user.status === 'LOCKED'
                  ? 'Nhấn để mở khoá tài khoản'
                  : 'Nhấn để khoá tài khoản'
            }
          >
            <StatusBadge type="user-status" value={item.user.status} />
          </button>
        )
      },
    },
    {
      id: 'pendingReports',
      header: 'Chờ duyệt',
      sortable: true,
      align: 'center',
      className: 'w-[100px]',
      cell: (item) =>
        item.pendingReports > 0 ? (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold text-xs">
            {item.pendingReports}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">0</span>
        ),
    },
    {
      id: 'totalReports',
      header: 'Tổng báo cáo',
      sortable: true,
      align: 'center',
      className: 'w-[110px]',
      cell: (item) => (
        <span className="text-xs font-medium text-foreground">
          {item.totalReports}
        </span>
      ),
    },
    {
      id: 'warnings',
      header: 'Cảnh báo',
      sortable: true,
      align: 'center',
      className: 'w-[100px]',
      cell: (item) =>
        item.warnings > 0 ? (
          <Badge variant="outline" className="text-amber-600 dark:text-amber-500 border-amber-500/40 text-xs gap-1">
            <AlertTriangle className="size-3" />
            {item.warnings}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">0</span>
        ),
    },
    {
      id: 'lockDetail',
      header: 'Thông tin khoá',
      className: 'min-w-[180px]',
      cell: (item) => {
        if (!item.lock) {
          return <span className="text-xs text-muted-foreground italic">—</span>
        }
        return (
          <div className="space-y-0.5 text-xs text-destructive max-w-[200px]">
            <p className="line-clamp-1 font-medium" title={item.lock.reason}>
              {item.lock.reason}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatDateTime(item.lock.lockedAt)}
            </p>
          </div>
        )
      },
    },
    {
      id: 'lastActivityAt',
      header: 'Cập nhật',
      sortable: true,
      className: 'w-[140px]',
      cell: (item) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(item.lastActivityAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      className: 'w-[100px]',
      cell: (item) => {
        const isSelf = currentStaff?.id === item.user.id
        const isTargetAdmin = item.user.role === 'ADMIN'

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" className="size-8 p-0">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Mở menu thao tác</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48 text-xs">
              <DropdownMenuItem
                onClick={() => setHistoryTarget(item.user)}
                className="gap-2 cursor-pointer"
              >
                <History className="size-3.5" />
                Lịch sử xử phạt
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setWarnTarget(item.user)}
                disabled={isSelf || isTargetAdmin}
                className="gap-2 cursor-pointer text-amber-600 dark:text-amber-500 focus:text-amber-600"
              >
                <AlertTriangle className="size-3.5" />
                Gửi cảnh báo
              </DropdownMenuItem>

              {item.user.status === 'LOCKED' ? (
                <DropdownMenuItem
                  onClick={() =>
                    setUnlockTarget({ ...item.user, lock: item.lock })
                  }
                  disabled={isSelf || isTargetAdmin}
                  className="gap-2 cursor-pointer text-primary focus:text-primary"
                >
                  <Unlock className="size-3.5" />
                  Mở khoá tài khoản
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setLockTarget(item.user)}
                  disabled={isSelf || isTargetAdmin}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <Lock className="size-3.5" />
                  Khoá tài khoản
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tài khoản vi phạm"
        description="Theo dõi danh sách người dùng bị tố cáo, quản lý hồ sơ xử phạt và thực hiện chế tài trực tiếp."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        }
      />

      {/* Tabs lọc trạng thái */}
      <Tabs
        value={selectedStatus}
        onValueChange={(val) => {
          if (val) handleStatusChange(String(val))
        }}
      >
        <TabsList className="bg-muted/60">
          <TabsTrigger value="ALL" className="cursor-pointer">Tất cả tài khoản</TabsTrigger>
          <TabsTrigger value="ACTIVE" className="cursor-pointer">Đang hoạt động</TabsTrigger>
          <TabsTrigger value="LOCKED" className="gap-1.5 cursor-pointer">
            <UserX className="size-3.5" />
            Đang bị khoá
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Thanh công cụ tìm kiếm và sắp xếp */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên, email hoặc ID tài khoản..."
              className="pl-9 text-xs"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="text-xs">
            Tìm kiếm
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Sắp xếp:</span>
          <Select
            value={sort ? `${sort.field}:${sort.direction}` : 'pendingReports:desc'}
            onValueChange={(val) => {
              if (!val) return
              const [field, direction] = val.split(':') as [string, 'asc' | 'desc']
              setSort({ field, direction })
            }}
          >
            <SelectTrigger className="w-[210px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendingReports:desc">Nhiều báo cáo chờ duyệt nhất</SelectItem>
              <SelectItem value="warnings:desc">Nhiều cảnh báo nhất</SelectItem>
              <SelectItem value="totalReports:desc">Tổng số báo cáo nhiều nhất</SelectItem>
              <SelectItem value="lastActivityAt:desc">Hoạt động gần đây nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bảng danh sách tài khoản vi phạm */}
      <DataTable<FlaggedAccount>
        columns={columns}
        data={flaggedData?.items ?? []}
        rowKey={(item) => item.user.id}
        loading={isLoading}
        onRetry={refetch}
        page={page}
        pageSize={pageSize}
        total={flaggedData?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sort={sort}
        onSortChange={setSort}
        emptyTitle="Không có tài khoản vi phạm nào"
        emptyDescription="Không tìm thấy người dùng nào có báo cáo đang chờ xử lý hoặc có tiền sử bị cảnh báo, khoá trong hệ thống."
      />

      {/* Dialogs thao tác nhanh */}
      <WarnDialog
        open={!!warnTarget}
        onOpenChange={(open) => !open && setWarnTarget(null)}
        user={warnTarget}
        onSubmit={handleWarnConfirm}
      />

      <LockDialog
        open={!!lockTarget}
        onOpenChange={(open) => !open && setLockTarget(null)}
        user={lockTarget}
        onSubmit={handleLockConfirm}
      />

      <UnlockDialog
        open={!!unlockTarget}
        onOpenChange={(open) => !open && setUnlockTarget(null)}
        user={unlockTarget}
        onSubmit={handleUnlockConfirm}
      />

      <UserSanctionsDialog
        open={!!historyTarget}
        onOpenChange={(open) => !open && setHistoryTarget(null)}
        user={historyTarget}
      />
    </div>
  )
}
