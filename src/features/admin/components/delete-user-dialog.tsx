import { useState } from 'react'
import { AlertTriangle, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { initialsOf, ROLE_LABELS } from '@/features/admin-moderation/lib/labels'
import type { AdminUserListItem } from '@/features/admin-moderation/lib/types'
import { useDeleteUser } from '../api/users.queries'

type DeleteUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUserListItem | null
  onSuccess?: () => void
}

export function DeleteUserDialog({ open, onOpenChange, user, onSuccess }: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteMutation = useDeleteUser()

  if (!user) return null

  const isAdmin = user.role === 'ADMIN'

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteMutation.mutateAsync(user.id)
      toast.success(`Đã xoá người dùng ${user.displayName}`)
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xoá tài khoản'
      toast.error(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <UserX className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Xác nhận xoá người dùng</DialogTitle>
              <DialogDescription className="text-xs">
                Thao tác xoá mềm sẽ vô hiệu hoá tài khoản này khỏi hệ thống.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
            <Avatar size="default">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
              <AvatarFallback>{initialsOf(user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-xs text-foreground truncate">{user.displayName}</p>
              {user.email && (
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              )}
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {user.id.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-start gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-400">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Lưu ý quản trị viên:</p>
                <p className="mt-0.5 text-[11px] opacity-90">
                  Hệ thống không cho phép tự xoá chính mình hoặc xoá tài khoản Quản trị viên cuối
                  cùng.
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Người dùng bị xoá sẽ không thể đăng nhập hoặc thực hiện bất kỳ hoạt động nào trên nền
            tảng. Dữ liệu bài viết và báo cáo liên quan vẫn được lưu trữ theo quy định kiểm toán.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="text-xs"
          >
            Huỷ bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs gap-1.5"
          >
            {isDeleting && <Spinner className="size-3.5" />}
            Xác nhận xoá
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
