import {
  appendAudit,
  mockDb,
  roleOf,
  staffRefOf,
} from '@/features/admin-moderation/api/mock/db'
import { mockNow } from '@/features/admin-moderation/api/mock/clock'
import { newId } from '@/features/admin-moderation/api/mock/ids'
import { mockDelay } from '@/features/admin-moderation/api/mock/latency'
import { paginate } from '@/features/admin-moderation/api/mock/paginate'
import {
  mockError,
  requirePermission,
} from '@/features/admin-moderation/api/mock/session'
import type { DbSanction } from '@/features/admin-moderation/api/mock/db-types'
import type {
  FlaggedAccount,
  FlaggedAccountsParams,
  LockInfo,
  LockUserInput,
  Paginated,
  RequestOptions,
  SanctionRecord,
  UnlockUserInput,
  Uuid,
  WarnUserInput,
} from '@/features/admin-moderation/lib/types'
import type { AccountsService } from './accounts.service'

function toSanctionRecord(s: DbSanction): SanctionRecord {
  return {
    id: s.id,
    userId: s.userId,
    type: s.type,
    reason: s.reason,
    reportId: s.reportId,
    issuedBy: staffRefOf(s.issuedBy),
    issuedAt: s.issuedAt,
    liftedAt: s.liftedAt,
    liftedBy: s.liftedBy ? staffRefOf(s.liftedBy) : undefined,
    liftNote: s.liftNote,
  }
}

function checkTargetProtection(actorId: Uuid, targetUserId: Uuid) {
  // Không được tự thao tác lên chính mình
  if (actorId === targetUserId) {
    throw mockError(
      403,
      'Không thể tự thực hiện thao tác cảnh báo, khoá hoặc mở khoá tài khoản của chính mình',
      'SELF_ACTION_NOT_ALLOWED'
    )
  }

  const actorRole = roleOf(actorId)
  const targetRole = roleOf(targetUserId)

  // Không ai được xử phạt ADMIN
  if (targetRole === 'ADMIN') {
    throw mockError(
      403,
      'Không thể thực hiện thao tác xử phạt đối với tài khoản Quản trị viên (ADMIN)',
      'TARGET_PROTECTED'
    )
  }

  // MODERATOR không được xử phạt MODERATOR khác
  if (targetRole === 'MODERATOR' && actorRole !== 'ADMIN') {
    throw mockError(
      403,
      'Kiểm duyệt viên không được phép xử phạt tài khoản Kiểm duyệt viên khác',
      'TARGET_PROTECTED'
    )
  }
}

