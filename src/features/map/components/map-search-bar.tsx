import { useState, useEffect, useRef } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { Search, X, MapPin, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { GeoPoint, MapPlace } from '../lib/types'

export type GooglePlaceSelection = {
  name: string
  formattedAddress?: string
  location: GeoPoint
  viewport?: google.maps.LatLngBounds | null
}

export type MapSearchBarProps = {
  value: string
  onChange: (value: string) => void
  onSubmit?: (term: string) => void
  suggestions?: MapPlace[]
  onSelectSuggestion?: (place: MapPlace) => void
  onSelectGooglePlace?: (place: GooglePlaceSelection) => void
  placeholder?: string
}

type PredictionItem = {
  placeId: string
  mainText: string
  secondaryText: string
  fullText: string
  rawPrediction: any
}

/**
 * Thanh tìm kiếm địa điểm trên bản đồ sử dụng Google Places Autocomplete (New API).
 * - Tự động gợi ý địa điểm từ Google Maps khi người dùng gõ (debounce 250ms)
 * - Khi chọn địa điểm, lấy toạ độ (location) từ Google Places và kéo bản đồ về đúng địa điểm đó
 * - Không tự động mở bảng chi tiết địa điểm (người dùng tự nhấn vào marker trên bản đồ)
 */
export function MapSearchBar({
  value,
  onChange,
  onSubmit,
  suggestions = [],
  onSelectSuggestion,
  onSelectGooglePlace,
  placeholder = 'Tìm kiếm địa điểm trên Google Maps...',
}: MapSearchBarProps) {
  const placesLib = useMapsLibrary('places')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [predictions, setPredictions] = useState<PredictionItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const suppressFetchRef = useRef(false)

  // Debounce 250ms cho từ khoá tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(value.trim())
    }, 250)
    return () => clearTimeout(timer)
  }, [value])

  // Gọi Google Places Autocomplete API khi debouncedQuery thay đổi
  useEffect(() => {
    if (suppressFetchRef.current) {
      suppressFetchRef.current = false
      return
    }

    if (!debouncedQuery || debouncedQuery.length < 2 || !placesLib) {
      setPredictions([])
      setIsLoading(false)
      return
    }

    let isCancelled = false
    setIsLoading(true)

    async function fetchPredictions() {
      try {
        const AutocompleteSuggestion = (placesLib as any)?.AutocompleteSuggestion
        if (AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
          const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: debouncedQuery,
            language: 'vi',
            region: 'vn',
            includedRegionCodes: ['vn'],
          })

          if (isCancelled) return

          const items: PredictionItem[] = (response?.suggestions || [])
            .map((s: any, idx: number) => {
              const pred = s.placePrediction
              if (!pred) return null
              const mainText = pred.mainText?.toString?.() || pred.text?.toString?.() || ''
              const secondaryText = pred.secondaryText?.toString?.() || ''
              const fullText = pred.text?.toString?.() || mainText
              return {
                placeId: pred.placeId || `pred-${idx}`,
                mainText,
                secondaryText,
                fullText,
                rawPrediction: pred,
              }
            })
            .filter(Boolean)
            .slice(0, 6)

          setPredictions(items)
          setActiveIndex(0)
          setIsLoading(false)
          return
        }

        // Fallback sang AutocompleteService nếu trình duyệt/SDK chưa có AutocompleteSuggestion
        if (placesLib?.AutocompleteService) {
          const service = new placesLib.AutocompleteService()
          service.getPlacePredictions(
            {
              input: debouncedQuery,
              componentRestrictions: { country: 'vn' },
              language: 'vi',
            },
            (results) => {
              if (isCancelled) return
              const items: PredictionItem[] = (results || []).slice(0, 6).map((r) => ({
                placeId: r.place_id,
                mainText: r.structured_formatting?.main_text || r.description,
                secondaryText: r.structured_formatting?.secondary_text || '',
                fullText: r.description,
                rawPrediction: r,
              }))
              setPredictions(items)
              setActiveIndex(0)
              setIsLoading(false)
            },
          )
          return
        }

        setIsLoading(false)
      } catch (err) {
        if (!isCancelled) {
          console.error('Lỗi khi tải gợi ý Google Places:', err)
          setPredictions([])
          setIsLoading(false)
        }
      }
    }

    fetchPredictions()

    return () => {
      isCancelled = true
    }
  }, [debouncedQuery, placesLib])

  // Fallback lọc gợi ý cục bộ (chỉ dùng khi không có placesLib như trong môi trường unit test)
  const filteredLocalSuggestions =
    !placesLib && debouncedQuery && suggestions.length > 0
      ? suggestions
          .filter((place) => place.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
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

  const handleSelectPrediction = async (item: PredictionItem) => {
    setIsDropdownOpen(false)
    suppressFetchRef.current = true
    onChange(item.mainText || item.fullText)

    try {
      // Nhánh 1: Places API (New) giống test_autocomplete.html
      if (typeof item.rawPrediction?.toPlace === 'function') {
        const place = item.rawPrediction.toPlace()
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
        })

        const loc = place.location
        if (loc) {
          const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat
          const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng
          onSelectGooglePlace?.({
            name: place.displayName || item.mainText,
            formattedAddress: place.formattedAddress || item.secondaryText,
            location: { latitude: lat, longitude: lng },
            viewport: place.viewport ?? null,
          })
        }
        return
      }

      // Nhánh 2: Fallback Geocoder theo placeId
      if (typeof google !== 'undefined' && google.maps?.Geocoder && item.placeId) {
        const geocoder = new google.maps.Geocoder()
        const res = await geocoder.geocode({ placeId: item.placeId })
        const first = res.results?.[0]
        if (first?.geometry?.location) {
          onSelectGooglePlace?.({
            name: item.mainText,
            formattedAddress: first.formatted_address || item.secondaryText,
            location: {
              latitude: first.geometry.location.lat(),
              longitude: first.geometry.location.lng(),
            },
            viewport: first.geometry.viewport ?? null,
          })
        }
      }
    } catch (err) {
      console.error('Không thể lấy toạ độ chi tiết từ Google Place:', err)
    }
  }

  const handleSelectLocalPlace = (place: MapPlace) => {
    setIsDropdownOpen(false)
    if (onSelectSuggestion) {
      onSelectSuggestion(place)
    } else {
      onChange(place.name)
      onSubmit?.(place.name)
    }
  }

  const totalOptions =
    predictions.length > 0 ? predictions.length : filteredLocalSuggestions.length
  const safeActiveIndex =
    totalOptions > 0 ? Math.min(Math.max(0, activeIndex), totalOptions - 1) : 0

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isDropdownOpen) {
        setIsDropdownOpen(true)
        setActiveIndex(0)
      } else if (totalOptions > 0) {
        setActiveIndex((prev) => (prev + 1) % totalOptions)
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isDropdownOpen) {
        setIsDropdownOpen(true)
        setActiveIndex(0)
      } else if (totalOptions > 0) {
        setActiveIndex((prev) => (prev - 1 + totalOptions) % totalOptions)
      }
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (predictions.length > 0) {
        const target = predictions[safeActiveIndex] ?? predictions[0]
        void handleSelectPrediction(target)
        return
      }
      if (filteredLocalSuggestions.length > 0) {
        const target = filteredLocalSuggestions[safeActiveIndex] ?? filteredLocalSuggestions[0]
        handleSelectLocalPlace(target)
        return
      }
      const trimmed = value.trim()
      if (trimmed) {
        setIsDropdownOpen(false)
        onSubmit?.(trimmed)
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false)
    }
  }

  const hasDropdownContent =
    isLoading || predictions.length > 0 || filteredLocalSuggestions.length > 0

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
            setActiveIndex(0)
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
              setPredictions([])
              setActiveIndex(0)
              setIsDropdownOpen(false)
            }}
            aria-label="Xoá tìm kiếm"
            className="absolute right-2.5 size-6 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Dropdown danh sách gợi ý địa điểm từ Google Places Autocomplete */}
      {isDropdownOpen && hasDropdownContent && (
        <div
          data-testid="search-suggestions-dropdown"
          role="listbox"
          className="absolute top-11 inset-x-0 z-30 overflow-hidden rounded-2xl border border-border/80 bg-background/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in-50 zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Gợi ý địa điểm
          </div>

          {isLoading && predictions.length === 0 ? (
            <div className="flex items-center gap-2 px-2.5 py-2.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Đang tìm địa điểm...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {predictions.map((item, index) => {
                const isActive = index === safeActiveIndex
                return (
                  <button
                    key={item.placeId}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => void handleSelectPrediction(item)}
                    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-colors focus-visible:outline-hidden cursor-pointer ${
                      isActive ? 'bg-muted text-foreground' : 'hover:bg-muted/80'
                    }`}
                  >
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="size-3.5" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-foreground">
                        {item.mainText}
                      </span>
                      {item.secondaryText && (
                        <span className="truncate text-[10px] text-muted-foreground">
                          {item.secondaryText}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}

              {filteredLocalSuggestions.map((place, index) => {
                const isActive = index === safeActiveIndex
                return (
                  <button
                    key={place.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelectLocalPlace(place)}
                    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-colors focus-visible:outline-hidden cursor-pointer ${
                      isActive ? 'bg-muted text-foreground' : 'hover:bg-muted/80'
                    }`}
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
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
