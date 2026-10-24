import { REPORT_REASONS } from './constants'
import type {
  AuditAction,
  NotificationType,
  PostStatus,
  ReportStatus,
  ReportTargetType,
  Role,
  SanctionType,
  UserStatus,
} from './types'

/** Nhãn hiển thị tiếng Việt cho toàn bộ giao diện admin (D6). */

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  MODERATOR: 'Kiểm duyệt viên',
  NORMAL_USER: 'Người dùng',
  USER: 'Người dùng',
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  LOCKED: 'Đang bị khoá',
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: 'Chờ xử lý',
  RESOLVED: 'Đã xử lý',
  REJECTED: 'Đã bác bỏ',
}

export const REPORT_TARGET_LABELS: Record<ReportTargetType, string> = {
  POST: 'Bài viết',
  COMMENT: 'Bình luận',
  USER: 'Người dùng',
}

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  ACTIVE: 'Đang hiển thị',
  REMOVED: 'Đã gỡ',
}

export const SANCTION_TYPE_LABELS: Record<SanctionType, string> = {
  WARN: 'Cảnh báo',
  LOCK: 'Khoá tài khoản',
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  LIKE: 'Lượt thích',
  COMMENT: 'Bình luận',
  FOLLOW: 'Theo dõi',
  CHAT: 'Tin nhắn',
  REPORT_RESULT: 'Kết quả báo cáo',
  WARNING: 'Cảnh báo',
  ACCOUNT_LOCKED: 'Tài khoản bị khoá',
  REPORT_CREATED: 'Báo cáo mới',
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  REPORT_RESOLVED: 'Xử lý báo cáo',
  REPORT_REJECTED: 'Bác bỏ báo cáo',
  POST_REMOVED: 'Gỡ bài viết',
  COMMENT_REMOVED: 'Gỡ bình luận',
  USER_WARNED: 'Cảnh báo người dùng',
  USER_LOCKED: 'Khoá tài khoản',
  USER_UNLOCKED: 'Mở khoá tài khoản',
  USER_CREATED: 'Tạo người dùng',
  USER_UPDATED: 'Cập nhật người dùng',
  USER_DELETED: 'Xoá người dùng',
  CONFIG_UPDATED: 'Cập nhật cấu hình',
  LOCATION_CREATED: 'Thêm địa điểm',
  LOCATION_UPDATED: 'Sửa địa điểm',
  LOCATION_DELETED: 'Xoá địa điểm',
}

/** Hành động lạ (backend thêm sau) hiển thị nguyên văn. */
export const auditActionLabel = (action: AuditAction) => AUDIT_ACTION_LABELS[action] ?? action

/** Lý do báo cáo: có trong bảng thì dùng nhãn, không thì hiển thị nguyên văn. */
export const reasonLabel = (reason: string) => REPORT_REASONS[reason] ?? reason

/** Chữ cái đầu cho avatar fallback. */
export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}
