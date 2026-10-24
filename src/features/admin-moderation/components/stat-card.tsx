import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type StatCardProps = {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: string | number
    label: string
    isPositive?: boolean
  }
  extra?: ReactNode
  className?: string
}

/**
 * Thẻ hiển thị số liệu thống kê cho dashboard hoặc trang tổng quan.
 */
export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  extra,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && (
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
            <Icon className="size-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        {trend && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                'font-medium',
                trend.isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {trend.value}
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
        {extra && <div className="mt-3">{extra}</div>}
      </CardContent>
    </Card>
  )
}
