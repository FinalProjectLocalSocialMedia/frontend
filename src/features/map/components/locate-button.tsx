import { LocateFixed } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type LocateButtonProps = {
  onClick: () => void
  isActive?: boolean
  loading?: boolean
}

export function LocateButton({ onClick, isActive, loading }: LocateButtonProps) {
  return (
    <Button
      type="button"
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      disabled={loading}
      aria-label="Vị trí của tôi"
      className={`h-9 gap-1.5 rounded-full border px-3 shadow-md backdrop-blur-md transition-colors ${
        isActive
          ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
          : 'border-border/80 bg-background/95 text-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <LocateFixed
        className={`size-4 ${
          loading
            ? 'animate-spin text-primary'
            : isActive
              ? 'text-primary-foreground'
              : 'text-primary'
        }`}
      />
      <span
        className={`hidden sm:inline text-xs font-semibold ${
          isActive ? 'text-primary-foreground' : 'text-foreground'
        }`}
      >
        Vị trí của tôi
      </span>
    </Button>
  )
}
