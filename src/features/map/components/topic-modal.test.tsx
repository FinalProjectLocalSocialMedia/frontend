import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { TopicPostsModal } from './topic-posts-modal'
import { PostCardCompact } from './post-card-compact'
import { isBoxesColliding } from '../lib/marker-collision'
import type { PostCardData } from '../lib/types'

// Mock react-router-dom navigate để kiểm tra nút "Xem tất cả"
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

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

describe('TopicPostsModal & Marker chủ đề xu hướng (Pha 4 - R4 / 6.5)', () => {
  it('TopicPostsModal không có role="dialog", không có aria-modal và không render backdrop', () => {
    const handleClose = vi.fn()
    const { container } = renderWithProviders(
      <TopicPostsModal
        topic="totnghiep"
        placeId="plc-1"
        areaCenter={{ latitude: 21.0285, longitude: 105.8542 }}
        radiusKm={3}
        isOpen={true}
        onClose={handleClose}
      />,
    )

    // Không có role="dialog" để tránh chặn tương tác bản đồ
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(container.querySelector('[aria-modal="true"]')).toBeNull()
    expect(container.querySelector('.fixed.inset-0')).toBeNull()
  })

  it('Nút đóng duy nhất và phím Escape kích hoạt gọi callback onClose', () => {
    const handleClose = vi.fn()
    renderWithProviders(
      <TopicPostsModal
        topic="totnghiep"
        placeId="plc-1"
        areaCenter={{ latitude: 21.0285, longitude: 105.8542 }}
        radiusKm={3}
        isOpen={true}
        onClose={handleClose}
      />,
    )

    // Chỉ có 1 nút đóng với aria-label="Đóng"
    const closeButtons = screen.getAllByRole('button', { name: /đóng/i })
    expect(closeButtons).toHaveLength(1)

    // Click nút đóng
    fireEvent.click(closeButtons[0])
    expect(handleClose).toHaveBeenCalledTimes(1)

    // Nhấn phím Escape
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(2)
  })

  it('Nút "Xem tất cả bài về #topic" điều hướng tới /search?topic=...', async () => {
    mockNavigate.mockClear()
    const handleClose = vi.fn()

    renderWithProviders(
      <TopicPostsModal
        topic="totnghiep"
        placeId="plc-1"
        areaCenter={{ latitude: 21.0285, longitude: 105.8542 }}
        radiusKm={3}
        isOpen={true}
        onClose={handleClose}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /xem tất cả bài về #totnghiep/i })).toBeDefined()
    })

    const viewAllBtn = screen.getByRole('button', { name: /xem tất cả bài về #totnghiep/i })
    fireEvent.click(viewAllBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/search?topic=totnghiep')
  })

  it('PostCardCompact hiển thị đúng thời gian tương đối ("2 giờ trước", "1 ngày trước") và không có toạ độ (R3)', () => {
    const fixedNow = new Date('2026-10-28T12:00:00Z').getTime()
    const twoHoursAgo = new Date(fixedNow - 2 * 3600 * 1000).toISOString()
    const oneDayAgo = new Date(fixedNow - 24 * 3600 * 1000).toISOString()

    const postTwoHours: PostCardData = {
      id: 'post-h-1',
      author: { id: 'u1', displayName: 'Minh Anh' },
      excerpt: 'Không khí lễ tốt nghiệp hôm nay thật náo nhiệt!',
      imageCount: 1,
      firstImageUrl: 'https://picsum.photos/seed/grad/600/400',
      createdAt: twoHoursAgo,
      place: { id: 'plc-1', name: 'ĐH Quốc Gia' },
      topics: ['totnghiep'],
      likeCount: 28,
      commentCount: 4,
    }

    const postOneDay: PostCardData = {
      id: 'post-d-1',
      author: { id: 'u2', displayName: 'Hương Trà' },
      excerpt: 'Tổng duyệt trang phục tốt nghiệp.',
      imageCount: 0,
      createdAt: oneDayAgo,
      place: { id: 'plc-1', name: 'ĐH Quốc Gia' },
      topics: ['totnghiep'],
      likeCount: 15,
      commentCount: 2,
    }

    const { rerender } = render(
      <MemoryRouter>
        <PostCardCompact post={postTwoHours} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Minh Anh')).toBeDefined()
    expect(screen.getByText('Không khí lễ tốt nghiệp hôm nay thật náo nhiệt!')).toBeDefined()
    expect(screen.getByText(/giờ trước/i)).toBeDefined()

    // Quy tắc R3: Bài viết tuyệt đối không chứa toạ độ địa lý
    expect((postTwoHours as Record<string, unknown>).latitude).toBeUndefined()
    expect((postTwoHours as Record<string, unknown>).longitude).toBeUndefined()

    rerender(
      <MemoryRouter>
        <PostCardCompact post={postOneDay} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Hương Trà')).toBeDefined()
    expect(screen.getByText('Tổng duyệt trang phục tốt nghiệp.')).toBeDefined()
    expect(screen.getByText(/ngày trước/i)).toBeDefined()
  })

  it('Thuật toán kiểm tra va chạm với đầu vào hộp pixel cố định (Pixel bounding boxes)', () => {
    // Hai hộp va chạm nhau
    const box1 = { minX: 100, maxX: 180, minY: 50, maxY: 80 }
    const box2 = { minX: 170, maxX: 250, minY: 60, maxY: 90 } // Giao nhau tại trục X [170, 180] và trục Y [60, 80]
    expect(isBoxesColliding(box1, box2, 0)).toBe(true)

    // Hai hộp cách nhau nhưng nằm trong khoảng padding
    const box3 = { minX: 185, maxX: 260, minY: 50, maxY: 80 }
    expect(isBoxesColliding(box1, box3, 0)).toBe(false)
    expect(isBoxesColliding(box1, box3, 6)).toBe(true) // Va chạm khi có đệm 6px

    // Hai hộp hoàn toàn tách rời nhau
    const boxFar = { minX: 400, maxX: 500, minY: 300, maxY: 330 }
    expect(isBoxesColliding(box1, boxFar, 10)).toBe(false)
  })
})
