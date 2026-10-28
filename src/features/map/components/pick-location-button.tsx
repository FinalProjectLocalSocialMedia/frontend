import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type PickLocationButtonProps = {
  isPicking: boolean
  onToggle: () => void
}

export function PickLocationButton({ isPicking, onToggle }: PickLocationButtonProps) {
  return (
    <Button
      variant={isPicking ? 'default' : 'outline'}
      size="sm"
      onClick={onToggle}
      aria-label="Chọn vị trí làm tâm khu vực"
      aria-pressed={isPicking}
      className={`h-9 gap-1.5 rounded-full border px-3 shadow-md backdrop-blur-md transition-colors ${
        isPicking
          ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
          : 'border-border/80 bg-background/95 text-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <MapPin className="size-4" />
      <span
        className={`hidden sm:inline text-xs font-semibold ${
          isPicking ? 'text-primary-foreground' : 'text-foreground'
        }`}
      >
        {isPicking ? 'Nhấp chọn trên bản đồ' : 'Chọn vị trí'}
      </span>
    </Button>
  )
}
