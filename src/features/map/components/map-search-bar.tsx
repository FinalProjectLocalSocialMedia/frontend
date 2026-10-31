import { useState, useEffect, useRef } from 'react'
import { Search, X, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { MapPlace } from '../lib/types'

export type MapSearchBarProps = {
  value: string
  onChange: (value: string) => void
  onSubmit?: (term: string) => void
  suggestions?: MapPlace[]
  onSelectSuggestion?: (place: MapPlace) => void
  placeholder?: string
}

/**
 * Thanh tìm kiếm trên bản đồ (MapSearchBar) theo mục 6.6.
 * - Cho phép nhập từ khoá bất kỳ (không cần zoom gần)
 * - Tự động gợi ý địa điểm trùng tên khi gõ (debounce 250ms)
 * - Nhấn Enter để kích hoạt tìm kiếm và mở SearchResultsPanel
 * - Từ khoá rỗng tuyệt đối không gọi API
 */
export function MapSearchBar({
  value,
  onChange,
  onSubmit,
  suggestions = [],
  onSelectSuggestion,
  placeholder = 'Tìm địa điểm, bài viết, người dùng...',
}: MapSearchBarProps) {
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce 250ms cho việc tính toán gợi ý địa điểm trùng tên
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(value.trim().toLowerCase())
    }, 250)
    return () => clearTimeout(timer)
  }, [value])

  // Lọc danh sách địa điểm gợi ý khớp với từ khoá
  const filteredSuggestions = debouncedQuery && suggestions.length > 0
    ? suggestions
        .filter((place) => place.name.toLowerCase().includes(debouncedQuery))
        .slice(0, 5)
    : []

  // Đóng dropdown khi click ra bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = value.trim()
      if (trimmed) {
        setIsDropdownOpen(false)
        onSubmit?.(trimmed)
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false)
    }
  }

  const handleSelectPlace = (place: MapPlace) => {
    setIsDropdownOpen(false)
    if (onSelectSuggestion) {
      onSelectSuggestion(place)
    } else {
      onChange(place.name)
      onSubmit?.(place.name)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex w-full max-w-sm sm:max-w-md flex-col"
    >
      <div className="relative flex w-full items-center shadow-md rounded-full bg-background/95 border border-border/80 backdrop-blur-md">
        <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setIsDropdownOpen(true)
          }}
          onFocus={() => {
            if (value.trim()) setIsDropdownOpen(true)
          }}
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
            onClick={() => {
              onChange('')
              setIsDropdownOpen(false)
            }}
            aria-label="Xoá tìm kiếm"
            className="absolute right-2.5 size-6 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Dropdown danh sách gợi ý địa điểm (sau debounce 250ms) */}
      {isDropdownOpen && filteredSuggestions.length > 0 && (
        <div
          data-testid="search-suggestions-dropdown"
          className="absolute top-11 inset-x-0 z-30 overflow-hidden rounded-2xl border border-border/80 bg-background/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in-50 zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Gợi ý địa điểm
          </div>
          <div className="flex flex-col gap-0.5">
            {filteredSuggestions.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => handleSelectPlace(place)}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted/80 focus-visible:bg-muted/80 focus-visible:outline-hidden"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="size-3.5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-foreground">
                    {place.name}
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground">
                    {place.postCount} bài viết
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
