import { USE_MOCK } from '../lib/constants'
import type { AuditLog, IsoDateTime, Paginated, RequestOptions, Uuid } from '../lib/types'
import { httpAuditService } from './audit.http'
import { mockAuditService } from './audit.mock'

export type AuditLogListParams = {
  actorId?: Uuid
  action?: string
  from?: IsoDateTime
  to?: IsoDateTime
  page?: number
  pageSize?: number
}

export interface AuditService {
  /** Chỉ admin (`audit.read`); mới nhất trước. */
  list(p?: AuditLogListParams, o?: RequestOptions): Promise<Paginated<AuditLog>>
}

export const auditService: AuditService = USE_MOCK ? mockAuditService : httpAuditService
