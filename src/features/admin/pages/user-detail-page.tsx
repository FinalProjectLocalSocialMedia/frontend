import { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  Edit2,
  FileText,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  Trash2,
  Unlock,
  User,
  UserCheck,
  UserX,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/admin-moderation/auth/auth-context'
import { Can } from '@/features/admin-moderation/auth/guards'
import { LockDialog } from '@/features/admin-moderation/components/lock-dialog'
import { StatusBadge } from '@/features/admin-moderation/components/status-badge'
import { UnlockDialog } from '@/features/admin-moderation/components/unlock-dialog'
import { WarnDialog } from '@/features/admin-moderation/components/warn-dialog'
import { formatDateTime } from '@/features/admin-moderation/lib/formatters'
import { initialsOf, ROLE_LABELS, SANCTION_TYPE_LABELS } from '@/features/admin-moderation/lib/labels'
import type { Role, UserRef } from '@/features/admin-moderation/lib/types'
import {
  useLockUser,
  useUnlockUser,
  useWarnUser,
} from '@/features/moderation/api/accounts.queries'
import { cn } from '@/lib/utils'
import { useAdminUserDetail } from '../api/users.queries'
import { DeleteUserDialog } from '../components/delete-user-dialog'
import { UserFormDialog } from '../components/user-form-dialog'

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentStaff } = useAuth()

  const { data: user, isLoading, error, refetch, isFetching } = useAdminUserDetail(id)

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [warnDialogOpen, setWarnDialogOpen] = useState(false)
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false)

  // Mutations
  const warnMutation = useWarnUser()
  const lockMutation = useLockUser()
  const unlockMutation = useUnlockUser()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex items-center gap-4 rounded-xl border p-6">
          <Skeleton className="size-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/users')}
          className="gap-2 text-xs"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách người dùng
        </Button>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive">
          <AlertTriangle className="size-10 mx-auto mb-3" />
          <h2 className="text-base font-semibold">Không tìm thấy người dùng</h2>
          <p className="mt-1 text-xs opacity-90">
            Người dùng không tồn tại hoặc bạn không có đủ quyền truy cập tài nguyên này.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-4 text-xs"
          >
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  const role: Role = user.role === 'USER' ? 'NORMAL_USER' : user.role
  const isSelf = currentStaff?.id === user.id
  const isTargetAdmin = role === 'ADMIN'
  const isDeleted = Boolean(user.deletedAt)

  const userRef: UserRef = {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Đã sao chép ${label}`)
  }

  const handleWarnConfirm = async (message: string) => {
    try {
      await warnMutation.mutateAsync({
        userId: user.id,
        input: { message },
      })
      toast.success(`Đã gửi cảnh báo tới ${user.displayName}`)
      refetch()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi cảnh báo'
      toast.error(msg)
    }
  }

  const handleLockConfirm = async (reason: string) => {
    try {
      await lockMutation.mutateAsync({
        userId: user.id,
        input: { reason },
      })
      toast.success(`Đã khoá tài khoản của ${user.displayName}`)
      refetch()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể khoá tài khoản'
      toast.error(msg)
    }
  }

  const handleUnlockConfirm = async (note?: string) => {
    try {
      await unlockMutation.mutateAsync({
        userId: user.id,
        input: { note },
      })
      toast.success(`Đã mở khoá tài khoản của ${user.displayName}`)
      refetch()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể mở khoá tài khoản'
      toast.error(msg)
    }
  }

  const genderLabel =
    user.profile?.gender === 1
      ? 'Nam'
      : user.profile?.gender === 0
        ? 'Nữ'
        : user.profile?.gender === 2
          ? 'Khác'
          : 'Chưa cập nhật'

  return (
    <div className="space-y-6">
      {/* Nút quay lại & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/users')}
          className="gap-2 text-xs"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>

          <Can permission="users.update">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              disabled={isDeleted}
              className="gap-1.5 text-xs"
            >
              <Edit2 className="size-3.5" />
              Chỉnh sửa
            </Button>
          </Can>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setWarnDialogOpen(true)}
            disabled={isSelf || isTargetAdmin || isDeleted}
            className="gap-1.5 text-xs text-amber-600 dark:text-amber-500 hover:text-amber-700"
          >
            <AlertTriangle className="size-3.5" />
            Cảnh báo
          </Button>

          {user.status === 'LOCKED' ? (
            <Button
              size="sm"
              onClick={() => setUnlockDialogOpen(true)}
              disabled={isSelf || isTargetAdmin || isDeleted}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Unlock className="size-3.5" />
              Mở khoá
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setLockDialogOpen(true)}
              disabled={isSelf || isTargetAdmin || isDeleted}
              className="gap-1.5 text-xs"
            >
              <Lock className="size-3.5" />
              Khoá tài khoản
            </Button>
          )}

          <Can permission="users.delete">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isSelf || isDeleted}
              className="gap-1.5 text-xs text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
              Xoá
            </Button>
          </Can>
        </div>
      </div>

      {/* Thông tin định danh chính */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Avatar className="size-20 rounded-xl border">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
            <AvatarFallback className="text-xl font-bold rounded-xl">
              {initialsOf(user.displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-bold text-foreground">
                {user.displayName}
              </h1>
              <Badge
                variant={role === 'ADMIN' ? 'default' : role === 'MODERATOR' ? 'secondary' : 'outline'}
                className={cn(
                  'text-xs font-semibold gap-1',
                  role === 'ADMIN' && 'bg-amber-500 hover:bg-amber-600 text-white',
                  role === 'MODERATOR' && 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30'
                )}
              >
                {role === 'ADMIN' ? (
                  <Shield className="size-3.5" />
                ) : role === 'MODERATOR' ? (
                  <Shield className="size-3.5 text-blue-500" />
                ) : (
                  <User className="size-3.5" />
                )}
                {ROLE_LABELS[role] || role}
              </Badge>

              {user.deletedAt ? (
                <Badge variant="destructive" className="text-xs">Đã xoá mềm</Badge>
              ) : (
                <StatusBadge type="user-status" value={user.status} />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {user.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  <span>{user.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(user.email!, 'Email')}
                    className="hover:text-foreground cursor-pointer"
                  >
                    <Copy className="size-3" />
                  </button>
                </div>
              )}

              {user.phoneNumber && (
                <div className="flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  <span>{user.phoneNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(user.phoneNumber!, 'Số điện thoại')}
                    className="hover:text-foreground cursor-pointer"
                  >
                    <Copy className="size-3" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="text-muted-foreground/70">ID:</span>
                <span>{user.id}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(user.id, 'User ID')}
                  className="hover:text-foreground cursor-pointer"
                >
                  <Copy className="size-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin khoá hiện thời (Nếu tài khoản đang bị khoá) */}
      {user.lock && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-destructive/15 text-destructive shrink-0">
              <Lock className="size-4" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-destructive text-sm">
                Tài khoản đang trong trạng thái bị khoá
              </p>
              <p className="text-foreground">
                <span className="font-medium">Lý do:</span> {user.lock.reason}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground pt-0.5">
                <span>Khoá vào lúc: {formatDateTime(user.lock.lockedAt)}</span>
                {user.lock.lockedBy && (
                  <span>
                    Bởi: {user.lock.lockedBy.email} ({ROLE_LABELS[user.lock.lockedBy.role] || user.lock.lockedBy.role})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chỉ số hoạt động */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Bài viết đã tạo</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              <span>{user.stats?.posts ?? 0}</span>
              <FileText className="size-5 text-muted-foreground/50" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground">
            Tổng số bài viết công khai trên nền tảng
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Báo cáo vi phạm</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              <span className={user.stats && user.stats.reportsAgainst > 0 ? 'text-amber-600 dark:text-amber-400' : ''}>
                {user.stats?.reportsAgainst ?? 0}
              </span>
              <UserX className="size-5 text-amber-500/50" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground">
            Số lượt tài khoản hoặc nội dung bị cộng đồng tố cáo
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Lệnh cảnh báo</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              <span className={user.stats && user.stats.warnings > 0 ? 'text-destructive' : ''}>
                {user.stats?.warnings ?? 0}
              </span>
              <AlertTriangle className="size-5 text-destructive/50" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground">
            Số lần đã nhận thông báo cảnh báo từ ban kiểm duyệt
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thông tin hồ sơ cá nhân */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserCheck className="size-4 text-primary" />
              Thông tin chi tiết hồ sơ
            </CardTitle>
            <CardDescription className="text-xs">
              Hồ sơ người dùng cá nhân trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2 py-1.5 border-b">
              <span className="text-muted-foreground">Giới tính:</span>
              <span className="col-span-2 font-medium">{genderLabel}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-1.5 border-b">
              <span className="text-muted-foreground">Ngày sinh:</span>
              <span className="col-span-2 font-medium">
                {user.profile?.dateOfBirth ? user.profile.dateOfBirth : 'Chưa cập nhật'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-1.5">
              <span className="text-muted-foreground">Tiểu sử (Bio):</span>
              <span className="col-span-2 text-foreground">
                {user.profile?.bio ? user.profile.bio : 'Chưa có thông tin'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Thông tin hệ thống & Kiểm duyệt */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              Thông tin hệ thống & Đặc quyền
            </CardTitle>
            <CardDescription className="text-xs">
              Mốc thời gian tài khoản và quyền hạn kiểm duyệt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2 py-1.5 border-b">
              <span className="text-muted-foreground">Ngày tạo tài khoản:</span>
              <span className="col-span-2 font-medium">
                {formatDateTime(user.createdAt)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-1.5 border-b">
              <span className="text-muted-foreground">Cập nhật lần cuối:</span>
              <span className="col-span-2">
                {formatDateTime(user.updatedAt)}
              </span>
            </div>

            {user.deletedAt && (
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b text-destructive">
                <span className="font-semibold">Thời điểm xoá:</span>
                <span className="col-span-2 font-medium">
                  {formatDateTime(user.deletedAt)}
                </span>
              </div>
            )}

            {user.moderator && (
              <>
                <div className="grid grid-cols-3 gap-2 py-1.5 border-b">
                  <span className="text-muted-foreground">Cấp quyền Mod lúc:</span>
                  <span className="col-span-2 font-medium text-blue-600 dark:text-blue-400">
                    {formatDateTime(user.moderator.grantedAt)}
                  </span>
                </div>
                {user.moderator.grantedByAdminId && (
                  <div className="grid grid-cols-3 gap-2 py-1.5">
                    <span className="text-muted-foreground">Admin cấp quyền:</span>
                    <span className="col-span-2 font-mono text-[11px] text-muted-foreground">
                      {user.moderator.grantedByAdminId}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lịch sử xử phạt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lock className="size-4 text-primary" />
            Lịch sử xử phạt & Chế tài ({user.sanctions?.length ?? 0})
          </CardTitle>
          <CardDescription className="text-xs">
            Toàn bộ các biện pháp cảnh báo hoặc khoá tài khoản đã từng áp dụng với người dùng này.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!user.sanctions || user.sanctions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              Tài khoản chưa có tiền án tiền sự hoặc quyết định xử phạt nào.
            </p>
          ) : (
            <div className="divide-y text-xs">
              {user.sanctions.map((s) => (
                <div key={s.id} className="py-3 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={s.type === 'LOCK' ? 'destructive' : 'secondary'}
                        className="text-[11px] font-semibold"
                      >
                        {SANCTION_TYPE_LABELS[s.type] || s.type}
                      </Badge>
                      <span className="font-semibold text-foreground">
                        {s.reason}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-[11px]">
                      {formatDateTime(s.issuedAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                    <span>
                      Ban hành bởi: <span className="text-foreground">{s.issuedBy?.email || 'Hệ thống'}</span>
                    </span>

                    {s.liftedAt ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Đã mở khoá lúc: {formatDateTime(s.liftedAt)}
                        {s.liftNote && ` (Ghi chú: ${s.liftNote})`}
                      </span>
                    ) : s.type === 'LOCK' ? (
                      <span className="text-destructive font-medium">
                        Đang có hiệu lực
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Chỉnh sửa */}
      <UserFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={user}
        onSuccess={() => refetch()}
      />

      {/* Modal Xoá */}
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={user}
        onSuccess={() => navigate('/admin/users')}
      />

      {/* Dialog Cảnh báo */}
      <WarnDialog
        open={warnDialogOpen}
        onOpenChange={setWarnDialogOpen}
        user={userRef}
        onSubmit={handleWarnConfirm}
      />

      {/* Dialog Khoá */}
      <LockDialog
        open={lockDialogOpen}
        onOpenChange={setLockDialogOpen}
        user={userRef}
        onSubmit={handleLockConfirm}
      />

      {/* Dialog Mở khoá */}
      <UnlockDialog
        open={unlockDialogOpen}
        onOpenChange={setUnlockDialogOpen}
        user={userRef}
        onSubmit={handleUnlockConfirm}
      />
    </div>
  )
}
