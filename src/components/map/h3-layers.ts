import { H3HexagonLayer } from '@deck.gl/geo-layers'

export type ColorRGBA = [number, number, number, number]

/** 5-step density color ramp: light yellow → orange → vivid red (alpha 120-180 / 0.47-0.70) */
export const DENSITY_COLOR_RAMP: readonly ColorRGBA[] = [
  [254, 240, 138, 120], // level 1: pale yellow
  [253, 186, 116, 135], // level 2: yellow-orange
  [251, 146, 60, 150],  // level 3: orange
  [239, 68, 68, 165],   // level 4: warm red
  [185, 28, 28, 180],   // level 5: deep red
] as const

export const DENSITY_RES_BANDS = [
  { minZoom: 9, res: 6 },
  { minZoom: 11, res: 7 },
  { minZoom: 13, res: 8 },
] as const

export const STORED_H3_RESOLUTION = 8

/** Map zoom level to H3 resolution based on configured bands, capped at STORED_H3_RESOLUTION. */
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
 * Maps count/maxCount using square root scale to a 5-step RGBA color.
 * If isDimmed is true (e.g. cell outside radius), alpha is scaled to ~35% (alpha * 0.35).
 */
export function getDensityColor(
  count: number,
  maxCount: number,
  isDimmed = false,
): ColorRGBA {
  if (count <= 0 || maxCount <= 0) {
    return [0, 0, 0, 0]
  }

  // Sqrt scale for better contrast across skewed distributions
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

/** Build a deck.gl H3HexagonLayer for rendering hexagon cells. */
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
