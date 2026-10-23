import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Copy,
  Edit2,
  Eye,
  FileText,
  History,
  Lock,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Unlock,
  User,
  UserX,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Can } from '@/features/admin-moderation/auth/guards'
import { DataTable, type DataTableColumn } from '@/features/admin-moderation/components/data-table'
import { LockDialog } from '@/features/admin-moderation/components/lock-dialog'
import { PageHeader } from '@/features/admin-moderation/components/page-header'
import { StatusBadge } from '@/features/admin-moderation/components/status-badge'
import { UnlockDialog } from '@/features/admin-moderation/components/unlock-dialog'
import { WarnDialog } from '@/features/admin-moderation/components/warn-dialog'
import { formatDateTime } from '@/features/admin-moderation/lib/formatters'
import { initialsOf, ROLE_LABELS } from '@/features/admin-moderation/lib/labels'
import type {
  AdminUserListItem,
  LockInfo,
  UserRef,
  UserStatus,
} from '@/features/admin-moderation/lib/types'
import { useUrlTableState } from '@/features/admin-moderation/lib/use-url-table-state'
import {
  useLockUser,
  useUnlockUser,
  useWarnUser,
} from '@/features/moderation/api/accounts.queries'
import { UserSanctionsDialog } from '@/features/moderation/components/user-sanctions-dialog'
import { cn } from '@/lib/utils'
import { useAdminUsers } from '../api/users.queries'
import { DeleteUserDialog } from '../components/delete-user-dialog'
import { UserFormDialog } from '../components/user-form-dialog'

