import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { usePageTitle } from '../lib/use-page-title'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
  /** Có đồng bộ title với document.title không (mặc định true) */
  syncDocumentTitle?: boolean
}

/**
 * Tiêu đề trang chuẩn cho khu vực admin.
 * Mỗi trang CHỈ CÓ DUY NHẤT MỘT THẺ <h1> này (quy chuẩn SEO & accessibility).
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
  syncDocumentTitle = true,
}: PageHeaderProps) {
  usePageTitle(title, syncDocumentTitle)

  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
