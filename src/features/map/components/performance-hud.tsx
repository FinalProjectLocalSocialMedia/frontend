import { useState } from 'react'
import { Activity, ChevronDown, ChevronUp } from 'lucide-react'

export type PerformanceMetrics = {
  mapReadyTimeMs?: number
  densityFirstPaintMs?: number
  cellCount?: number
  resolution?: number
  window?: string
}

export type PerformanceHUDProps = {
  metrics: PerformanceMetrics
  className?: string
}

/**
 * Màn hình HUD đo lường hiệu năng hiển thị (Performance HUD).
 * Dùng để theo dõi ngân sách hiệu năng (mục 7.1) trong môi trường phát triển:
 * - map:ready ≤ 1500ms
 * - density-first-paint ≤ 800ms
 */
export function PerformanceHUD({ metrics, className = '' }: PerformanceHUDProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Chỉ hiển thị trong môi trường development hoặc khi có tham số debug
  if (!import.meta.env.DEV && typeof window !== 'undefined' && !window.location.search.includes('debug=true')) {
    return null
  }

  return (
    <div
      className={`pointer-events-auto rounded-lg border border-border/70 bg-card/90 font-mono text-[11px] text-foreground shadow-lg backdrop-blur-md transition-all ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left font-semibold hover:bg-muted/50 rounded-lg"
      >
        <span className="flex items-center gap-1.5 text-primary">
          <Activity className="size-3.5" />
          <span>Báo cáo hiệu năng</span>
        </span>
        {isExpanded ? <ChevronUp className="size-3 text-muted-foreground" /> : <ChevronDown className="size-3 text-muted-foreground" />}
      </button>

      {isExpanded && (
        <div className="border-t border-border/50 p-2.5 space-y-1.5 min-w-[200px]">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>map:ready:</span>
            <span className={`font-semibold ${metrics.mapReadyTimeMs && metrics.mapReadyTimeMs <= 1500 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {metrics.mapReadyTimeMs !== undefined ? `${Math.round(metrics.mapReadyTimeMs)} ms` : 'đang đo...'}
            </span>
          </div>

          <div className="flex justify-between items-center text-muted-foreground">
            <span>density-first-paint:</span>
            <span className={`font-semibold ${metrics.densityFirstPaintMs && metrics.densityFirstPaintMs <= 800 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {metrics.densityFirstPaintMs !== undefined ? `${Math.round(metrics.densityFirstPaintMs)} ms` : 'chưa vẽ'}
            </span>
          </div>

          <div className="flex justify-between items-center text-muted-foreground">
            <span>Số ô H3:</span>
            <span className="font-semibold text-foreground">
              {metrics.cellCount !== undefined ? metrics.cellCount : 0}
            </span>
          </div>

          <div className="flex justify-between items-center text-muted-foreground">
            <span>Độ phân giải H3:</span>
            <span className="font-semibold text-foreground">
              res {metrics.resolution !== undefined ? metrics.resolution : '-'}
            </span>
          </div>

          {metrics.window && (
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Cửa sổ:</span>
              <span className="font-semibold text-foreground">{metrics.window}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
