import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DensityLegend } from './density-legend'
import { DensityStatus } from './density-status'
import { PerformanceHUD } from './performance-hud'
import { getDensityColor, zoomToResolution } from '@/components/map/h3-layers'

describe('Thành phần lớp mật độ H3 (Pha 2)', () => {
  it('DensityLegend hiển thị đúng nhãn cửa sổ thời gian và các mốc', () => {
    render(<DensityLegend window="7d" totalPosts={88} />)

    expect(screen.getByText('Mật độ hoạt động')).toBeDefined()
    expect(screen.getByText('7 ngày')).toBeDefined()
    expect(screen.getByText('Ít')).toBeDefined()
    expect(screen.getByText('Nhiều')).toBeDefined()
    expect(screen.getByText('88')).toBeDefined()
  })

  it('DensityStatus hiển thị trạng thái rỗng và lỗi có nút thử lại', () => {
    const handleRetry = vi.fn()
    const { rerender } = render(
      <DensityStatus isFetching={false} isError={false} isEmpty={true} />,
    )

    expect(screen.getByText('Chưa có bài viết trong vùng này')).toBeDefined()

    // Chuyển sang trạng thái lỗi
    rerender(
      <DensityStatus
        isFetching={false}
        isError={true}
        isEmpty={false}
        onRetry={handleRetry}
      />,
    )

    expect(screen.getByText('Không thể tải dữ liệu mật độ')).toBeDefined()
    const retryBtn = screen.getByRole('button', { name: /thử lại/i })
    expect(retryBtn).toBeDefined()
    fireEvent.click(retryBtn)
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('PerformanceHUD mở rộng và hiển thị số đo map:ready và density-first-paint', () => {
    const metrics = {
      mapReadyTimeMs: 420,
      densityFirstPaintMs: 650,
      cellCount: 45,
      resolution: 8,
      window: '7d',
    }

    render(<PerformanceHUD metrics={metrics} />)

    const toggleBtn = screen.getByRole('button', { name: /báo cáo hiệu năng/i })
    expect(toggleBtn).toBeDefined()

    // Bấm để mở rộng chi tiết
    fireEvent.click(toggleBtn)

    expect(screen.getByText(/420 ms/i)).toBeDefined()
    expect(screen.getByText(/650 ms/i)).toBeDefined()
    expect(screen.getByText('45')).toBeDefined()
    expect(screen.getByText('res 8')).toBeDefined()
  })

  it('zoomToResolution chuyển đổi đúng theo các dải zoom trong cấu hình', () => {
    // Zoom 9 và 10 -> res 6
    expect(zoomToResolution(9)).toBe(6)
    expect(zoomToResolution(10.5)).toBe(6)

    // Zoom 11 và 12 -> res 7
    expect(zoomToResolution(11)).toBe(7)
    expect(zoomToResolution(12.8)).toBe(7)

    // Zoom 13 trở lên -> res 8
    expect(zoomToResolution(13)).toBe(8)
    expect(zoomToResolution(16)).toBe(8)
  })

  it('getDensityColor tính toán dải màu và giảm độ sáng (dimmed) khi ô nằm ngoài bán kính', () => {
    const normalColor = getDensityColor(5, 10, false)
    const dimmedColor = getDensityColor(5, 10, true)

    // Màu thường có alpha trong khoảng [120, 180]
    expect(normalColor[3]).toBeGreaterThanOrEqual(120)

    // Ô mờ ngoài bán kính có alpha giảm xuống ~35%
    expect(dimmedColor[3]).toBe(Math.round(normalColor[3] * 0.35))
  })
})
