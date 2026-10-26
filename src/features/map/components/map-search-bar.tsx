import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export type MapSearchBarProps = {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  placeholder?: string
}

export function MapSearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Tìm địa điểm, bài viết, người dùng...',
}: MapSearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit?.()
    }
  }

  return (
    <div className="relative flex w-full max-w-sm sm:max-w-md items-center shadow-md rounded-full bg-background/95 border border-border/80 backdrop-blur-md">
      <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Tìm kiếm trên bản đồ"
        className="h-9 w-full rounded-full border-0 bg-transparent pl-10 pr-9 text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-primary/40"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onChange('')}
          aria-label="Xoá tìm kiếm"
          className="absolute right-2.5 size-6 rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
