import { useState } from 'react'
import { Calendar as CalendarIcon, Clock, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TIME_PRESET_LABELS } from '../lib/labels'
import type { TimeFilterValue, TimePreset } from '../lib/types'

export type TimeFilterProps = {
  value: TimeFilterValue
  onChange: (value: TimeFilterValue) => void
  className?: string
}

const PRESET_OPTIONS: { preset: TimePreset; label: string }[] = [
  { preset: '3h', label: '3 giờ qua' },
  { preset: '1d', label: '1 ngày trước' },
  { preset: '7d', label: '7 ngày qua' },
  { preset: '30d', label: '30 ngày qua' },
]

/**
 * Component lọc thời gian dùng chung (TimeFilter) theo mục 6.7.
 * - Hiển thị giá trị hiện tại trên nút Trigger
 * - Mở Popover cho phép chọn preset (Tất cả, 3h, 1d, 7d, 30d) hoặc chọn một ngày cụ thể trên lịch
 * - Không cho phép chọn ngày trong tương lai
 * - Định dạng chuỗi ngày YYYY-MM-DD theo giờ Việt Nam
 */
export function TimeFilter({ value, onChange, className = '' }: TimeFilterProps) {
  const [open, setOpen] = useState(false)

  // Xác định nhãn hiển thị hiện tại
  const getDisplayLabel = () => {
    if (value.kind === 'all') return 'Tất cả thời gian'
    if (value.kind === 'preset') return TIME_PRESET_LABELS[value.preset] || value.preset
    if (value.kind === 'date') {
      const [year, month, day] = value.date.split('-')
      if (year && month && day) {
        return `${day}/${month}/${year}`
      }
      return value.date
    }
    return 'Lọc thời gian'
  }

  // Xử lý chọn preset
  const handleSelectPreset = (preset: TimePreset) => {
    onChange({ kind: 'preset', preset })
    setOpen(false)
  }

  // Xử lý chọn tất cả thời gian
  const handleSelectAll = () => {
    onChange({ kind: 'all' })
    setOpen(false)
  }

  // Xử lý chọn ngày từ Calendar
  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    onChange({ kind: 'date', date: dateStr })
    setOpen(false)
  }

  // Ngày hiện tại làm mốc giới hạn tối đa
  const today = new Date()

  // Chuyển đổi chuỗi ngày hiện tại sang Date object để highlight trên Calendar
  const selectedCalendarDate =
    value.kind === 'date' ? new Date(`${value.date}T12:00:00`) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={`h-8 gap-1.5 rounded-lg border-border/80 px-2.5 text-xs font-medium shadow-xs hover:bg-muted/60 ${className}`}
            aria-label={`Lọc thời gian, hiện tại: ${getDisplayLabel()}`}
          />
        }
      >
        <Clock className="size-3.5 text-muted-foreground" />
        <span>{getDisplayLabel()}</span>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-3 flex flex-col gap-3 shadow-lg"
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Khoảng thời gian nhanh
          </span>
          <div className="flex flex-wrap gap-1">
            <Button
              key="all"
              variant={value.kind === 'all' ? 'default' : 'outline'}
              size="xs"
              onClick={handleSelectAll}
              className="h-7 text-xs font-medium"
            >
              {value.kind === 'all' && <Check className="size-3 mr-1" />}
              Tất cả
            </Button>
            {PRESET_OPTIONS.map((item) => {
              const isSelected = value.kind === 'preset' && value.preset === item.preset
              return (
                <Button
                  key={item.preset}
                  variant={isSelected ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => handleSelectPreset(item.preset)}
                  className="h-7 text-xs font-medium"
                >
                  {isSelected && <Check className="size-3 mr-1" />}
                  {item.label}
                </Button>
              )
            })}
          </div>
        </div>

        <div className="border-t border-border/60 pt-2 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <CalendarIcon className="size-3.5" />
            <span>Hoặc chọn một ngày cụ thể</span>
          </div>
          <Calendar
            mode="single"
            selected={selectedCalendarDate}
            onSelect={handleSelectDate}
            disabled={(date) => date > today}
            className="p-1 rounded-md border border-border/50"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
