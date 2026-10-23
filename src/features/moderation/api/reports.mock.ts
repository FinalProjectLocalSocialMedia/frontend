import {
  appendAudit,
  mockDb,
  roleOf,
  staffRefOf,
  toAuditDto,
  userRefOf,
} from '@/features/admin-moderation/api/mock/db'
import { mockNow } from '@/features/admin-moderation/api/mock/clock'
import { newId } from '@/features/admin-moderation/api/mock/ids'
import { mockDelay } from '@/features/admin-moderation/api/mock/latency'
import { paginate } from '@/features/admin-moderation/api/mock/paginate'
import {
  mockError,
  requirePermission,
} from '@/features/admin-moderation/api/mock/session'
import type { DbReport, DbSanction } from '@/features/admin-moderation/api/mock/db-types'
import type {
  AuditLog,
  CommentTarget,
  PostTarget,
  ReportListItem,
  ReportStatus,
  ReportTarget,
  ReportTargetType,
  SanctionRecord,
  UserRef,
  UserTarget,
  Uuid,
} from '@/features/admin-moderation/lib/types'
import type { ReportListParams, ReportsService } from './reports.service'

function buildTargetSummary(targetType: ReportTargetType, targetId: string) {
  if (targetType === 'POST') {
    const p = mockDb.posts.find((item) => item.id === targetId)
    if (!p) return {}
    const owner = userRefOf(p.authorId)
    const text = p.content.length > 200 ? p.content.slice(0, 200) + '...' : p.content
    return { text, owner }
  }
  if (targetType === 'COMMENT') {
    const c = mockDb.comments.find((item) => item.id === targetId)
    if (!c) return {}
    const owner = userRefOf(c.authorId)
    const text = c.content.length > 200 ? c.content.slice(0, 200) + '...' : c.content
    return { text, owner }
  }
  if (targetType === 'USER') {
    const u = mockDb.users.find((item) => item.id === targetId)
    if (!u) return {}
    const owner = userRefOf(u.id)
    return { text: owner.displayName, owner }
  }
  return {}
}

function toReportListItem(r: DbReport): ReportListItem {
  const pendingSame = mockDb.reports.filter(
    (other) =>
      other.status === 'PENDING' &&
      other.targetType === r.targetType &&
      other.targetId === r.targetId,
  ).length

  return {
    id: r.id,
    targetType: r.targetType,
    targetId: r.targetId,
    reason: r.reason,
    status: r.status,
    reportedAt: r.reportedAt,
    handledAt: r.handledAt,
    reporter: userRefOf(r.reporterId),
    targetSummary: buildTargetSummary(r.targetType, r.targetId),
    reportCount: pendingSame,
  }
}

