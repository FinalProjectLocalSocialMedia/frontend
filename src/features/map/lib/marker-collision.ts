import { latLngToPixel } from '@/components/map/geo'
import type { GeoPoint } from './types'

export type CollisionBox = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Kiểm tra xem hai hình hộp bao quanh điểm ảnh (pixel bounding box) có giao nhau hay không.
 */
export function isBoxesColliding(a: CollisionBox, b: CollisionBox, padding = 4): boolean {
  return !(
    a.maxX + padding < b.minX ||
    a.minX - padding > b.maxX ||
    a.maxY + padding < b.minY ||
    a.minY - padding > b.maxY
  )
}

/**
 * Thuật toán loại bỏ chồng lấn marker tham lam (Greedy Collision Deduplication):
 * - Đầu vào: Danh sách items đã được sắp xếp theo mức độ ưu tiên (ví dụ trendScore hoặc postCount giảm dần)
 * - Chuyển toạ độ kinh/vĩ sang toạ độ điểm ảnh Web Mercator ở mức zoom hiện tại
 * - Duyệt lần lượt từng marker: giữ lại nếu không đè lên bất kỳ marker nào đã chọn trước đó
 */
export function deduplicateMarkersByCollision<T>(
  items: T[],
  getPosition: (item: T) => GeoPoint,
  getDimensions: (item: T) => { width: number; height: number },
  zoom: number,
  padding = 6,
): T[] {
  const chosenItems: T[] = []
  const chosenBoxes: CollisionBox[] = []

  for (const item of items) {
    const pos = getPosition(item)
    const { width, height } = getDimensions(item)
    const pixel = latLngToPixel(pos, zoom)

    // Tạo hộp bao quanh vị trí marker với điểm neo ở giữa đáy (anchor center-bottom)
    const box: CollisionBox = {
      minX: pixel.x - width / 2,
      maxX: pixel.x + width / 2,
      minY: pixel.y - height,
      maxY: pixel.y,
    }

    let hasCollision = false
    for (const chosenBox of chosenBoxes) {
      if (isBoxesColliding(box, chosenBox, padding)) {
        hasCollision = true
        break
      }
    }

    if (!hasCollision) {
      chosenItems.push(item)
      chosenBoxes.push(box)
    }
  }

  return chosenItems
}
