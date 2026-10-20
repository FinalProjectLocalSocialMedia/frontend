import { USE_MOCK } from '../lib/constants'
import type { RequestOptions } from '../lib/types'
import { httpShellService } from './shell.http'
import { mockShellService } from './shell.mock'

/** Dữ liệu nhỏ phục vụ khung giao diện (sidebar). Module báo cáo đầy đủ ở Pha 3. */
export interface ShellService {
  /** Số báo cáo `PENDING` — hiển thị ở badge mục "Báo cáo" của sidebar. */
  pendingReportCount(o?: RequestOptions): Promise<number>
}

export const shellService: ShellService = USE_MOCK ? mockShellService : httpShellService
