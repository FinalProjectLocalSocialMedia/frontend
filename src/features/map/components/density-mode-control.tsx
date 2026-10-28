import { Flame, Hexagon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DensityMode } from '../lib/types'

export type DensityModeControlProps = {
  value: DensityMode
  onChange: (value: DensityMode) => void
  className?: string
}

/**
 * Bộ chuyển đổi chế độ mật độ hoạt động (Pha 2B).
 * - Cho phép người dùng chuyển đổi giữa:
 *   + 'HEATMAP': Hiển thị quầng nhiệt mượt mà lan toả
 *   + 'HEX': Hiển thị ô lưới lục giác H3
 * - Đồng bộ với tham số ?d= trên URL và lưu trữ trong localStorage
 */
export function DensityModeControl({
  value,
  onChange,
  className = '',
}: DensityModeControlProps) {
  return (
    <div
      role="group"
      aria-label="Chọn chế độ hiển thị mật độ"
      className={`inline-flex items-center gap-1 rounded-xl border border-border/80 bg-card/90 p-1 shadow-md backdrop-blur-md transition-all ${className}`}
    >
      <Button
        type="button"
        variant={value === 'HEATMAP' ? 'default' : 'ghost'}
        size="xs"
        onClick={() => onChange('HEATMAP')}
        aria-pressed={value === 'HEATMAP'}
        title="Chế độ quầng nhiệt mượt mà (Heatmap)"
        className="h-7 gap-1.5 rounded-lg px-2.5 text-xs font-semibold cursor-pointer"
      >
        <Flame className={`size-3.5 ${value === 'HEATMAP' ? 'text-amber-300' : 'text-amber-500'}`} />
        <span>Mượt</span>
      </Button>

      <Button
        type="button"
        variant={value === 'HEX' ? 'default' : 'ghost'}
        size="xs"
        onClick={() => onChange('HEX')}
        aria-pressed={value === 'HEX'}
        title="Chế độ ô lục giác H3"
        className="h-7 gap-1.5 rounded-lg px-2.5 text-xs font-semibold cursor-pointer"
      >
        <Hexagon className="size-3.5" />
        <span>Ô lục giác</span>
      </Button>
    </div>
  )
}
