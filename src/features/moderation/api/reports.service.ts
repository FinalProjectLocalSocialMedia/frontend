import { USE_MOCK } from '@/features/admin-moderation/lib/constants'
import type {
  Paginated,
  ReportDetail,
  ReportListItem,
  ReportStatus,
  ReportSummary,
  RequestOptions,
  ResolveReportInput,
  ResolveReportResult,
  Uuid,
} from '@/features/admin-moderation/lib/types'
import { httpReportsService } from './reports.http'
import { mockReportsService } from './reports.mock'

export type ReportListParams = {
  type?: 'content' | 'user'
  status?: ReportStatus
  reason?: string
  q?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface ReportsService {
  list(params?: ReportListParams, options?: RequestOptions): Promise<Paginated<ReportListItem>>
  summary(options?: RequestOptions): Promise<ReportSummary>
  get(id: Uuid, options?: RequestOptions): Promise<ReportDetail>
  resolve(
    id: Uuid,
    input: ResolveReportInput,
    options?: RequestOptions,
  ): Promise<ResolveReportResult>
}

export const reportsService: ReportsService = USE_MOCK ? mockReportsService : httpReportsService
