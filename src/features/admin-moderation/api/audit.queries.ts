import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { auditService, type AuditLogListParams } from './audit.service'

export const auditKeys = {
  all: ['admin', 'audit-logs'] as const,
  list: (p: AuditLogListParams) => ['admin', 'audit-logs', p] as const,
}

export const useAuditLogs = (params: AuditLogListParams = {}, enabled = true) =>
  useQuery({
    queryKey: auditKeys.list(params),
    queryFn: ({ signal }) => auditService.list(params, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  })
