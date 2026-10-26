import { describe, expect, it } from 'vitest'
import { haversineMeters, latLngToPixel, padBounds, radiusToBounds } from '@/components/map/geo'
import { zoomToResolution } from '@/components/map/h3-layers'
import { formatRelativeVi } from './relative-time'
import { resolveTimeFilter } from './time-filter'

describe('Pure geometric functions', () => {
  it('haversineMeters returns 0 for identical points', () => {
    const p = { latitude: 21.0285, longitude: 105.8542 }
    expect(haversineMeters(p, p)).toBe(0)
  })

  it('haversineMeters calculates expected distance across Hanoi landmarks', () => {
    const hanoiCenter = { latitude: 21.0285, longitude: 105.8542 } // Hoan Kiem
    const keangnam = { latitude: 21.0173, longitude: 105.7838 }   // Cau Giay / Nam Tu Liem
    const dist = haversineMeters(hanoiCenter, keangnam)
    // Roughly 7.4 km
    expect(dist).toBeGreaterThan(7000)
    expect(dist).toBeLessThan(8000)
  })

  it('radiusToBounds generates balanced bounding box around center', () => {
    const center = { latitude: 21.0285, longitude: 105.8542 }
    const bounds = radiusToBounds(center, 3)

    expect(bounds.north).toBeGreaterThan(center.latitude)
    expect(bounds.south).toBeLessThan(center.latitude)
    expect(bounds.east).toBeGreaterThan(center.longitude)
    expect(bounds.west).toBeLessThan(center.longitude)

    const midLat = (bounds.north + bounds.south) / 2
    const midLng = (bounds.east + bounds.west) / 2
    expect(midLat).toBeCloseTo(center.latitude, 5)
    expect(midLng).toBeCloseTo(center.longitude, 5)
  })

  it('padBounds pads bounds by specified ratio', () => {
    const original = { north: 22, south: 20, east: 106, west: 104 }
    const padded = padBounds(original, 0.25)

    expect(padded.north).toBe(22 + 2 * 0.25) // 22.5
    expect(padded.south).toBe(20 - 2 * 0.25) // 19.5
    expect(padded.east).toBe(106 + 2 * 0.25) // 106.5
    expect(padded.west).toBe(104 - 2 * 0.25) // 103.5
  })

  it('latLngToPixel converts coordinates deterministically', () => {
    const point = { latitude: 21.0285, longitude: 105.8542 }
    const p1 = latLngToPixel(point, 12)
    const p2 = latLngToPixel(point, 12)
    expect(p1.x).toBe(p2.x)
    expect(p1.y).toBe(p2.y)
    expect(p1.x).toBeGreaterThan(0)
    expect(p1.y).toBeGreaterThan(0)
  })
})

describe('zoomToResolution', () => {
  it('returns resolution 6 for zoom < 11', () => {
    expect(zoomToResolution(8)).toBe(6)
    expect(zoomToResolution(9)).toBe(6)
    expect(zoomToResolution(10)).toBe(6)
    expect(zoomToResolution(10.8)).toBe(6)
  })

  it('returns resolution 7 for zoom 11–12', () => {
    expect(zoomToResolution(11)).toBe(7)
    expect(zoomToResolution(12)).toBe(7)
    expect(zoomToResolution(12.9)).toBe(7)
  })

  it('returns resolution 8 for zoom >= 13, capped at 8', () => {
    expect(zoomToResolution(13)).toBe(8)
    expect(zoomToResolution(15)).toBe(8)
    expect(zoomToResolution(19)).toBe(8)
  })
})

describe('resolveTimeFilter', () => {
  const fixedNow = new Date('2026-10-26T12:00:00.000Z')

  it('resolves preset 3h, 1d, 7d, 30d correctly', () => {
    const range3h = resolveTimeFilter({ kind: 'preset', preset: '3h' }, fixedNow)
    expect(range3h.to).toBe(fixedNow.toISOString())
    expect(range3h.from).toBe(new Date(fixedNow.getTime() - 3 * 3600 * 1000).toISOString())

    const range1d = resolveTimeFilter({ kind: 'preset', preset: '1d' }, fixedNow)
    expect(range1d.from).toBe(new Date(fixedNow.getTime() - 24 * 3600 * 1000).toISOString())

    const range7d = resolveTimeFilter({ kind: 'preset', preset: '7d' }, fixedNow)
    expect(range7d.from).toBe(new Date(fixedNow.getTime() - 7 * 24 * 3600 * 1000).toISOString())
  })

  it('resolves date filter with Vietnam UTC+7 timezone bounds', () => {
    const range = resolveTimeFilter({ kind: 'date', date: '2026-09-23' }, fixedNow)
    expect(range.from).toBe('2026-09-23T00:00:00.000+07:00')
    expect(range.to).toBe('2026-09-23T23:59:59.999+07:00')
  })

  it('resolves all filter to empty range', () => {
    const range = resolveTimeFilter({ kind: 'all' }, fixedNow)
    expect(range).toEqual({})
  })
})

describe('formatRelativeVi', () => {
  const fixedNow = new Date('2026-10-26T12:00:00.000Z')

  it('returns "vừa xong" for < 60 seconds', () => {
    const recent = new Date(fixedNow.getTime() - 30 * 1000).toISOString()
    expect(formatRelativeVi(recent, fixedNow)).toBe('vừa xong')
  })

  it('returns "n phút trước" for < 60 minutes', () => {
    const tenMin = new Date(fixedNow.getTime() - 10 * 60 * 1000).toISOString()
    expect(formatRelativeVi(tenMin, fixedNow)).toBe('10 phút trước')
  })

  it('returns "n giờ trước" for < 24 hours', () => {
    const fourHours = new Date(fixedNow.getTime() - 4 * 3600 * 1000).toISOString()
    expect(formatRelativeVi(fourHours, fixedNow)).toBe('4 giờ trước')
  })

  it('returns "n ngày trước" for < 7 days', () => {
    const threeDays = new Date(fixedNow.getTime() - 3 * 24 * 3600 * 1000).toISOString()
    expect(formatRelativeVi(threeDays, fixedNow)).toBe('3 ngày trước')
  })

  it('returns "dd/MM/yyyy" for >= 7 days', () => {
    const eightDays = new Date(fixedNow.getTime() - 8 * 24 * 3600 * 1000).toISOString()
    const formatted = formatRelativeVi(eightDays, fixedNow)
    expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })
})
