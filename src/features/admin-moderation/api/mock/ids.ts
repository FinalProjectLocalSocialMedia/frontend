import type { Uuid } from '../../lib/types'

/** Nhóm id cho từng bảng — giúp đọc id trong debug biết nó thuộc bảng nào. */
export const ID_KIND = {
  user: 1,
  location: 2,
  hashtag: 3,
  post: 4,
  comment: 5,
  report: 6,
  sanction: 7,
  notification: 8,
  audit: 9,
} as const

const hex = (value: number, width: number) => value.toString(16).padStart(width, '0')

/** Id xác định dạng UUID v4 cho dữ liệu seed (không dùng random). */
export const seedId = (kind: number, n: number): Uuid =>
  `${hex(kind, 8)}-0000-4000-8000-${hex(n, 12)}`

/** Id cho bản ghi tạo lúc chạy. */
export const newId = (): Uuid => crypto.randomUUID()

/** PRNG có seed (mulberry32) — dùng cho độ trễ mock để hành vi lặp lại được. */
export function createPrng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
