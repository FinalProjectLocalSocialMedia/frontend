import { describe, expect, it } from 'vitest'
import { deduplicateMarkersByCollision, isBoxesColliding } from './marker-collision'

describe('Thuật toán loại bỏ chồng lấn marker (marker-collision)', () => {
  it('isBoxesColliding phát hiện chính xác khi hai hộp va chạm', () => {
    const boxA = { minX: 10, maxX: 50, minY: 10, maxY: 30 }
    const boxB = { minX: 45, maxX: 80, minY: 20, maxY: 40 }
    const boxFar = { minX: 100, maxX: 150, minY: 100, maxY: 120 }

    expect(isBoxesColliding(boxA, boxB)).toBe(true)
    expect(isBoxesColliding(boxA, boxFar)).toBe(false)
  })

  it('deduplicateMarkersByCollision loại bỏ marker có toạ độ quá gần nhau', () => {
    // 3 địa điểm: hai điểm đầu rất gần nhau, điểm thứ ba ở xa
    const items = [
      { id: '1', pos: { latitude: 21.0372, longitude: 105.7828 }, label: 'ĐH Quốc Gia' },
      { id: '2', pos: { latitude: 21.0366, longitude: 105.7836 }, label: 'ĐH Sư Phạm' }, // Rất gần ĐH Quốc Gia
      { id: '3', pos: { latitude: 21.0285, longitude: 105.8542 }, label: 'Hồ Gươm' },    // Ở xa
    ]

    const filtered = deduplicateMarkersByCollision(
      items,
      (it) => it.pos,
      (it) => ({ width: it.label.length * 8 + 30, height: 28 }),
      13, // Mức zoom 13
    )

    // Điểm 1 và Điểm 3 được chọn, Điểm 2 bị loại vì va chạm với Điểm 1
    expect(filtered.length).toBe(2)
    expect(filtered[0].id).toBe('1')
    expect(filtered[1].id).toBe('3')
  })
})
