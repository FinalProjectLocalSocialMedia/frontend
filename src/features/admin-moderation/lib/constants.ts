/** Tiền tố route của khu vực quản trị (D1). */
export const ADMIN_BASE = '/admin'

/** Khoá sessionStorage lưu phiên đăng nhập admin (mục 5.5). */
export const ADMIN_SESSION_KEY = 'nearby-admin-session'

/** `VITE_USE_MOCK=false` mới gọi API thật; mặc định chạy mock (mục 5.4). */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

/** Độ dài tối đa theo cột DB varchar(255) (reports.resolution_note, notifications.content, ...). */
export const TEXT_MAX_LENGTH = 255

/** Số ký tự hiển thị của nội dung bài viết trong bảng; bài viết là TEXT có thể rất dài (S10). */
export const POST_PREVIEW_CHARS = 140

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

/**
 * Lý do báo cáo. `reports.reason` là text tự do nên đây chỉ là bảng ánh xạ để hiển thị:
 * chuỗi không có trong bảng được hiển thị nguyên văn.
 */
export const REPORT_REASONS: Record<string, string> = {
  SPAM: 'Spam / quảng cáo',
  HARASSMENT: 'Quấy rối / bắt nạt',
  HATE_SPEECH: 'Ngôn từ thù ghét',
  VIOLENCE: 'Bạo lực',
  SEXUAL_CONTENT: 'Nội dung nhạy cảm',
  MISINFORMATION: 'Thông tin sai lệch',
  FAKE_ACCOUNT: 'Tài khoản giả mạo',
  OTHER: 'Khác',
}
