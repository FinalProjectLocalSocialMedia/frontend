import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { STATS_WINDOW_LABELS } from '../lib/labels'
import type { StatsWindow } from '../lib/types'

export type WindowControlProps = {
  value: StatsWindow
  onChange: (window: StatsWindow) => void
  disabled?: boolean
}

const WINDOW_OPTIONS: StatsWindow[] = ['1d', '7d', '30d']

export function WindowControl({ value, onChange, disabled }: WindowControlProps) {
  const handleValueChange = (val: string[]) => {
    if (!val || val.length === 0) return
    const next = val[val.length - 1] as StatsWindow
    if (WINDOW_OPTIONS.includes(next)) {
      onChange(next)
    }
  }

  return (
    <div className="flex items-center rounded-full border border-border/80 bg-background/95 p-1 shadow-md backdrop-blur-md">
      <ToggleGroup
        value={[value]}
        onValueChange={handleValueChange}
        disabled={disabled}
        className="gap-1"
      >
        {WINDOW_OPTIONS.map((w) => (
          <ToggleGroupItem
            key={w}
            value={w}
            size="sm"
            aria-label={`Cửa sổ ${STATS_WINDOW_LABELS[w]}`}
            className="h-7 rounded-full px-2.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm data-[state=on]:hover:bg-primary/90"
          >
            {STATS_WINDOW_LABELS[w]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
