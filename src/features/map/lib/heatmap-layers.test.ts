import { describe, expect, it, vi, beforeEach } from 'vitest'
import { latLngToCell } from 'h3-js'
import {
  buildHeatmapLayer,
  cellsToHeatPoints,
  radiusPixelsForZoom,
  supportsHeatmap,
  transformWeight,
} from '@/components/map/heatmap-layers'
import { MAP_CONFIG } from './map-config'
import type { DensityCell } from './types'

describe('Heatmap pure functions (Pha 2B)', () => {
  describe('radiusPixelsForZoom', () => {
    const lat = 21.0285 // Hà Nội

    it('clamps radius to RADIUS_PX_MIN at very low zoom levels', () => {
      const radiusAtZoom4 = radiusPixelsForZoom(4, lat)
      expect(radiusAtZoom4).toBe(MAP_CONFIG.HEATMAP.RADIUS_PX_MIN)
    })

    it('clamps radius to RADIUS_PX_MAX at very high zoom levels', () => {
      const radiusAtZoom18 = radiusPixelsForZoom(18, lat)
      expect(radiusAtZoom18).toBe(MAP_CONFIG.HEATMAP.RADIUS_PX_MAX)
    })

    it('is monotonically non-decreasing as zoom increases', () => {
      const r10 = radiusPixelsForZoom(10, lat)
      const r12 = radiusPixelsForZoom(12, lat)
      const r14 = radiusPixelsForZoom(14, lat)
      const r16 = radiusPixelsForZoom(16, lat)

      expect(r10).toBeGreaterThanOrEqual(MAP_CONFIG.HEATMAP.RADIUS_PX_MIN)
      expect(r12).toBeGreaterThanOrEqual(r10)
      expect(r14).toBeGreaterThanOrEqual(r12)
      expect(r16).toBeGreaterThanOrEqual(r14)
      expect(r16).toBeLessThanOrEqual(MAP_CONFIG.HEATMAP.RADIUS_PX_MAX)
    })
  })

  describe('transformWeight', () => {
    it('applies square root transform to counts', () => {
      expect(transformWeight(0)).toBe(0)
      expect(transformWeight(-4)).toBe(0)
      expect(transformWeight(1)).toBe(1)
      expect(transformWeight(4)).toBe(2)
      expect(transformWeight(9)).toBe(3)
      expect(transformWeight(16)).toBe(4)
      expect(transformWeight(100)).toBe(10)
    })
  })

  describe('cellsToHeatPoints', () => {
    it('converts H3 cells to HeatPoints with correct coordinates and weights', () => {
      // Ô H3 res 8 thực tế tại Hà Nội
      const h3Index1 = latLngToCell(21.0285, 105.8542, 8)
      const h3Index2 = latLngToCell(21.0362, 105.7906, 8)

      const mockCells: DensityCell[] = [
        { h3Index: h3Index1, count: 25 },
        { h3Index: h3Index2, count: 12 },
      ]

      const points = cellsToHeatPoints(mockCells)

      expect(points).toHaveLength(2)
      expect(points[0].weight).toBe(25)
      expect(points[1].weight).toBe(12)

      // Toạ độ hợp lệ quanh khu vực Hà Nội (~21.0, ~105.8)
      expect(points[0].position.latitude).toBeGreaterThan(20)
      expect(points[0].position.latitude).toBeLessThan(22)
      expect(points[0].position.longitude).toBeGreaterThan(105)
      expect(points[0].position.longitude).toBeLessThan(106)
    })

    it('skips invalid H3 cell indices gracefully', () => {
      const invalidCells: DensityCell[] = [{ h3Index: 'invalid-h3-index', count: 5 }]
      const points = cellsToHeatPoints(invalidCells)
      expect(points).toHaveLength(0)
    })
  })

  describe('buildHeatmapLayer', () => {
    it('constructs HeatmapLayer with correct props and pickable=false', () => {
      const points = [
        { position: { latitude: 21.0285, longitude: 105.8542 }, weight: 10 },
      ]

      const layer = buildHeatmapLayer(points, {
        id: 'density',
        radiusPixels: 45,
      })

      expect(layer.id).toBe('density')
      expect(layer.props.data).toBe(points)
      expect(layer.props.pickable).toBe(false)
      expect(layer.props.radiusPixels).toBe(45)
      expect(layer.props.aggregation).toBe('SUM')

      // Kiểm tra accessor toạ độ getPosition trả về [longitude, latitude]
      const getPos = layer.props.getPosition as (d: typeof points[0]) => [number, number]
      expect(getPos(points[0])).toEqual([105.8542, 21.0285])
    })
  })

  describe('supportsHeatmap', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('returns false when neither WebGL2 nor WebGL is supported', () => {
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
      expect(supportsHeatmap()).toBe(false)
    })

    it('returns true when WebGL2 or WebGL context exists', () => {
      const mockGl = {}
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockGl as any)
      expect(supportsHeatmap()).toBe(true)
    })
  })
})
