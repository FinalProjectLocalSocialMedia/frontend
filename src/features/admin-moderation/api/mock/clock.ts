/**
 * Đồng hồ của mock. Dữ liệu seed luôn neo vào `SEED_NOW` (cố định) để kết quả xác định;
 * các bản ghi tạo lúc chạy dùng `mockNow()`.
 */
export const SEED_NOW = '2026-10-19T09:00:00.000Z'

let override: Date | null = null

/** Thời điểm hiện tại của "server" mock. Test có thể cố định bằng `setMockNow`. */
export const mockNow = () => (override ? new Date(override) : new Date())

export const setMockNow = (date: Date | null) => {
  override = date
}

/** ISO string của "n phút trước" tính từ mốc seed. Chỉ dùng khi seed. */
export const minutesAgo = (minutes: number) =>
  new Date(Date.parse(SEED_NOW) - minutes * 60_000).toISOString()

export const hoursAgo = (hours: number) => minutesAgo(hours * 60)
export const daysAgo = (days: number) => minutesAgo(days * 24 * 60)
