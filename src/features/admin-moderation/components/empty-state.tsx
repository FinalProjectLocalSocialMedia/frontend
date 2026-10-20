import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/**
 * Trạng thái trống chuẩn dùng cho bảng, danh sách, chi tiết khi không có dữ liệu.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Empty className={cn('border border-dashed py-12', className)}>
      <EmptyHeader>
        {Icon && (
          <EmptyMedia variant="icon">
            <Icon className="size-5 text-muted-foreground" />
          </EmptyMedia>
        )}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}
