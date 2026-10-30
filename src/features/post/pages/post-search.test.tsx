import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import PostSearch from './post-search'
import { mockSearchPosts } from '../api/post-api'
import { usePostSearch } from '../hooks/use-post-search'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderWithRoute(route: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <PostSearch />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Mở rộng trang post-search theo địa điểm & chủ đề (Pha 5 - Mục 6.8)', () => {
  it('mockSearchPosts lọc chính xác bài viết theo locationId và topic', () => {
    // 1. Lọc theo locationId
    const resLoc = mockSearchPosts({ locationId: 'plc-1', limit: 20 })
    expect(resLoc.items.length).toBeGreaterThan(0)
    resLoc.items.forEach((item) => {
      expect(item.location?.name).toBe('Đại học Quốc gia Hà Nội')
    })

    // 2. Lọc theo topic
    const resTopic = mockSearchPosts({ topic: 'totnghiep', limit: 20 })
    expect(resTopic.items.length).toBeGreaterThan(0)

    // 3. Lọc theo cả locationId và topic
    const resBoth = mockSearchPosts({ locationId: 'plc-1', topic: 'totnghiep', limit: 20 })
    resBoth.items.forEach((item) => {
      expect(item.location?.name).toBe('Đại học Quốc gia Hà Nội')
    })
  })

  it('render /search với ?locationId=...&locationName=... hiển thị đúng header địa điểm', () => {
    renderWithRoute('/search?locationId=plc-1&locationName=%C4%90%E1%BA%A1i%20h%E1%BB%8Dc%20Qu%E1%BB%91c%20gia%20H%C3%A0%20N%E1%BB%99i')

    expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
    expect(
      screen.getByText((content) =>
        content.includes('Những bài viết ở địa điểm') && content.includes('Đại học Quốc gia Hà Nội'),
      ),
    ).toBeDefined()

    // Có nút quay lại bản đồ và chip bỏ lọc
    expect(screen.getByRole('button', { name: /quay lại bản đồ/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /bỏ lọc/i })).toBeDefined()
  })

  it('render /search với ?topic=... hiển thị đúng header chủ đề', () => {
    renderWithRoute('/search?topic=totnghiep')

    expect(
      screen.getByText((content) =>
        content.includes('Những bài viết thuộc chủ đề') && content.includes('#totnghiep'),
      ),
    ).toBeDefined()
  })

  it('render /search với cả ?topic=... và ?locationId=... hiển thị đúng header kết hợp', () => {
    renderWithRoute('/search?topic=totnghiep&locationId=plc-1&locationName=%C4%90%E1%BA%A1i%20h%E1%BB%8Dc%20Qu%E1%BB%91c%20gia%20H%C3%A0%20N%E1%BB%99i')

    expect(
      screen.getByText((content) =>
        content.includes('Những bài viết thuộc chủ đề') &&
        content.includes('#totnghiep') &&
        content.includes('tại') &&
        content.includes('Đại học Quốc gia Hà Nội'),
      ),
    ).toBeDefined()
  })

  it('render /search thiếu locationName hiển thị fallback "địa điểm đã chọn"', () => {
    renderWithRoute('/search?locationId=plc-1')

    expect(
      screen.getByText((content) =>
        content.includes('Những bài viết ở địa điểm') && content.includes('địa điểm đã chọn'),
      ),
    ).toBeDefined()
  })

  it('click nút "Quay lại bản đồ" gọi navigate(-1)', () => {
    mockNavigate.mockClear()
    renderWithRoute('/search?topic=totnghiep')

    const backBtn = screen.getByRole('button', { name: /quay lại bản đồ/i })
    fireEvent.click(backBtn)

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('render /search với ?q= thông thường giữ nguyên header Discover / Search posts', () => {
    renderWithRoute('/search?q=hanoi')

    expect(screen.getByText('Discover')).toBeDefined()
    expect(screen.getByRole('heading', { name: /search posts/i })).toBeDefined()
  })
})
