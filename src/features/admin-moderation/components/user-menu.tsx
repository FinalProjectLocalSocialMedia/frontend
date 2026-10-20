import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '../auth/auth-context'
import { ADMIN_BASE } from '../lib/constants'
import { initialsOf } from '../lib/labels'
import { StatusBadge } from './status-badge'

type UserMenuProps = {
  className?: string
  align?: 'start' | 'center' | 'end'
}

/**
 * Menu người dùng đang đăng nhập góc trên bên phải header Admin.
 * Hiển thị email, vai trò và chức năng Đăng xuất.
 */
export function UserMenu({ className, align = 'end' }: UserMenuProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  if (!user) return null

  const initials = initialsOf(user.email)

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await logout()
      toast.info('Đã đăng xuất thành công')
      navigate(`${ADMIN_BASE}/login`, { replace: true })
    } catch {
      toast.error('Có lỗi khi đăng xuất')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label="Tài khoản nhân viên"
            className={`gap-2 px-2 ${className ?? ''}`}
          />
        }
      >
        <Avatar size="sm" className="bg-primary/10 text-primary">
          <AvatarFallback className="text-xs font-semibold uppercase">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-xs font-medium text-foreground sm:inline-block">
          {user.email}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-1 p-2">
            <span className="truncate text-xs font-semibold text-foreground">
              {user.email}
            </span>
            <div>
              <StatusBadge type="role" value={user.role} className="text-[10px] py-0 px-1.5 h-4" />
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          disabled={loggingOut}
          className="cursor-pointer gap-2"
        >
          {loggingOut ? (
            <Spinner className="size-4" />
          ) : (
            <LogOut className="size-4" />
          )}
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
