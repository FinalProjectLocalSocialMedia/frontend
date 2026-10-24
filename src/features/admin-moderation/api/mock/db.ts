import { mockNow } from './clock'
import type { DbAuditLog, MockDb } from './db-types'
import { newId } from './ids'
import { createSeedDb } from './seed'
import type { AuditLog, Role, StaffRef, StaffRole, UserRef, Uuid } from '../../lib/types'

/** "Cơ sở dữ liệu" của mock: một đối tượng sống trong bộ nhớ, mất khi tải lại trang. */
export const mockDb: MockDb = createSeedDb()

/** Đặt lại về trạng thái seed ban đầu (dùng cho test). Giữ nguyên tham chiếu `mockDb`. */
export function resetMockDb() {
  Object.assign(mockDb, createSeedDb())
}

// ===== Truy vấn vai trò / tham chiếu =====

/** Vai trò suy ra từ bảng con (mục 4): admins → ADMIN, moderators → MODERATOR, còn lại NORMAL_USER. */
export function roleOf(userId: Uuid): Role | undefined {
  if (!mockDb.users.some((u) => u.id === userId)) return undefined
  if (mockDb.admins.some((a) => a.userId === userId)) return 'ADMIN'
  if (mockDb.moderators.some((m) => m.userId === userId)) return 'MODERATOR'
  return 'NORMAL_USER'
}

export function staffRefOf(userId: Uuid): StaffRef {
  const user = mockDb.users.find((u) => u.id === userId)
  const role = roleOf(userId)
  if (!user || (role !== 'ADMIN' && role !== 'MODERATOR')) {
    throw new Error(`Mock db: ${userId} không phải staff`)
  }
  return { id: user.id, email: user.email, role: role as StaffRole }
}

/** Người dùng thường: tên hiển thị = `normal_users.full_name` (D13). */
export function userRefOf(userId: Uuid): UserRef {
  const profile = mockDb.normalUsers.find((n) => n.userId === userId)
  const user = mockDb.users.find((u) => u.id === userId)
  return {
    id: userId,
    displayName: profile?.fullName ?? user?.email ?? 'Không xác định',
    avatarUrl: profile?.avatarUrl || undefined,
  }
}

/** Mọi tài khoản staff chưa bị xoá mềm (nhận thông báo `REPORT_CREATED`). */
export const staffUserIds = (): Uuid[] =>
  mockDb.users
    .filter((u) => !u.deletedAt)
    .filter(
      (u) =>
        mockDb.admins.some((a) => a.userId === u.id) ||
        mockDb.moderators.some((m) => m.userId === u.id),
    )
    .map((u) => u.id)

// ===== Audit =====

export const IP_PLACEHOLDER = '127.0.0.1'

/** Ghi một dòng `audit_logs`. Mock service của mọi module gọi hàm này cho thao tác ghi. */
export function appendAudit(entry: {
  actorId: Uuid
  action: string
  targetType: string
  targetId: string
  details?: Record<string, unknown>
}): DbAuditLog {
  const log: DbAuditLog = {
    id: newId(),
    userId: entry.actorId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    details: entry.details ?? {},
    ipAddress: IP_PLACEHOLDER,
    occurredAt: mockNow().toISOString(),
  }
  mockDb.auditLogs.push(log)
  return log
}

export const toAuditDto = (log: DbAuditLog): AuditLog => ({
  id: log.id,
  actor: staffRefOf(log.userId),
  action: log.action,
  targetType: log.targetType,
  targetId: log.targetId,
  details: log.details,
  ipAddress: log.ipAddress,
  occurredAt: log.occurredAt,
})
