import { AlertTriangle, RotateCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ErrorStateProps = {
  title?: string
  error?: unknown
  onRetry?: () => void
  className?: string
}

function getErrorMessage(error: unknown): string {
  if (!error) return 'Đã có lỗi không mong muốn xảy ra.'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }
  return 'Đã có lỗi không mong muốn xảy ra. Vui lòng thử lại sau.'
}

/**
 * Hiển thị khối lỗi trực quan kèm nút thử lại.
 */
export function ErrorState({
  title = 'Không thể tải dữ liệu',
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  const message = getErrorMessage(error)

  return (
    <Alert
      variant="destructive"
      className={cn(
        'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="size-5 shrink-0" />
        <div className="space-y-1">
          <AlertTitle className="font-semibold">{title}</AlertTitle>
          <AlertDescription className="text-sm opacity-90">{message}</AlertDescription>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="shrink-0 gap-1.5 self-start sm:self-auto"
        >
          <RotateCw className="size-3.5" />
          <span>Thử lại</span>
        </Button>
      )}
    </Alert>
  )
}
