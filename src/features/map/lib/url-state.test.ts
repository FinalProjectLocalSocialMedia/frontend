import { describe, expect, it, beforeEach } from 'vitest'
import {
  parseMapUrlParams,
  readLastViewFromStorage,
  serializeMapUrlParams,
  writeLastViewToStorage,
} from './url-state'

describe('url-state parsing and serialization', () => {
  it('parses valid map URL search parameters correctly', () => {
    const params = new URLSearchParams('lat=21.03620&lng=105.79060&z=14&r=5&src=picked&w=30d&q=Hanoi&place=plc-1')
    const parsed = parseMapUrlParams(params)

    expect(parsed.center).toEqual({ latitude: 21.0362, longitude: 105.7906 })
    expect(parsed.zoom).toBe(14)
    expect(parsed.radiusKm).toBe(5)
    expect(parsed.source).toBe('PICKED')
    expect(parsed.window).toBe('30d')
    expect(parsed.searchQuery).toBe('Hanoi')
    expect(parsed.placeId).toBe('plc-1')
  })

  it('safely handles missing or invalid parameters', () => {
    const params = new URLSearchParams('lat=invalid&r=99&src=unknown&w=invalid')
    const parsed = parseMapUrlParams(params)

    expect(parsed.center).toBeUndefined()
    expect(parsed.radiusKm).toBeUndefined()
    expect(parsed.source).toBeUndefined()
    expect(parsed.window).toBeUndefined()
  })

  it('clamps zoom within valid bounds', () => {
    const lowParams = new URLSearchParams('z=3')
    expect(parseMapUrlParams(lowParams).zoom).toBe(9) // MIN_ZOOM

    const highParams = new URLSearchParams('z=25')
    expect(parseMapUrlParams(highParams).zoom).toBe(19) // MAX_ZOOM
  })

  it('serializes updates without erasing unrelated existing parameters', () => {
    const initial = new URLSearchParams('foo=bar&lat=21.00000&lng=105.00000&r=3')
    const updated = serializeMapUrlParams(
      {
        center: { latitude: 21.036234, longitude: 105.790567 },
        radiusKm: 10,
        source: 'GPS',
      },
      initial,
    )

    expect(updated.get('foo')).toBe('bar')
    expect(updated.get('lat')).toBe('21.03623')
    expect(updated.get('lng')).toBe('105.79057')
    expect(updated.get('r')).toBe('10')
    expect(updated.get('src')).toBe('gps')
  })

  it('properly adds and removes place and search query parameters', () => {
    const base = new URLSearchParams('place=plc-1&q=cafe')

    const removed = serializeMapUrlParams({ placeId: null as unknown as string, searchQuery: '' }, base)
    expect(removed.has('place')).toBe(false)
    expect(removed.has('q')).toBe(false)

    const added = serializeMapUrlParams({ placeId: 'plc-2', searchQuery: 'university' }, base)
    expect(added.get('place')).toBe('plc-2')
    expect(added.get('q')).toBe('university')
  })
})

describe('localStorage lastView persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('writes and reads lastView correctly', () => {
    const view = {
      center: { latitude: 21.0285, longitude: 105.8542 },
      zoom: 13,
      radiusKm: 5 as const,
      source: 'PICKED' as const,
    }

    writeLastViewToStorage(view)
    const read = readLastViewFromStorage()

    expect(read).not.toBeNull()
    expect(read?.center).toEqual(view.center)
    expect(read?.zoom).toBe(13)
    expect(read?.radiusKm).toBe(5)
    expect(read?.source).toBe('PICKED')
  })

  it('returns null when storage is empty or corrupted', () => {
    expect(readLastViewFromStorage()).toBeNull()

    window.localStorage.setItem('nearby_map_last_view', 'invalid-json')
    expect(readLastViewFromStorage()).toBeNull()
  })
})