export const mockAccountsService: AccountsService = {
  async getFlaggedAccounts(
    params: FlaggedAccountsParams = {},
    opts?: RequestOptions
  ): Promise<Paginated<FlaggedAccount>> {
    await mockDelay(opts?.signal)
    requirePermission('accounts.read.flagged')

    // Lấy mọi người dùng bình thường (chưa xoá)
    const normalUsers = mockDb.users.filter(
      (u) => !u.deletedAt && !mockDb.admins.some((a) => a.userId === u.id)
    )

    const items: FlaggedAccount[] = []

    for (const u of normalUsers) {
      const profile = mockDb.normalUsers.find((n) => n.userId === u.id)

      // Các báo cáo nhắm vào chính user này
      const directReports = mockDb.reports.filter(
        (r) => r.targetType === 'USER' && r.targetId === u.id
      )

      // Các báo cáo nhắm vào bài viết của user này
      const userPostIds = new Set(
        mockDb.posts.filter((p) => p.authorId === u.id).map((p) => p.id)
      )
      const postReports = mockDb.reports.filter(
        (r) => r.targetType === 'POST' && userPostIds.has(r.targetId)
      )

      // Các báo cáo nhắm vào bình luận của user này
      const userCommentIds = new Set(
        mockDb.comments.filter((c) => c.authorId === u.id).map((c) => c.id)
      )
      const commentReports = mockDb.reports.filter(
        (r) => r.targetType === 'COMMENT' && userCommentIds.has(r.targetId)
      )

      const allReports = [...directReports, ...postReports, ...commentReports]
      const pendingCount = allReports.filter((r) => r.status === 'PENDING').length
      const totalReports = allReports.length

      const userSanctions = mockDb.sanctions.filter((s) => s.userId === u.id)
      const warningCount = userSanctions.filter((s) => s.type === 'WARN').length

      // Tìm active lock
      const activeLockSanction = userSanctions.find(
        (s) => s.type === 'LOCK' && !s.liftedAt
      )

      let lockInfo: LockInfo | undefined
      if (activeLockSanction) {
        lockInfo = {
          sanctionId: activeLockSanction.id,
          reason: activeLockSanction.reason,
          lockedAt: activeLockSanction.issuedAt,
          lockedBy: staffRefOf(activeLockSanction.issuedBy),
        }
      }

      // Điều kiện xuất hiện: có báo cáo pending HOẶC có ít nhất 1 sanction HOẶC đang bị khoá
      const isFlagged =
        pendingCount > 0 || userSanctions.length > 0 || u.status === 'LOCKED'

      if (isFlagged) {
        items.push({
          user: {
            id: u.id,
            displayName: profile?.fullName ?? u.email,
            avatarUrl: profile?.avatarUrl || undefined,
            status: u.status,
            role: roleOf(u.id),
            email: u.email,
          },
          pendingReports: pendingCount,
          totalReports,
          warnings: warningCount,
          lock: lockInfo,
          lastActivityAt: u.updatedAt,
        })
      }
    }

    let filtered = items

    // Lọc theo trạng thái
    if (params.status) {
      filtered = filtered.filter((item) => item.user.status === params.status)
    }

    // Tìm kiếm theo tên, email, id
    if (params.q) {
      const kw = params.q.trim().toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.user.displayName.toLowerCase().includes(kw) ||
          (item.user.email && item.user.email.toLowerCase().includes(kw)) ||
          item.user.id.toLowerCase().includes(kw)
      )
    }

    // Sắp xếp
    if (params.sort) {
      const [field, direction] = params.sort.split(':')
      const dir = direction === 'asc' ? 1 : -1

      filtered.sort((a, b) => {
        if (field === 'pendingReports') {
          return (a.pendingReports - b.pendingReports) * dir
        }
        if (field === 'warnings') {
          return (a.warnings - b.warnings) * dir
        }
        if (field === 'totalReports') {
          return (a.totalReports - b.totalReports) * dir
        }
        if (field === 'lastActivityAt') {
          return (
            (new Date(a.lastActivityAt).getTime() -
              new Date(b.lastActivityAt).getTime()) *
            dir
          )
        }
        return 0
      })
    } else {
      // Mặc định: ưu tiên pendingReports giảm dần, sau đó đến warnings giảm dần
      filtered.sort((a, b) => {
        if (b.pendingReports !== a.pendingReports) {
          return b.pendingReports - a.pendingReports
        }
        return b.warnings - a.warnings
      })
    }

    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 10
    return paginate(filtered, page, pageSize)
  },

  async getUserSanctions(
    userId: Uuid,
    opts?: RequestOptions
  ): Promise<SanctionRecord[]> {
    await mockDelay(opts?.signal)
    requirePermission('accounts.read.flagged')

    const user = mockDb.users.find((u) => u.id === userId)
    if (!user) {
      throw mockError(404, 'Không tìm thấy người dùng', 'USER_NOT_FOUND')
    }

    const sanctions = mockDb.sanctions
      .filter((s) => s.userId === userId)
      .map(toSanctionRecord)
      .sort(
        (a, b) =>
          new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
      )

    return sanctions
  },

  async warnUser(
    userId: Uuid,
    input: WarnUserInput,
    opts?: RequestOptions
  ): Promise<SanctionRecord> {
    await mockDelay(opts?.signal)
    const session = requirePermission('users.warn')

    const targetUser = mockDb.users.find((u) => u.id === userId)
    if (!targetUser || targetUser.deletedAt) {
      throw mockError(404, 'Không tìm thấy người dùng', 'USER_NOT_FOUND')
    }

    checkTargetProtection(session.userId, userId)

    const message = input.message?.trim()
    if (!message) {
      throw mockError(422, 'Nội dung cảnh báo không được để trống', 'VALIDATION_ERROR')
    }

    const sanction: DbSanction = {
      id: newId(),
      userId,
      type: 'WARN',
      reason: message,
      issuedBy: session.userId,
      issuedAt: mockNow().toISOString(),
    }
    mockDb.sanctions.push(sanction)

    // Ghi audit log
    appendAudit({
      actorId: session.userId,
      action: 'USER_WARNED',
      targetType: 'USER',
      targetId: userId,
      details: { sanctionId: sanction.id, reason: message },
    })

    // Thông báo cho người dùng
    mockDb.notifications.push({
      id: newId(),
      recipient: userId,
      type: 'WARNING',
      content: message,
      referenceTargetId: sanction.id,
      isRead: false,
      createdAt: mockNow().toISOString(),
    })

    return toSanctionRecord(sanction)
  },

  async lockUser(
    userId: Uuid,
    input: LockUserInput,
    opts?: RequestOptions
  ): Promise<SanctionRecord> {
    await mockDelay(opts?.signal)
    const session = requirePermission('users.lock')

    const targetUser = mockDb.users.find((u) => u.id === userId)
    if (!targetUser || targetUser.deletedAt) {
      throw mockError(404, 'Không tìm thấy người dùng', 'USER_NOT_FOUND')
    }

    checkTargetProtection(session.userId, userId)

    const activeLock = mockDb.sanctions.find(
      (s) => s.userId === userId && s.type === 'LOCK' && !s.liftedAt
    )
    if (targetUser.status === 'LOCKED' || activeLock) {
      throw mockError(
        409,
        'Tài khoản người dùng đã bị khoá từ trước',
        'ACCOUNT_ALREADY_LOCKED'
      )
    }

    const reason = input.reason?.trim()
    if (!reason) {
      throw mockError(422, 'Lý do khoá không được để trống', 'VALIDATION_ERROR')
    }

    const sanction: DbSanction = {
      id: newId(),
      userId,
      type: 'LOCK',
      reason,
      issuedBy: session.userId,
      issuedAt: mockNow().toISOString(),
    }
    mockDb.sanctions.push(sanction)

    // Trigger đồng bộ users.status
    targetUser.status = 'LOCKED'
    targetUser.updatedAt = mockNow().toISOString()

    // Ghi audit log
    appendAudit({
      actorId: session.userId,
      action: 'USER_LOCKED',
      targetType: 'USER',
      targetId: userId,
      details: { sanctionId: sanction.id, reason },
    })

    // Thông báo cho người dùng
    mockDb.notifications.push({
      id: newId(),
      recipient: userId,
      type: 'ACCOUNT_LOCKED',
      content: `Tài khoản của bạn đã bị khoá. Lý do: ${reason}`,
      referenceTargetId: sanction.id,
      isRead: false,
      createdAt: mockNow().toISOString(),
    })

    return toSanctionRecord(sanction)
  },

  async unlockUser(
    userId: Uuid,
    input: UnlockUserInput,
    opts?: RequestOptions
  ): Promise<SanctionRecord> {
    await mockDelay(opts?.signal)
    const session = requirePermission('users.unlock')

    const targetUser = mockDb.users.find((u) => u.id === userId)
    if (!targetUser || targetUser.deletedAt) {
      throw mockError(404, 'Không tìm thấy người dùng', 'USER_NOT_FOUND')
    }

    checkTargetProtection(session.userId, userId)

    const activeLock = mockDb.sanctions.find(
      (s) => s.userId === userId && s.type === 'LOCK' && !s.liftedAt
    )
    if (!activeLock) {
      throw mockError(
        409,
        'Tài khoản người dùng hiện không ở trạng thái bị khoá',
        'ACCOUNT_NOT_LOCKED'
      )
    }

    const note = input.note?.trim() || undefined
    activeLock.liftedAt = mockNow().toISOString()
    activeLock.liftedBy = session.userId
    activeLock.liftNote = note

    // Trigger đồng bộ users.status
    targetUser.status = 'ACTIVE'
    targetUser.updatedAt = mockNow().toISOString()

    // Ghi audit log
    appendAudit({
      actorId: session.userId,
      action: 'USER_UNLOCKED',
      targetType: 'USER',
      targetId: userId,
      details: { sanctionId: activeLock.id, note },
    })

    return toSanctionRecord(activeLock)
  },
}