export const mockReportsService: ReportsService = {
  async list(params: ReportListParams = {}, opts) {
    await mockDelay(opts?.signal)
    requirePermission('reports.read')

    let filtered = mockDb.reports.slice()

    // Lọc theo nhóm đối tượng: content (POST/COMMENT) vs user (USER)
    if (params.type === 'content') {
      filtered = filtered.filter(
        (r) => r.targetType === 'POST' || r.targetType === 'COMMENT',
      )
    } else if (params.type === 'user') {
      filtered = filtered.filter((r) => r.targetType === 'USER')
    }

    // Lọc theo trạng thái
    if (params.status) {
      filtered = filtered.filter((r) => r.status === params.status)
    }

    // Lọc theo lý do
    if (params.reason) {
      filtered = filtered.filter((r) => r.reason === params.reason)
    }

    // Tìm kiếm theo từ khoá
    if (params.q?.trim()) {
      const q = params.q.trim().toLowerCase()
      filtered = filtered.filter((r) => {
        if (r.targetId.toLowerCase().includes(q)) return true
        if (r.reason.toLowerCase().includes(q)) return true
        const summary = buildTargetSummary(r.targetType, r.targetId)
        if (summary.text?.toLowerCase().includes(q)) return true
        if (summary.owner?.displayName.toLowerCase().includes(q)) return true
        return false
      })
    }

    // Sắp xếp
    const sort = params.sort
    if (sort) {
      const [field, dir] = sort.split(':')
      const multiplier = dir === 'desc' ? -1 : 1
      filtered.sort((a, b) => {
        if (field === 'reportedAt') {
          return (
            (new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime()) *
            multiplier
          )
        }
        return 0
      })
    } else {
      // Mặc định: nếu lọc PENDING thì Cũ nhất trước (xử lý theo thứ tự đến - D14/mục 7.1), ngược lại mới nhất trước
      if (params.status === 'PENDING') {
        filtered.sort(
          (a, b) =>
            new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime(),
        )
      } else {
        filtered.sort(
          (a, b) =>
            new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime(),
        )
      }
    }

    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 10
    const paginated = paginate(filtered, page, pageSize)

    return {
      items: paginated.items.map(toReportListItem),
      page: paginated.page,
      pageSize: paginated.pageSize,
      total: paginated.total,
    }
  },

  async summary(opts) {
    await mockDelay(opts?.signal)
    requirePermission('reports.read')

    const contentReports = mockDb.reports.filter(
      (r) => r.targetType === 'POST' || r.targetType === 'COMMENT',
    )
    const userReports = mockDb.reports.filter((r) => r.targetType === 'USER')

    const countStatus = (list: DbReport[], status: ReportStatus) =>
      list.filter((r) => r.status === status).length

    const contentPending = countStatus(contentReports, 'PENDING')
    const userPending = countStatus(userReports, 'PENDING')

    return {
      content: {
        pending: contentPending,
        resolved: countStatus(contentReports, 'RESOLVED'),
        rejected: countStatus(contentReports, 'REJECTED'),
      },
      user: {
        pending: userPending,
        resolved: countStatus(userReports, 'RESOLVED'),
        rejected: countStatus(userReports, 'REJECTED'),
      },
      pendingTotal: contentPending + userPending,
    }
  },

  async get(id: Uuid, opts) {
    await mockDelay(opts?.signal)
    requirePermission('reports.read')

    const report = mockDb.reports.find((r) => r.id === id)
    if (!report) {
      throw mockError(404, 'Không tìm thấy báo cáo yêu cầu', 'REPORT_NOT_FOUND')
    }

    // Lấy các người báo cáo PENDING khác cùng đối tượng
    const otherReporters: UserRef[] = []
    const seenReporterIds = new Set<string>([report.reporterId])

    mockDb.reports
      .filter(
        (r) =>
          r.status === 'PENDING' &&
          r.targetType === report.targetType &&
          r.targetId === report.targetId &&
          r.id !== report.id,
      )
      .forEach((r) => {
        if (!seenReporterIds.has(r.reporterId)) {
          seenReporterIds.add(r.reporterId)
          otherReporters.push(userRefOf(r.reporterId))
        }
      })

    // Xây dựng target
    let target: ReportTarget
    let targetOwnerId: string

    if (report.targetType === 'POST') {
      const p = mockDb.posts.find((item) => item.id === report.targetId)
      if (!p) {
        throw mockError(404, 'Không tìm thấy bài viết được báo cáo', 'TARGET_NOT_FOUND')
      }
      targetOwnerId = p.authorId
      const authorUser = mockDb.users.find((u) => u.id === p.authorId)
      const loc = mockDb.locations.find((l) => l.id === p.locationId)!
      const tagIds = mockDb.postHashtags
        .filter((ph) => ph.postId === p.id)
        .map((ph) => ph.hashtagId)
      const hashtags = mockDb.hashtags
        .filter((h) => tagIds.includes(h.id))
        .map((h) => h.name)

      const postTarget: PostTarget = {
        type: 'POST',
        id: p.id,
        status: p.status,
        content: p.content,
        media: p.media,
        createdAt: p.createdAt,
        author: {
          ...userRefOf(p.authorId),
          status: authorUser?.status ?? 'ACTIVE',
        },
        location: {
          id: loc.id,
          name: loc.name,
          latitude: loc.coordinate.latitude,
          longitude: loc.coordinate.longitude,
        },
        hashtags,
        counts: {
          views: 340,
          likes: 42,
          comments: mockDb.comments.filter((c) => c.postId === p.id).length,
          shares: mockDb.posts.filter((sp) => sp.sharedPostId === p.id).length,
          saves: 15,
        },
        isShare: !!p.sharedPostId,
      }
      target = postTarget
    } else if (report.targetType === 'COMMENT') {
      const c = mockDb.comments.find((item) => item.id === report.targetId)
      if (!c) {
        throw mockError(404, 'Không tìm thấy bình luận được báo cáo', 'TARGET_NOT_FOUND')
      }
      targetOwnerId = c.authorId
      const authorUser = mockDb.users.find((u) => u.id === c.authorId)

      const commentTarget: CommentTarget = {
        type: 'COMMENT',
        id: c.id,
        status: c.status,
        postId: c.postId,
        content: c.content,
        media: c.media,
        createdAt: c.createdAt,
        author: {
          ...userRefOf(c.authorId),
          status: authorUser?.status ?? 'ACTIVE',
        },
        parentCommentId: c.parentCommentId,
      }
      target = commentTarget
    } else {
      const u = mockDb.users.find((item) => item.id === report.targetId)
      if (!u) {
        throw mockError(404, 'Không tìm thấy người dùng được báo cáo', 'TARGET_NOT_FOUND')
      }
      targetOwnerId = u.id
      const role = roleOf(u.id) ?? 'NORMAL_USER'
      const lockRecord = mockDb.sanctions.find(
        (s) => s.userId === u.id && s.type === 'LOCK' && !s.liftedAt,
      )

      const userTarget: UserTarget = {
        type: 'USER',
        user: {
          id: u.id,
          role,
          status: u.status,
          displayName: userRefOf(u.id).displayName,
          avatarUrl: userRefOf(u.id).avatarUrl,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          deletedAt: u.deletedAt,
          stats: {
            posts: mockDb.posts.filter((p) => p.authorId === u.id).length,
            reportsAgainst: mockDb.reports.filter(
              (r) => r.targetType === 'USER' && r.targetId === u.id,
            ).length,
            warnings: mockDb.sanctions.filter(
              (s) => s.userId === u.id && s.type === 'WARN',
            ).length,
          },
        },
        lock: lockRecord
          ? {
              sanctionId: lockRecord.id,
              reason: lockRecord.reason,
              lockedAt: lockRecord.issuedAt,
              lockedBy: staffRefOf(lockRecord.issuedBy),
            }
          : undefined,
        recentPosts: mockDb.posts
          .filter((p) => p.authorId === u.id)
          .slice(0, 3)
          .map((p) => ({
            id: p.id,
            content: p.content,
            createdAt: p.createdAt,
          })),
      }
      target = userTarget
    }

    // Lịch sử audit log liên quan tới báo cáo hoặc đối tượng
    const history: AuditLog[] = mockDb.auditLogs
      .filter(
        (a) =>
          a.targetId === report.id ||
          a.targetId === report.targetId ||
          (a.details &&
            (a.details.reportId === report.id || a.details.targetId === report.targetId)),
      )
      .map(toAuditDto)
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      )

    // Lịch sử chế tài của chủ đối tượng
    const sanctions: SanctionRecord[] = mockDb.sanctions
      .filter((s) => s.userId === targetOwnerId)
      .map((s: DbSanction) => ({
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
      }))
      .sort(
        (a, b) =>
          new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
      )

    let handledBy
    if (report.handleAdminId) handledBy = staffRefOf(report.handleAdminId)
    else if (report.handleModeratorId) handledBy = staffRefOf(report.handleModeratorId)

    return {
      ...toReportListItem(report),
      resolutionNote: report.resolutionNote,
      handledBy,
      otherReporters,
      target,
      history,
      sanctions,
    }
  },

  async resolve(id: Uuid, input, opts) {
    await mockDelay(opts?.signal)
    const session = requirePermission('reports.read')

    const report = mockDb.reports.find((r) => r.id === id)
    if (!report) {
      throw mockError(404, 'Không tìm thấy báo cáo yêu cầu', 'REPORT_NOT_FOUND')
    }

    if (report.status !== 'PENDING') {
      throw mockError(
        409,
        'Báo cáo này đã được xử lý bởi một nhân viên khác',
        'REPORT_ALREADY_HANDLED',
      )
    }

    const { actions } = input
    if (!actions || actions.length === 0) {
      throw mockError(422, 'Danh sách hành động không được để trống', 'VALIDATION_ERROR')
    }

    const hasReject = actions.includes('REJECT')
    if (hasReject && actions.length > 1) {
      throw mockError(
        422,
        'Hành động REJECT không thể kết hợp cùng các hành động kiểm duyệt khác',
        'INVALID_ACTION_COMBINATION',
      )
    }

    // Xác định chủ sở hữu nội dung / đối tượng
    let ownerId: string
    let post = null
    let comment = null

    if (report.targetType === 'POST') {
      post = mockDb.posts.find((p) => p.id === report.targetId)
      if (!post) throw mockError(404, 'Không tìm thấy bài viết', 'TARGET_NOT_FOUND')
      ownerId = post.authorId

      if (actions.includes('WARN_USER') || actions.includes('LOCK_USER')) {
        throw mockError(422, 'Hành động WARN_USER hoặc LOCK_USER chỉ áp dụng cho USER', 'ACTION_NOT_APPLICABLE')
      }
    } else if (report.targetType === 'COMMENT') {
      comment = mockDb.comments.find((c) => c.id === report.targetId)
      if (!comment) throw mockError(404, 'Không tìm thấy bình luận', 'TARGET_NOT_FOUND')
      ownerId = comment.authorId

      if (actions.includes('WARN_USER') || actions.includes('LOCK_USER')) {
        throw mockError(422, 'Hành động WARN_USER hoặc LOCK_USER chỉ áp dụng cho USER', 'ACTION_NOT_APPLICABLE')
      }
    } else {
      ownerId = report.targetId
      if (
        actions.includes('REMOVE_CONTENT') ||
        actions.includes('WARN_OWNER') ||
        actions.includes('LOCK_OWNER')
      ) {
        throw mockError(
          422,
          'Hành động REMOVE_CONTENT, WARN_OWNER hoặc LOCK_OWNER chỉ áp dụng cho nội dung',
          'ACTION_NOT_APPLICABLE',
        )
      }
    }

    // Chặn tự xử lý chính mình
    if (session.userId === ownerId) {
      throw mockError(
        403,
        'Không thể tự xử lý nội dung hoặc tài khoản của chính mình',
        'SELF_ACTION_NOT_ALLOWED',
      )
    }

    // Bảo vệ tài khoản STAFF
    const ownerRole = roleOf(ownerId)
    if (ownerRole === 'ADMIN') {
      throw mockError(403, 'Không được phép thao tác lên tài khoản ADMIN', 'TARGET_PROTECTED')
    }
    if (ownerRole === 'MODERATOR' && session.role !== 'ADMIN') {
      throw mockError(
        403,
        'Kiểm duyệt viên không có quyền thao tác lên tài khoản MODERATOR khác',
        'TARGET_PROTECTED',
      )
    }

    // Kiểm tra tính hợp lệ dữ liệu cảnh báo và khoá
    const hasWarn = actions.includes('WARN_OWNER') || actions.includes('WARN_USER')
    if (hasWarn) {
      if (!input.warning?.message?.trim()) {
        throw mockError(422, 'Thiếu nội dung cảnh báo cho hành động WARN', 'VALIDATION_ERROR')
      }
    }

    const hasLock = actions.includes('LOCK_OWNER') || actions.includes('LOCK_USER')
    if (hasLock) {
      if (!input.lock?.reason?.trim()) {
        throw mockError(422, 'Thiếu lý do khoá tài khoản cho hành động LOCK', 'VALIDATION_ERROR')
      }
      const ownerUser = mockDb.users.find((u) => u.id === ownerId)
      if (ownerUser?.status === 'LOCKED') {
        throw mockError(409, 'Tài khoản người dùng đã bị khoá trước đó', 'ACCOUNT_ALREADY_LOCKED')
      }
    }

    if (actions.includes('REMOVE_CONTENT')) {
      if (post && post.status === 'REMOVED') {
        throw mockError(409, 'Nội dung bài viết đã bị gỡ trước đó', 'CONTENT_ALREADY_REMOVED')
      }
      if (comment && comment.status === 'REMOVED') {
        throw mockError(409, 'Nội dung bình luận đã bị gỡ trước đó', 'CONTENT_ALREADY_REMOVED')
      }
    }

    // Thực hiện hiệu ứng
    const sanctionIds: Uuid[] = []
    const auditLogIds: Uuid[] = []

    // 1. Gỡ nội dung
    if (actions.includes('REMOVE_CONTENT')) {
      if (post) {
        post.status = 'REMOVED'
        post.updatedAt = mockNow().toISOString()
        const audit = appendAudit({
          actorId: session.userId,
          action: 'POST_REMOVED',
          targetType: 'POST',
          targetId: post.id,
          details: { reportId: id, authorId: ownerId },
        })
        auditLogIds.push(audit.id)
      } else if (comment) {
        comment.status = 'REMOVED'
        comment.updatedAt = mockNow().toISOString()
        const audit = appendAudit({
          actorId: session.userId,
          action: 'COMMENT_REMOVED',
          targetType: 'COMMENT',
          targetId: comment.id,
          details: { reportId: id, authorId: ownerId, postId: comment.postId },
        })
        auditLogIds.push(audit.id)
      }
    }

    // 2. Cảnh báo
    if (hasWarn) {
      const sanctionId = newId()
      const newSanction: DbSanction = {
        id: sanctionId,
        userId: ownerId,
        type: 'WARN',
        reason: input.warning!.message.trim(),
        reportId: id,
        issuedBy: session.userId,
        issuedAt: mockNow().toISOString(),
      }
      mockDb.sanctions.unshift(newSanction)
      sanctionIds.push(sanctionId)

      const audit = appendAudit({
        actorId: session.userId,
        action: 'USER_WARNED',
        targetType: 'USER',
        targetId: ownerId,
        details: { sanctionId, reportId: id, reason: newSanction.reason },
      })
      auditLogIds.push(audit.id)
    }

    // 3. Khoá tài khoản
    if (hasLock) {
      const sanctionId = newId()
      const newSanction: DbSanction = {
        id: sanctionId,
        userId: ownerId,
        type: 'LOCK',
        reason: input.lock!.reason.trim(),
        reportId: id,
        issuedBy: session.userId,
        issuedAt: mockNow().toISOString(),
      }
      mockDb.sanctions.unshift(newSanction)
      sanctionIds.push(sanctionId)

      const ownerUser = mockDb.users.find((u) => u.id === ownerId)
      if (ownerUser) {
        ownerUser.status = 'LOCKED'
        ownerUser.updatedAt = mockNow().toISOString()
      }

      const audit = appendAudit({
        actorId: session.userId,
        action: 'USER_LOCKED',
        targetType: 'USER',
        targetId: ownerId,
        details: { sanctionId, reportId: id, reason: newSanction.reason },
      })
      auditLogIds.push(audit.id)
    }

    // 4. Cập nhật TẤT CẢ các báo cáo PENDING cùng đối tượng
    const pendingSameReports = mockDb.reports.filter(
      (r) =>
        r.status === 'PENDING' &&
        r.targetType === report.targetType &&
        r.targetId === report.targetId,
    )

    const newStatus: ReportStatus = hasReject ? 'REJECTED' : 'RESOLVED'
    const handledAt = mockNow().toISOString()
    const isAdmin = session.role === 'ADMIN'

    pendingSameReports.forEach((r) => {
      r.status = newStatus
      r.handledAt = handledAt
      if (isAdmin) r.handleAdminId = session.userId
      else r.handleModeratorId = session.userId
      r.resolutionNote = input.resolutionNote?.trim()
    })

    // Audit log tổng
    const masterAction = hasReject ? 'REPORT_REJECTED' : 'REPORT_RESOLVED'
    const masterAudit = appendAudit({
      actorId: session.userId,
      action: masterAction,
      targetType: 'REPORT',
      targetId: id,
      details: {
        reportIds: pendingSameReports.map((r) => r.id),
        actions,
        resolutionNote: input.resolutionNote,
        targetType: report.targetType,
        targetId: report.targetId,
        ownerId,
        sanctionIds,
      },
    })
    auditLogIds.unshift(masterAudit.id)

    // 5. Gửi thông báo
    // A. Cho người báo cáo (cảm ơn)
    const distinctReporterIds = Array.from(
      new Set(pendingSameReports.map((r) => r.reporterId)),
    )
    distinctReporterIds.forEach((reporterId) => {
      mockDb.notifications.unshift({
        id: newId(),
        recipient: reporterId,
        type: 'REPORT_RESULT',
        content:
          'Cảm ơn bạn đã đóng góp báo cáo. Báo cáo của bạn đã được ban quản trị xem xét và xử lý.',
        referenceTargetId: id,
        isRead: false,
        createdAt: mockNow().toISOString(),
      })
    })

    // B. Cho chủ đối tượng (chỉ gửi khi RESOLVED)
    let ownerNotifCount = 0
    if (newStatus === 'RESOLVED') {
      if (hasWarn) {
        mockDb.notifications.unshift({
          id: newId(),
          recipient: ownerId,
          type: 'WARNING',
          content: input.warning!.message.trim(),
          referenceTargetId: id,
          isRead: false,
          createdAt: mockNow().toISOString(),
        })
        ownerNotifCount++
      } else if (actions.includes('REMOVE_CONTENT')) {
        mockDb.notifications.unshift({
          id: newId(),
          recipient: ownerId,
          type: 'WARNING',
          content: 'Nội dung của bạn đã bị gỡ bỏ do vi phạm tiêu chuẩn cộng đồng.',
          referenceTargetId: id,
          isRead: false,
          createdAt: mockNow().toISOString(),
        })
        ownerNotifCount++
      }

      if (hasLock) {
        mockDb.notifications.unshift({
          id: newId(),
          recipient: ownerId,
          type: 'ACCOUNT_LOCKED',
          content: `Tài khoản của bạn đã bị khoá do vi phạm tiêu chuẩn cộng đồng. Lý do: ${input.lock!.reason.trim()}`,
          referenceTargetId: id,
          isRead: false,
          createdAt: mockNow().toISOString(),
        })
        ownerNotifCount++
      }
    }

    return {
      reports: pendingSameReports.map(toReportListItem),
      resolvedCount: pendingSameReports.length,
      notifications: {
        reporters: distinctReporterIds.length,
        owner: ownerNotifCount,
      },
      auditLogIds,
    }
  },
}
