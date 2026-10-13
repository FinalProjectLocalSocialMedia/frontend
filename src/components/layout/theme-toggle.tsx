import type { ReactNode } from 'react'
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

type Props = {
  className?: string
  iconClassName?: string
  /** Optional visible label next to the icon (used by the sidebar). */
  label?: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function ThemeToggle({ className, iconClassName, label, side = 'bottom' }: Props) {
  const { theme, setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" aria-label="Change theme" className={className} />}
      >
        <Sun className={`${iconClassName ?? ''} dark:hidden`} />
        <Moon className={`${iconClassName ?? ''} hidden dark:block`} />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="end" className="w-40">
        <DropdownMenuRadioGroup
          value={theme ?? 'system'}
          onValueChange={(v) => setTheme(v as Theme)}
        >
          <DropdownMenuRadioItem value="light" closeOnClick>
            <Sun /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" closeOnClick>
            <Moon /> Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" closeOnClick>
            <Monitor /> System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
