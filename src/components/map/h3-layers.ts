import { H3HexagonLayer } from '@deck.gl/geo-layers'

export type ColorRGBA = [number, number, number, number]

/** Dải màu mật độ 5 mức: vàng nhạt → cam → đỏ đậm (độ trong suốt alpha 120-180 / 0.47-0.70) */
export const DENSITY_COLOR_RAMP: readonly ColorRGBA[] = [
  [254, 240, 138, 120], // Mức 1: Vàng nhạt
  [253, 186, 116, 135], // Mức 2: Vàng cam
  [251, 146, 60, 150],  // Mức 3: Cam
  [239, 68, 68, 165],   // Mức 4: Đỏ tươi
  [185, 28, 28, 180],   // Mức 5: Đỏ đậm
] as const

export const DENSITY_RES_BANDS = [
  { minZoom: 9, res: 6 },
  { minZoom: 11, res: 7 },
  { minZoom: 13, res: 8 },
] as const

export const STORED_H3_RESOLUTION = 8

/** Chuyển mức zoom của bản đồ sang độ phân giải H3 dựa trên cấu hình dải, giới hạn ở STORED_H3_RESOLUTION. */
export function zoomToResolution(zoom: number): number {
  const roundedZoom = Math.floor(zoom)
  let targetRes = 6
  for (const band of DENSITY_RES_BANDS) {
    if (roundedZoom >= band.minZoom) {
      targetRes = band.res
    }
  }
  return Math.min(targetRes, STORED_H3_RESOLUTION)
}

/**
 * Ánh xạ tỉ lệ count/maxCount theo thang căn bậc hai (sqrt) sang dải màu RGBA 5 mức.
 * Nếu isDimmed là true (ví dụ: ô nằm ngoài bán kính quan tâm), alpha sẽ giảm còn ~35% (alpha * 0.35).
 */
export function getDensityColor(
  count: number,
  maxCount: number,
  isDimmed = false,
): ColorRGBA {
  if (count <= 0 || maxCount <= 0) {
    return [0, 0, 0, 0]
  }

  // Thang căn bậc hai để tăng độ tương phản rõ rệt cho các phân phối lệch
  const ratio = Math.min(1, Math.max(0, Math.sqrt(count / maxCount)))
  const index = Math.min(4, Math.floor(ratio * 5))
  const baseColor = DENSITY_COLOR_RAMP[index]

  if (isDimmed) {
    return [baseColor[0], baseColor[1], baseColor[2], Math.round(baseColor[3] * 0.35)]
  }

  return [baseColor[0], baseColor[1], baseColor[2], baseColor[3]]
}

export type DensityCellItem = {
  h3Index: string
  count: number
}

export type BuildHexLayerOptions<T extends DensityCellItem = DensityCellItem> = {
  id?: string
  data: T[]
  maxCount: number
  isDimmed?: (cell: T) => boolean
  pickable?: boolean
  coverage?: number
  onHover?: (info: { object?: T; x: number; y: number }) => void
  onClick?: (info: { object?: T; x: number; y: number }) => void
}

/** Khởi tạo lớp H3HexagonLayer của deck.gl để hiển thị các ô lục giác. */
export function buildHexLayer<T extends DensityCellItem = DensityCellItem>(
  options: BuildHexLayerOptions<T>,
) {
  const {
    id = 'h3-density-layer',
    data,
    maxCount,
    isDimmed,
    pickable = true,
    coverage = 0.95,
    onHover,
    onClick,
  } = options

  return new H3HexagonLayer<T>({
    id,
    data,
    pickable,
    stroked: false,
    extruded: false,
    coverage,
    getHexagon: (d: T) => d.h3Index,
    getFillColor: (d: T) => {
      const dimmed = isDimmed ? isDimmed(d) : false
      return getDensityColor(d.count, maxCount, dimmed)
    },
    updateTriggers: {
      getFillColor: [maxCount, isDimmed],
    },
    onHover: onHover ? (info) => onHover(info as { object?: T; x: number; y: number }) : undefined,
    onClick: onClick ? (info) => onClick(info as { object?: T; x: number; y: number }) : undefined,
  })
}
