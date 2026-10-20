import { mockDb } from './mock/db'
import { mockDelay } from './mock/latency'
import { requirePermission } from './mock/session'
import type { ShellService } from './shell.service'

export const mockShellService: ShellService = {
  async pendingReportCount(o) {
    await mockDelay(o?.signal)
    requirePermission('reports.read')
    return mockDb.reports.filter((r) => r.status === 'PENDING').length
  },
}
