import type { ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { PAGE_SIZE_OPTIONS } from '../lib/constants'
import type { SortState } from '../lib/use-url-table-state'
import { EmptyState } from './empty-state'
import { ErrorState } from './error-state'

export type DataTableColumn<T> = {
  id: string
  header: ReactNode | ((props: { sort: SortState | null }) => ReactNode)
  cell?: (item: T, index: number) => ReactNode
  accessorKey?: keyof T
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  className?: string
  headerClassName?: string
}

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (item: T) => string | number
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  sort?: SortState | null
  onSortChange?: (sort: SortState | null) => void
  className?: string
}

/**
 * Bảng dữ liệu chuẩn (DataTable) trình bày đồng nhất cho toàn khu vực admin.
 * Không dùng thư viện ngoài để tương thích tối đa với React Compiler và URL state.
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  error,
  onRetry,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription = 'Hiện chưa có bản ghi nào phù hợp với bộ lọc.',
  emptyAction,
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  onPageSizeChange,
  sort,
  onSortChange,
  className,
}: DataTableProps<T>) {
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(total, page * pageSize)

  const handleHeaderClick = (col: DataTableColumn<T>) => {
    if (!col.sortable || !onSortChange) return
    if (!sort || sort.field !== col.id) {
      onSortChange({ field: col.id, direction: 'asc' })
    } else if (sort.direction === 'asc') {
      onSortChange({ field: col.id, direction: 'desc' })
    } else {
      onSortChange(null)
    }
  }

  const getSortIcon = (colId: string) => {
    if (!sort || sort.field !== colId) {
      return <ArrowUpDown className="size-3.5 opacity-40 group-hover:opacity-100" />
    }
    return sort.direction === 'asc' ? (
      <ArrowUp className="size-3.5 text-primary" />
    ) : (
      <ArrowDown className="size-3.5 text-primary" />
    )
  }

  const pageSizeItems = PAGE_SIZE_OPTIONS.map((n) => ({
    value: String(n),
    label: `${n} / trang`,
  }))

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => {
                const isSorted = sort?.field === col.id
                const ariaSort = isSorted
                  ? sort.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined

                return (
                  <TableHead
                    key={col.id}
                    aria-sort={ariaSort}
                    className={cn(
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.headerClassName,
                    )}
                  >
                    {col.sortable && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => handleHeaderClick(col)}
                        className={cn(
                          'group inline-flex items-center gap-1.5 font-medium hover:text-foreground select-none',
                          col.align === 'center' && 'justify-center',
                          col.align === 'right' && 'justify-end',
                        )}
                      >
                        <span>
                          {typeof col.header === 'function'
                            ? col.header({ sort: sort ?? null })
                            : col.header}
                        </span>
                        {getSortIcon(col.id)}
                      </button>
                    ) : typeof col.header === 'function' ? (
                      col.header({ sort: sort ?? null })
                    ) : (
                      col.header
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              // Trạng thái đang tải: hiển thị các dòng skeleton
              Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <TableCell key={col.id} className={col.className}>
                      <Skeleton className="h-5 w-full max-w-[80%]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              // Trạng thái rỗng
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-56 p-0 text-center">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                    className="border-0 shadow-none"
                  />
                </TableCell>
              </TableRow>
            ) : (
              // Dữ liệu thực tế
              data.map((item, index) => (
                <TableRow key={String(rowKey(item))}>
                  {columns.map((col) => {
                    const content = col.cell
                      ? col.cell(item, index)
                      : col.accessorKey
                        ? String(item[col.accessorKey] ?? '')
                        : null

                    return (
                      <TableCell
                        key={col.id}
                        className={cn(
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right',
                          col.className,
                        )}
                      >
                        {content}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Thanh phân trang & chọn kích thước trang */}
      {onPageChange && (
        <div className="flex flex-col items-center justify-between gap-3 px-1 sm:flex-row">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              {total > 0 ? `Hiển thị ${startItem} - ${endItem} trên tổng số ${total}` : '0 kết quả'}
            </span>
            {onPageSizeChange && (
              <div className="flex items-center gap-1.5">
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => val && onPageSizeChange(Number(val))}
                  items={pageSizeItems}
                >
                  <SelectTrigger
                    size="sm"
                    aria-label="Số bản ghi mỗi trang"
                    className="h-7 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {pageSizeItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onPageChange(1)}
              disabled={page <= 1 || loading}
              aria-label="Về trang đầu"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              aria-label="Trang trước"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <span className="px-3 text-xs font-medium">
              Trang {page} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              aria-label="Trang sau"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages || loading}
              aria-label="Đến trang cuối"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
