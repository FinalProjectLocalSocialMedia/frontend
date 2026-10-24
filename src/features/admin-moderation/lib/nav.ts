import {
  Flame,
  LayoutDashboard,
  MapPin,
  FileText,
  ScrollText,
  Settings,
  ShieldAlert,
  UserX,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Permission } from '../auth/permissions'
import { defaultRouteForRole, roleHasPermission } from '../auth/permissions'
import { ADMIN_BASE } from './constants'
import type { Role } from './types'

/** Mục điều hướng của sidebar admin. `to` là đường dẫn tương đối so với `ADMIN_BASE`. */
export type AdminNavItem = {
  to: string
  label: string
  icon: LucideIcon
  /** Thiếu quyền → mục KHÔNG được render (mục 5.6). */
  permission: Permission
  /** Hiển thị badge số báo cáo `PENDING`. */
  badge?: 'pendingReports'
}

export type AdminNavGroup = { label: string; items: AdminNavItem[] }

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: 'Kiểm duyệt',
    items: [
      {
        to: 'reports',
        label: 'Báo cáo',
        icon: ShieldAlert,
        permission: 'reports.read',
        badge: 'pendingReports',
      },
      {
        to: 'accounts',
        label: 'Tài khoản vi phạm',
        icon: UserX,
        permission: 'accounts.read.flagged',
      },
    ],
  },
  {
    label: 'Quản trị',
    items: [
      {
        to: 'dashboard',
        label: 'Tổng quan',
        icon: LayoutDashboard,
        permission: 'content.analytics',
      },
      { to: 'users', label: 'Người dùng', icon: Users, permission: 'users.read' },
      { to: 'content', label: 'Nội dung', icon: FileText, permission: 'content.analytics' },
      { to: 'locations', label: 'Địa điểm', icon: MapPin, permission: 'locations.manage' },
      { to: 'heatmap', label: 'Bản đồ nhiệt', icon: Flame, permission: 'heatmap.view' },
      { to: 'settings', label: 'Cấu hình', icon: Settings, permission: 'settings.manage' },
      { to: 'audit-log', label: 'Nhật ký audit', icon: ScrollText, permission: 'audit.read' },
    ],
  },
]

/**
 * Đường dẫn đích sau đăng nhập: quay lại `from` nếu nó thuộc `/admin` và role có quyền
 * với mục tương ứng; ngược lại về trang mặc định của role.
 */
export function resolveAdminRedirect(from: string | undefined, role: Role): string {
  const fallback = `${ADMIN_BASE}/${defaultRouteForRole(role)}`
  if (!from || !from.startsWith(`${ADMIN_BASE}/`)) return fallback
  if (from.startsWith(`${ADMIN_BASE}/login`)) return fallback
  const segment = from.slice(ADMIN_BASE.length + 1).split(/[/?#]/)[0]
  const item = ADMIN_NAV.flatMap((g) => g.items).find((i) => i.to === segment)
  if (item && !roleHasPermission(role, item.permission)) return fallback
  return from
}

/** Nhãn breadcrumb cho từng đoạn đường dẫn; đoạn lạ (id) được rút gọn tự động. */
export const BREADCRUMB_LABELS: Record<string, string> = {
  reports: 'Báo cáo',
  content: 'Nội dung',
  users: 'Người dùng',
  accounts: 'Tài khoản vi phạm',
  dashboard: 'Tổng quan',
  locations: 'Địa điểm',
  heatmap: 'Bản đồ nhiệt',
  settings: 'Cấu hình',
  'audit-log': 'Nhật ký audit',
  notifications: 'Thông báo',
  login: 'Đăng nhập',
  '403': 'Không đủ quyền',
}
