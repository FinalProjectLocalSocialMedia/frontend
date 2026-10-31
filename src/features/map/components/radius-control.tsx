import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { MAP_CONFIG } from '../lib/map-config'
import type { RadiusKm } from '../lib/types'

export type RadiusControlProps = {
  value: RadiusKm
  onChange: (radius: RadiusKm) => void
  disabled?: boolean
}

export function RadiusControl({ value, onChange, disabled }: RadiusControlProps) {
  const handleValueChange = (val: string[]) => {
    if (!val || val.length === 0) return
    const next = parseInt(val[val.length - 1], 10) as RadiusKm
    if (MAP_CONFIG.RADIUS_OPTIONS_KM.includes(next)) {
      onChange(next)
    }
  }

  return (
    <div className="flex items-center rounded-full border border-border/80 bg-background/95 p-1 shadow-md backdrop-blur-md">
      <span className="px-2 text-xs font-semibold text-muted-foreground hidden sm:inline">
        Bán kính:
      </span>
      <ToggleGroup
        value={[String(value)]}
        onValueChange={handleValueChange}
        disabled={disabled}
        className="gap-1"
      >
        {MAP_CONFIG.RADIUS_OPTIONS_KM.map((r) => (
          <ToggleGroupItem
            key={r}
            value={String(r)}
            size="sm"
            aria-label={`Bán kính ${r} km`}
            className="h-7 rounded-full px-2.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm data-[state=on]:hover:bg-primary/90"
          >
            {r} km
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
