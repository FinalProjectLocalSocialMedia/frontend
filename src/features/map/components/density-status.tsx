import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type DensityStatusProps = {
  isFetching: boolean
  isError: boolean
  isEmpty: boolean
  onRetry?: () => void
}

/**
 * Hiển thị các trạng thái của lớp mật độ H3:
 * - Đang tải ngầm: thanh tiến trình mảnh màu primary ở đỉnh màn hình
 * - Vùng rỗng: chip thông báo "Chưa có bài viết trong vùng này"
 * - Lỗi tải: chip thông báo lỗi có nút "Thử lại" mà không chặn thao tác bản đồ
 */
export function DensityStatus({
  isFetching,
  isError,
  isEmpty,
  onRetry,
}: DensityStatusProps) {
  return (
    <>
      {/* Thanh chỉ báo đang tải dữ liệu mỏng ở sát cạnh trên bản đồ */}
      {isFetching && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-1 overflow-hidden bg-primary/20">
          <div className="h-full w-1/3 animate-[shimmer_1.5s_infinite] bg-primary rounded-r-full" />
        </div>
      )}

      {/* Thông báo lỗi tải dữ liệu có nút thử lại */}
      {isError && (
        <div className="pointer-events-none absolute top-20 inset-x-0 z-20 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/95 px-3.5 py-1.5 text-xs font-medium text-destructive-foreground shadow-md backdrop-blur-sm">
            <AlertCircle className="size-3.5" />
            <span>Không thể tải dữ liệu mật độ</span>
            {onRetry && (
              <Button
                variant="ghost"
                size="xs"
                onClick={onRetry}
                className="h-6 gap-1 px-2 text-xs font-semibold hover:bg-destructive-foreground/20 text-white"
              >
                <RefreshCw className="size-3" />
                Thử lại
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Thông báo khu vực chưa có bài viết */}
      {!isFetching && !isError && isEmpty && (
        <div className="pointer-events-none absolute top-20 inset-x-0 z-20 flex justify-center px-4">
          <div className="pointer-events-auto rounded-full border border-border/80 bg-card/90 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
            Chưa có bài viết trong vùng này
          </div>
        </div>
      )}
    </>
  )
}
