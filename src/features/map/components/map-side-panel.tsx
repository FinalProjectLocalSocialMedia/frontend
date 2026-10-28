import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MapSidePanelProps = {
  /** Trạng thái mở / đóng của panel */
  isOpen: boolean
  /** Hàm callback khi người dùng yêu cầu đóng panel */
  onClose: () => void
  /** Tiêu đề thanh header của panel (nếu có) */
  title?: React.ReactNode
  /** Nội dung bên trong panel */
  children: React.ReactNode
  /** Tuỳ biến thêm CSS class cho khung panel */
  className?: string
  /** Nhãn trợ năng vùng panel */
  ariaLabel?: string
}

/**
 * Khung panel bên trái bản đồ (MapSidePanel) theo mục 6.4b và M17.
 * Dùng chung cho PlaceDetailModal, TopicPostsModal, và SearchResultsPanel:
 * - Thuần Tailwind, không dùng Dialog hay Sheet của shadcn (tránh tạo backdrop/overlay và chặn tương tác bản đồ)
 * - Tuyệt đối KHÔNG có role="dialog" hay aria-modal="true" để bản đồ xung quanh vẫn thao tác kéo/zoom bình thường
 * - Desktop (>= lg): nằm bên trái, ngay dưới thanh tìm kiếm + chip bán kính, rộng clamp(20rem, 33%, 26rem)
 * - Mobile (< lg): bottom sheet không backdrop cao ~60dvh, bản đồ phía trên vẫn thao tác được
 * - Hiệu ứng trượt: trượt ra từ bên trái trên desktop, từ dưới lên trên mobile
 * - Chỉ có DUY NHẤT một nút đóng × (kích thước chuẩn 40x40px)
 * - Hỗ trợ đóng bằng phím Escape
 * - Nội dung bên trong cuộn dọc, chặn triệt để thanh cuộn ngang (overflow-x-hidden, min-w-0)
 */
export function MapSidePanel({
  isOpen,
  onClose,
  title,
  children,
  className,
  ariaLabel = 'Bảng thông tin chi tiết',
}: MapSidePanelProps) {
  // Trạng thái lưu giữ trong DOM để chạy hiệu ứng trượt vào / trượt ra
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(isOpen)

  // Điều khiển hiệu ứng chuyển động trượt mượt mà
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      const raf = requestAnimationFrame(() => {
        setIsVisible(true)
      })
      return () => cancelAnimationFrame(raf)
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300) // Khớp thời gian với transition duration-300
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Lắng nghe phím Escape để đóng panel
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!shouldRender) return null

  return (
    <aside
      aria-label={ariaLabel}
      className={cn(
        // Khung nền và bố cục nổi trên bản đồ
        'pointer-events-auto absolute z-10 flex flex-col bg-background/95 backdrop-blur-md shadow-xl border border-border/80 overflow-hidden',
        // Định vị trên màn hình di động (< lg): bottom sheet cao ~60dvh
        'inset-x-0 bottom-0 h-[60dvh] max-h-[75dvh] rounded-t-2xl border-b-0',
        // Định vị trên màn hình máy tính (>= lg): panel bên trái, dưới thanh tìm kiếm (top-[108px]), rộng tối đa ~1/3 Explore
        'lg:inset-x-auto lg:top-[108px] lg:bottom-3 lg:left-3 lg:h-auto lg:max-h-none lg:w-[clamp(20rem,33%,26rem)] lg:rounded-2xl lg:border',
        // Hiệu ứng trượt
        'transition-transform duration-300 ease-in-out',
        isVisible
          ? 'translate-y-0 lg:translate-x-0'
          : 'translate-y-full lg:-translate-x-[calc(100%+1.5rem)] lg:translate-y-0',
        className,
      )}
    >
      {/* Thanh gạt nhỏ trên di động */}
      <div className="flex justify-center pt-2 pb-1 lg:hidden">
        <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Thanh tiêu đề và nút đóng duy nhất */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 shrink-0 bg-background/90">
        <div className="text-sm font-semibold text-foreground truncate pr-2">
          {title || 'Chi tiết địa điểm'}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Nội dung cuộn dọc, tuyệt đối không tràn chiều ngang */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 p-4">
        {children}
      </div>
    </aside>
  )
}
