import { DENSITY_COLOR_RAMP } from '@/components/map/h3-layers'
import { STATS_WINDOW_LABELS } from '../lib/labels'
import type { StatsWindow } from '../lib/types'

export type DensityLegendProps = {
  window: StatsWindow
  totalPosts?: number
  className?: string
}

/**
 * Bảng chú giải thang màu mật độ H3 (DensityLegend) đặt ở góc trái dưới bản đồ.
 * Hiển thị thang màu 5 mức độ từ Ít đến Nhiều, đơn vị tính bài/ô và cửa sổ thời gian đang chọn.
 */
export function DensityLegend({ window, totalPosts, className = '' }: DensityLegendProps) {
  const windowLabel = STATS_WINDOW_LABELS[window] || window

  return (
    <div
      className={`pointer-events-auto rounded-xl border border-border/80 bg-card/90 p-2.5 shadow-md backdrop-blur-md transition-all sm:p-3 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-[11px] font-semibold text-foreground tracking-tight">
          Mật độ hoạt động
        </span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {windowLabel}
        </span>
      </div>

      {/* Thang dải 5 mức màu */}
      <div className="flex items-center gap-1 my-1">
        {DENSITY_COLOR_RAMP.map((color, idx) => (
          <div
            key={idx}
            className="h-2.5 flex-1 rounded-sm shadow-xs transition-transform hover:scale-110"
            style={{
              backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.85)`,
            }}
            title={`Mức độ ${idx + 1}`}
          />
        ))}
      </div>

      {/* Nhãn hai đầu thang đo */}
      <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
        <span>Ít</span>
        <span className="text-[9px] text-muted-foreground/80">bài / ô</span>
        <span>Nhiều</span>
      </div>

      {/* Tổng số bài viết trong vùng nhìn nếu có */}
      {typeof totalPosts === 'number' && totalPosts > 0 && (
        <div className="mt-1.5 border-t border-border/50 pt-1 text-center text-[10px] text-muted-foreground">
          Tổng cộng <span className="font-semibold text-foreground">{totalPosts}</span> bài trong vùng
        </div>
      )}
    </div>
  )
}
