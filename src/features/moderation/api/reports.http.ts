import { adminHttp } from '@/features/admin-moderation/api/http-client'
import type {
  Paginated,
  ReportDetail,
  ReportListItem,
  ReportSummary,
  ResolveReportResult,
} from '@/features/admin-moderation/lib/types'
import type { ReportListParams, ReportsService } from './reports.service'

/**
 * Hiện thực kết nối HTTP thật tới backend Moderation Service (OpenAPI: /api/v1/admin/reports).
 */
export const httpReportsService: ReportsService = {
  list(params?: ReportListParams, opts?) {
    return adminHttp
      .get<Paginated<ReportListItem>>('/reports', {
        params,
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },

  summary(opts?) {
    return adminHttp
      .get<ReportSummary>('/reports/summary', {
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },

  get(id, opts?) {
    return adminHttp
      .get<ReportDetail>(`/reports/${id}`, {
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },

  resolve(id, input, opts?) {
    return adminHttp
      .post<ResolveReportResult>(`/reports/${id}/resolve`, input, {
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },
}
