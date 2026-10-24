import type { LucideIcon } from 'lucide-react'
import { Construction } from 'lucide-react'
import { EmptyState } from './empty-state'
import { PageHeader } from './page-header'

type ComingSoonProps = {
  title: string
  description?: string
  icon?: LucideIcon
  phaseText?: string
}

/**
 * Trang giữ chỗ cho các chức năng thuộc các Pha kế tiếp (Pha 3 - Pha 10).
 */
export function ComingSoon({
  title,
  description,
  icon = Construction,
  phaseText = 'Chức năng đang được phát triển ở các pha tiếp theo theo kế hoạch.',
}: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title="Tính năng đang được phát triển"
        description={phaseText}
      />
    </div>
  )
}
