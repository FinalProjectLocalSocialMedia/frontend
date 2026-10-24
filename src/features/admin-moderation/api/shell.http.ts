import { adminHttp } from './http-client'
import type { ShellService } from './shell.service'
import type { Paginated, ReportListItem } from '../lib/types'

/** Dùng lại `GET /admin/reports?status=PENDING` và lấy `total` (mục 10.1). */
export const httpShellService: ShellService = {
  pendingReportCount: (o) =>
    adminHttp
      .get<Paginated<ReportListItem>>('/reports', {
        params: { status: 'PENDING', pageSize: 1 },
        signal: o?.signal,
      })
      .then((r) => r.data.total),
}
