import type { AuditService } from './audit.service'
import { mockDb, toAuditDto } from './mock/db'
import { mockDelay } from './mock/latency'
import { paginate } from './mock/paginate'
import { requirePermission } from './mock/session'

export const mockAuditService: AuditService = {
  async list(p = {}, o) {
    await mockDelay(o?.signal)
    requirePermission('audit.read')
    const items = mockDb.auditLogs
      .filter((l) => (p.actorId ? l.userId === p.actorId : true))
      .filter((l) => (p.action ? l.action === p.action : true))
      .filter((l) => (p.from ? l.occurredAt >= p.from : true))
      .filter((l) => (p.to ? l.occurredAt <= p.to : true))
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .map(toAuditDto)
    return paginate(items, p.page, p.pageSize)
  },
}