export function UsersPage() {
  const navigate = useNavigate()
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
    sort: { field: 'createdAt', direction: 'desc' },
  })

  // URL State parameters
  const selectedRole = (getParam('role') as string) || 'ALL'
  const selectedStatus = (getParam('status') as UserStatus | 'ALL') || 'ALL'
  const includeDeleted = getParam('deleted') === 'true'
  const searchQuery = getParam('q') || ''
  const [searchInput, setSearchInput] = useState(searchQuery)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUserListItem | null>(null)
  const [warnTarget, setWarnTarget] = useState<UserRef | null>(null)
  const [lockTarget, setLockTarget] = useState<UserRef | null>(null)
  const [unlockTarget, setUnlockTarget] = useState<(UserRef & { lock?: LockInfo }) | null>(null)
  const [historyTarget, setHistoryTarget] = useState<UserRef | null>(null)

  // Mutations
  const warnMutation = useWarnUser()
  const lockMutation = useLockUser()
  const unlockMutation = useUnlockUser()

  // API query
  const queryParams = useMemo(
    () => ({
      q: searchQuery || undefined,
      role: selectedRole === 'ALL' ? undefined : selectedRole,
      status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      includeDeleted: includeDeleted || undefined,
      sort: sort ? `${sort.field}:${sort.direction}` : undefined,
      page,
      pageSize,
    }),
    [searchQuery, selectedRole, selectedStatus, includeDeleted, sort, page, pageSize]
  )

  const {
    data: pagedData,
    isLoading,
    isFetching,
    refetch,
  } = useAdminUsers(queryParams)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setParam('q', searchInput.trim() || undefined)
  }

  const handleRoleChange = (role: string) => {
    setParam('role', role === 'ALL' ? undefined : role)
  }

  const handleStatusChange = (status: string | null) => {
    setParam('status', !status || status === 'ALL' ? undefined : status)
  }

  const handleToggleDeleted = (checked: boolean) => {
    setParam('deleted', checked ? 'true' : undefined)
  }

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(id)
    toast.success('Đã sao chép ID vào bộ nhớ tạm')
  }

  // Sanction handlers
  const handleWarnConfirm = async (message: string) => {
    if (!warnTarget) return
    try {
      await warnMutation.mutateAsync({
        userId: warnTarget.id,
        input: { message },
      })
      toast.success(`Đã gửi cảnh báo tới ${warnTarget.displayName}`)
      refetch()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi cảnh báo'
      toast.error(msg)
    }
  }

  const handleLockConfirm = async (reason: string) => {
    if (!lockTarget) return
    try {
      await lockMutation.mutateAsync({
        userId: lockTarget.id,
        input: { reason },
      })
      toast.success(`Đã khoá tài khoản của ${lockTarget.displayName}`)
      refetch()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể khoá tài khoản'
      toast.error(msg)
    }
  }

  const handleUnlockConfirm = async (note?: string) => {
    if (!unlockTarget) return
    try {
      await unlockMutation.mutateAsync({
        userId: unlockTarget.id,
        input: { note },
      })
      toast.success(`Đã mở khoá tài khoản của ${unlockTarget.displayName}`)
      refetch()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể mở khoá tài khoản'
      toast.error(msg)
    }
  }

  const columns: DataTableColumn<AdminUserListItem>[] = [
    {
      id: 'user',
      header: 'Người dùng',
      className: 'min-w-[240px]',
      cell: (item) => (
        <div className="flex items-center gap-3">
          <Avatar size="default">
            {item.avatarUrl && <AvatarImage src={item.avatarUrl} alt={item.displayName} />}
            <AvatarFallback>{initialsOf(item.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex flex-col">
            <span
              onClick={() => navigate(`/admin/users/${item.id}`)}
              className="font-semibold text-xs text-foreground hover:underline cursor-pointer truncate"
            >
              {item.displayName}
            </span>
            {item.email && (
              <span className="text-[11px] text-muted-foreground truncate">
                {item.email}
              </span>
            )}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 font-mono">
              <span>{item.id.slice(0, 8)}...</span>
              <button
                type="button"
                onClick={(e) => handleCopyId(e, item.id)}
                className="hover:text-foreground cursor-pointer"
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
      id: 'role',
      header: 'Vai trò',
      className: 'w-[140px]',
      cell: (item) => {
        const role = item.role === 'USER' ? 'NORMAL_USER' : item.role
        const isStaff = role === 'ADMIN' || role === 'MODERATOR'

        return (
          <div className="flex flex-col gap-0.5">
            <Badge
              variant={role === 'ADMIN' ? 'default' : isStaff ? 'secondary' : 'outline'}
              className={cn(
                'w-fit text-[11px] font-medium gap-1',
                role === 'ADMIN' && 'bg-amber-500 hover:bg-amber-600 text-white font-semibold',
                role === 'MODERATOR' && 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30'
              )}
            >
              {role === 'ADMIN' ? (
                <Shield className="size-3" />
              ) : role === 'MODERATOR' ? (
                <Shield className="size-3 text-blue-500" />
              ) : (
                <User className="size-3 text-muted-foreground" />
              )}
              {ROLE_LABELS[role] || role}
            </Badge>

            {item.moderator?.grantedAt && (
              <span className="text-[10px] text-muted-foreground">
                Cấp: {formatDateTime(item.moderator.grantedAt).slice(0, 10)}
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: 'status',
      header: 'Trạng thái',
      className: 'w-[130px]',
      cell: (item) => {
        if (item.deletedAt) {
          return (
            <Badge variant="destructive" className="bg-destructive/15 text-destructive border-destructive/30 text-xs">
              Đã xoá mềm
            </Badge>
          )
        }

        const isSelf = currentStaff?.id === item.id
        const isTargetAdmin = item.role === 'ADMIN'
        const canToggle = !isSelf && !isTargetAdmin

        return (
          <button
            type="button"
            disabled={!canToggle}
            onClick={() => {
              const userRef: UserRef = {
                id: item.id,
                displayName: item.displayName,
                avatarUrl: item.avatarUrl,
              }
              if (item.status === 'LOCKED') {
                setUnlockTarget(userRef)
              } else {
                setLockTarget(userRef)
              }
            }}
            className={cn(
              'inline-flex text-left transition-transform',
              canToggle && 'cursor-pointer hover:scale-105 active:scale-95'
            )}
            title={
              !canToggle
                ? undefined
                : item.status === 'LOCKED'
                  ? 'Nhấn để mở khoá tài khoản'
                  : 'Nhấn để khoá tài khoản'
            }
          >
            <StatusBadge type="user-status" value={item.status} />
          </button>
        )
      },
    },
    {
      id: 'phoneNumber',
      header: 'Số điện thoại',
      className: 'w-[120px]',
      cell: (item) => (
        <span className="text-xs font-mono text-muted-foreground">
          {item.phoneNumber || '—'}
        </span>
      ),
    },
    {
      id: 'stats',
      header: 'Hoạt động',
      className: 'w-[160px]',
      cell: (item) => {
        const stats = item.stats || { posts: 0, reportsAgainst: 0, warnings: 0 }
        return (
          <div className="flex items-center gap-2 text-xs">
            <span
              className="inline-flex items-center gap-1 text-muted-foreground"
              title="Số bài viết đã tạo"
            >
              <FileText className="size-3" />
              {stats.posts}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium',
                stats.reportsAgainst > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
              )}
              title="Số lượt bị tố cáo"
            >
              <UserX className="size-3" />
              {stats.reportsAgainst}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium',
                stats.warnings > 0 ? 'text-destructive' : 'text-muted-foreground'
              )}
              title="Số lần bị cảnh báo"
            >
              <AlertTriangle className="size-3" />
              {stats.warnings}
            </span>
          </div>
        )
      },
    },
    {
      id: 'createdAt',
      header: 'Ngày tham gia',
      sortable: true,
      className: 'w-[130px]',
      cell: (item) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(item.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      className: 'w-[80px]',
      cell: (item) => {
        const isSelf = currentStaff?.id === item.id
        const isTargetAdmin = item.role === 'ADMIN'
        const isDeleted = Boolean(item.deletedAt)

        const userRef: UserRef = {
          id: item.id,
          displayName: item.displayName,
          avatarUrl: item.avatarUrl,
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" className="size-8 p-0">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Menu thao tác</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48 text-xs">
              <DropdownMenuItem
                onClick={() => navigate(`/admin/users/${item.id}`)}
                className="gap-2 cursor-pointer"
              >
                <Eye className="size-3.5" />
                Xem hồ sơ chi tiết
              </DropdownMenuItem>

              <Can permission="users.update">
                <DropdownMenuItem
                  onClick={() => setEditingUser(item)}
                  disabled={isDeleted}
                  className="gap-2 cursor-pointer"
                >
                  <Edit2 className="size-3.5" />
                  Chỉnh sửa tài khoản
                </DropdownMenuItem>
              </Can>

              <DropdownMenuItem
                onClick={() => setHistoryTarget(userRef)}
                className="gap-2 cursor-pointer"
              >
                <History className="size-3.5" />
                Lịch sử xử phạt
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setWarnTarget(userRef)}
                disabled={isSelf || isTargetAdmin || isDeleted}
                className="gap-2 cursor-pointer text-amber-600 dark:text-amber-500 focus:text-amber-600"
              >
                <AlertTriangle className="size-3.5" />
                Gửi cảnh báo
              </DropdownMenuItem>

              {item.status === 'LOCKED' ? (
                <DropdownMenuItem
                  onClick={() => setUnlockTarget(userRef)}
                  disabled={isSelf || isTargetAdmin || isDeleted}
                  className="gap-2 cursor-pointer text-primary focus:text-primary"
                >
                  <Unlock className="size-3.5" />
                  Mở khoá tài khoản
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setLockTarget(userRef)}
                  disabled={isSelf || isTargetAdmin || isDeleted}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <Lock className="size-3.5" />
                  Khoá tài khoản
                </DropdownMenuItem>
              )}

              <Can permission="users.delete">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeletingUser(item)}
                  disabled={isSelf || isDeleted}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive font-medium"
                >
                  <Trash2 className="size-3.5" />
                  Xoá tài khoản
                </DropdownMenuItem>
              </Can>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý người dùng"
        description="Tra cứu, cập nhật thông tin và quản trị danh sách người dùng, kiểm duyệt viên và quản trị viên."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2 text-xs"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Can permission="users.create">
              <Button
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="gap-1.5 text-xs font-medium"
              >
                <Plus className="size-3.5" />
                Thêm tài khoản
              </Button>
            </Can>
          </div>
        }
      />

      {/* Tabs lọc vai trò */}
      <Tabs
        value={selectedRole}
        onValueChange={(val) => {
          if (val) handleRoleChange(String(val))
        }}
      >
        <TabsList className="bg-muted/60">
          <TabsTrigger value="ALL" className="cursor-pointer">
            Tất cả vai trò
          </TabsTrigger>
          <TabsTrigger value="USER" className="gap-1.5 cursor-pointer">
            <User className="size-3.5" />
            Người dùng
          </TabsTrigger>
          <TabsTrigger value="MODERATOR" className="gap-1.5 cursor-pointer">
            <Shield className="size-3.5" />
            Kiểm duyệt viên
          </TabsTrigger>
          <TabsTrigger value="ADMIN" className="gap-1.5 cursor-pointer">
            <Shield className="size-3.5 text-amber-500" />
            Quản trị viên
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Thanh công cụ tìm kiếm, lọc và sắp xếp */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên, email, SĐT hoặc ID..."
              className="pl-9 text-xs"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="text-xs">
            Tìm kiếm
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Lọc trạng thái */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Trạng thái:</span>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[140px] text-xs h-8">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                <SelectItem value="LOCKED">Đang bị khoá</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Sắp xếp:</span>
            <Select
              value={sort ? `${sort.field}:${sort.direction}` : 'createdAt:desc'}
              onValueChange={(val) => {
                if (!val) return
                const [field, direction] = val.split(':') as [string, 'asc' | 'desc']
                setSort({ field, direction })
              }}
            >
              <SelectTrigger className="w-[150px] text-xs h-8">
                <SelectValue placeholder="Mới nhất trước" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="createdAt:desc">Mới tham gia nhất</SelectItem>
                <SelectItem value="createdAt:asc">Cũ nhất trước</SelectItem>
                <SelectItem value="displayName:asc">Tên (A-Z)</SelectItem>
                <SelectItem value="displayName:desc">Tên (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Checkbox Bao gồm đã xoá */}
          <div className="flex items-center gap-1.5 pl-1">
            <Checkbox
              id="include-deleted"
              checked={includeDeleted}
              onCheckedChange={handleToggleDeleted}
            />
            <label
              htmlFor="include-deleted"
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              Bao gồm đã xoá
            </label>
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu người dùng */}
      <DataTable
        columns={columns}
        data={pagedData?.items ?? []}
        rowKey={(item) => item.id}
        loading={isLoading}
        page={page}
        pageSize={pageSize}
        total={pagedData?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sort={sort}
        onSortChange={setSort}
        emptyTitle="Không tìm thấy người dùng"
        emptyDescription="Không có tài khoản nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc hiện tại."
      />

      {/* Modal tạo mới / Chỉnh sửa */}
      <UserFormDialog
        open={createDialogOpen || Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false)
            setEditingUser(null)
          }
        }}
        user={editingUser}
        onSuccess={() => refetch()}
      />

      {/* Modal xác nhận xoá */}
      <DeleteUserDialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => {
          if (!open) setDeletingUser(null)
        }}
        user={deletingUser}
        onSuccess={() => refetch()}
      />

      {/* Dialog Cảnh báo */}
      <WarnDialog
        open={Boolean(warnTarget)}
        onOpenChange={(open) => {
          if (!open) setWarnTarget(null)
        }}
        user={warnTarget}
        onSubmit={handleWarnConfirm}
      />

      {/* Dialog Khoá tài khoản */}
      <LockDialog
        open={Boolean(lockTarget)}
        onOpenChange={(open) => {
          if (!open) setLockTarget(null)
        }}
        user={lockTarget}
        onSubmit={handleLockConfirm}
      />

      {/* Dialog Mở khoá tài khoản */}
      <UnlockDialog
        open={Boolean(unlockTarget)}
        onOpenChange={(open) => {
          if (!open) setUnlockTarget(null)
        }}
        user={unlockTarget}
        onSubmit={handleUnlockConfirm}
      />

      {/* Dialog Lịch sử xử phạt */}
      <UserSanctionsDialog
        open={Boolean(historyTarget)}
        onOpenChange={(open) => {
          if (!open) setHistoryTarget(null)
        }}
        user={historyTarget}
      />
    </div>
  )
}
