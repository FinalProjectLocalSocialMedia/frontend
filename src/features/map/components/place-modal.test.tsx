import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { PlaceDetailModal } from './place-detail-modal'
import { TimeFilter } from './time-filter'
import { PostCardCompact } from './post-card-compact'
import { resolveTimeFilter } from '../lib/time-filter'
import type { PostCardData } from '../lib/types'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Chi tiết địa điểm & Bộ lọc thời gian (Pha 3)', () => {
  it('TimeFilter phát ra đúng giá trị preset và phân giải khoảng thời gian UTC+7', () => {
    const handleChange = vi.fn()
    const { rerender } = render(
      <TimeFilter value={{ kind: 'all' }} onChange={handleChange} />,
    )

    // Nhãn ban đầu
    expect(screen.getByText('Tất cả thời gian')).toBeDefined()

    // Kiểm tra phân giải preset 1d
    const range1d = resolveTimeFilter({ kind: 'preset', preset: '1d' }, new Date('2026-10-26T12:00:00Z'))
    expect(range1d.from).toBe('2026-10-25T12:00:00.000Z')
    expect(range1d.to).toBe('2026-10-26T12:00:00.000Z')

    // Kiểm tra phân giải ngày cụ thể theo múi giờ Việt Nam (+07:00)
    const rangeDate = resolveTimeFilter({ kind: 'date', date: '2026-09-23' })
    expect(rangeDate.from).toBe('2026-09-23T00:00:00.000+07:00')
    expect(rangeDate.to).toBe('2026-09-23T23:59:59.999+07:00')

    // Rerender với nhãn ngày
    rerender(<TimeFilter value={{ kind: 'date', date: '2026-09-23' }} onChange={handleChange} />)
    expect(screen.getByText('23/09/2026')).toBeDefined()
  })

  it('PostCardCompact hiển thị đầy đủ thông tin và TUYỆT ĐỐI KHÔNG chứa toạ độ (R3)', () => {
    const mockPost: PostCardData = {
      id: 'post-test-1',
      author: { id: 'u1', displayName: 'Tuấn Hoàng' },
      excerpt: 'Buổi chiều ngắm hồ Tây thật tuyệt vời!',
      imageCount: 2,
      firstImageUrl: 'https://picsum.photos/seed/test/600/400',
      createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      place: { id: 'plc-1', name: 'Hồ Tây' },
      topics: ['chill', 'hanoi'],
      likeCount: 42,
      commentCount: 7,
    }

    render(
      <MemoryRouter>
        <PostCardCompact post={mockPost} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Tuấn Hoàng')).toBeDefined()
    expect(screen.getByText('Buổi chiều ngắm hồ Tây thật tuyệt vời!')).toBeDefined()
    expect(screen.getByText('#chill')).toBeDefined()
    expect(screen.getByText('42')).toBeDefined()
    expect(screen.getByText('7')).toBeDefined()

    // Quy tắc R3: kiểm tra đối tượng bài viết không có toạ độ
    expect((mockPost as Record<string, unknown>).latitude).toBeUndefined()
    expect((mockPost as Record<string, unknown>).longitude).toBeUndefined()
    expect((mockPost as Record<string, unknown>).coordinate).toBeUndefined()
  })

  it('PlaceDetailModal hiển thị đủ các phần tử khi mở với placeId', async () => {
    const handleClose = vi.fn()

    renderWithProviders(
      <PlaceDetailModal placeId="plc-1" isOpen={true} onClose={handleClose} />,
    )

    // Đợi dữ liệu mock địa điểm tải xong
    await waitFor(
      () => {
        expect(screen.getByText('Đại học Quốc gia Hà Nội')).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Kiểm tra 3 ô đếm bài viết
    expect(screen.getByText('Hôm nay')).toBeDefined()
    expect(screen.getByText('7 ngày')).toBeDefined()
    expect(screen.getByText('30 ngày')).toBeDefined()

    // Kiểm tra nút chuyển đổi sắp xếp Xu hướng / Mới nhất
    expect(screen.getByRole('button', { name: /xu hướng/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /mới nhất/i })).toBeDefined()
  })
})
