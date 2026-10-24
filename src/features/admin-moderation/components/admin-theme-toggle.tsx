import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type AdminThemeToggleProps = {
  className?: string
  align?: 'start' | 'center' | 'end'
}

/**
 * Nút chuyển đổi giao diện sáng/tối cục bộ trong khu vực Admin
 * (Tuân thủ quy tắc kiến trúc 5.2: không import từ layout của ứng dụng chính).
 */
export function AdminThemeToggle({
  className,
  align = 'end',
}: AdminThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Đổi chế độ sáng tối"
            className={className}
          />
        }
      >
        <Sun className="size-4 dark:hidden" />
        <Moon className="hidden size-4 dark:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-36">
        <DropdownMenuRadioGroup
          value={theme ?? 'system'}
          onValueChange={(val) => val && setTheme(val as Theme)}
        >
          <DropdownMenuRadioItem value="light" closeOnClick className="gap-2">
            <Sun className="size-4" />
            <span>Sáng</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" closeOnClick className="gap-2">
            <Moon className="size-4" />
            <span>Tối</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" closeOnClick className="gap-2">
            <Monitor className="size-4" />
            <span>Hệ thống</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
