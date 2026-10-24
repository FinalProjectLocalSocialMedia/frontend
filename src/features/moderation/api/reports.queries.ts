import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shellKeys } from '@/features/admin-moderation/api/shell.queries'
import type { ResolveReportInput, Uuid } from '@/features/admin-moderation/lib/types'
import { reportsService, type ReportListParams } from './reports.service'

export const reportKeys = {
  all: ['admin', 'reports'] as const,
  list: (params: ReportListParams) => ['admin', 'reports', 'list', params] as const,
  summary: () => ['admin', 'reports', 'summary'] as const,
  detail: (id: Uuid) => ['admin', 'reports', 'detail', id] as const,
}

export function useReports(params: ReportListParams = {}, enabled = true) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: ({ signal }) => reportsService.list(params, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useReportsSummary(enabled = true) {
  return useQuery({
    queryKey: reportKeys.summary(),
    queryFn: ({ signal }) => reportsService.summary({ signal }),
    refetchInterval: 30_000,
    enabled,
  })
}

export function useReportDetail(id: Uuid, enabled = true) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: ({ signal }) => reportsService.get(id, { signal }),
    enabled: enabled && !!id,
  })
}

export function useResolveReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: Uuid; input: ResolveReportInput }) =>
      reportsService.resolve(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all })
      queryClient.invalidateQueries({ queryKey: shellKeys.pendingReportCount })
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(variables.id) })
    },
  })
}
