import { adminHttp } from './http-client'
import type { AuditService } from './audit.service'
import type { AuditLog, Paginated } from '../lib/types'

/** `GET /admin/audit-logs?actor&action&from&to&page&pageSize` (mục 10.1). */
export const httpAuditService: AuditService = {
  list: (p, o) =>
    adminHttp
      .get<Paginated<AuditLog>>('/audit-logs', {
        params: {
          actor: p?.actorId,
          action: p?.action,
          from: p?.from,
          to: p?.to,
          page: p?.page,
          pageSize: p?.pageSize,
        },
        signal: o?.signal,
      })
      .then((r) => r.data),
}
