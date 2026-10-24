import { useQuery } from '@tanstack/react-query'
import { shellService } from './shell.service'

export const shellKeys = {
  pendingReportCount: ['admin', 'shell', 'pending-report-count'] as const,
}

export const usePendingReportCount = (enabled = true) =>
  useQuery({
    queryKey: shellKeys.pendingReportCount,
    queryFn: ({ signal }) => shellService.pendingReportCount({ signal }),
    refetchInterval: 30_000,
    enabled,
  })
