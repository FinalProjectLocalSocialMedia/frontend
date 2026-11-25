import { Clock, ChevronDown, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { STATS_WINDOW_LABELS } from '../lib/labels'
import type { StatsWindow } from '../lib/types'

export type WindowControlProps = {
  value: StatsWindow
  onChange: (window: StatsWindow) => void
  disabled?: boolean
}

const WINDOW_OPTIONS: StatsWindow[] = ['1d', '7d', '30d']

export function WindowControl({ value = '7d', onChange, disabled }: WindowControlProps) {
  const currentLabel = STATS_WINDOW_LABELS[value] ?? STATS_WINDOW_LABELS['7d']

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        aria-label={`Khoảng thời gian: ${currentLabel}`}
        className="flex h-9 items-center gap-1.5 rounded-full border border-border/80 bg-background/95 px-3 text-xs font-medium text-foreground shadow-md backdrop-blur-md transition-colors hover:bg-muted/80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
      >
        <Clock className="size-3.5 text-primary shrink-0" />
        <span>{currentLabel}</span>
        <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[140px] rounded-xl p-1">
        {WINDOW_OPTIONS.map((w) => {
          const isSelected = w === value
          return (
            <DropdownMenuItem
              key={w}
              onClick={() => onChange(w)}
              className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer"
            >
              <span>{STATS_WINDOW_LABELS[w]}</span>
              {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
