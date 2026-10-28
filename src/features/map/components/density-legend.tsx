import { DENSITY_COLOR_RAMP } from '@/components/map/h3-layers'
import { STATS_WINDOW_LABELS } from '../lib/labels'
import type { DensityMode, StatsWindow } from '../lib/types'

export type DensityLegendProps = {
  window: StatsWindow
  mode?: DensityMode
  totalPosts?: number
  className?: string
}

/**
 * Bảng chú giải thang màu mật độ (DensityLegend) đặt ở góc trái dưới bản đồ.
 * - Chế độ HEATMAP: hiển thị thanh dải gradient mượt mà và nhãn "Cường độ tương đối"
 * - Chế độ HEX: hiển thị thang 5 khối màu ô lục giác H3 và đơn vị "bài / ô"
 */
export function DensityLegend({
  window,
  mode = 'HEATMAP',
  totalPosts,
  className = '',
}: DensityLegendProps) {
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

      {mode === 'HEATMAP' ? (
        /* Thang dải gradient mượt mà cho chế độ Heatmap */
        <div className="my-1.5">
          <div
            className="h-2.5 w-full rounded-sm shadow-2xs border border-black/10"
            style={{
              background:
                'linear-gradient(to right, rgba(255,255,178,0.4) 0%, rgba(254,217,118,0.8) 25%, rgba(254,178,76,0.9) 50%, rgba(253,141,60,0.95) 75%, rgba(240,59,32,1) 90%, rgba(189,0,38,1) 100%)',
            }}
            title="Thang cường độ nhiệt tương đối"
          />
          <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground mt-1">
            <span>Ít</span>
            <span className="text-[9px] text-muted-foreground/80">Cường độ tương đối</span>
            <span>Nhiều</span>
          </div>
        </div>
      ) : (
        /* Thang 5 khối màu cho chế độ ô lục giác HEX */
        <div className="my-1.5">
          <div className="flex items-center gap-1">
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
          <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground mt-1">
            <span>Ít</span>
            <span className="text-[9px] text-muted-foreground/80">bài / ô</span>
            <span>Nhiều</span>
          </div>
        </div>
      )}

      {/* Tổng số bài viết trong vùng nhìn nếu có */}
      {typeof totalPosts === 'number' && totalPosts > 0 && (
        <div className="mt-1.5 border-t border-border/50 pt-1 text-center text-[10px] text-muted-foreground">
          Tổng cộng <span className="font-semibold text-foreground">{totalPosts}</span> bài trong vùng
        </div>
      )}
    </div>
  )
}
