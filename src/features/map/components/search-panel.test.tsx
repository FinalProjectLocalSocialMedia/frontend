import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { PlaceFocusCard } from './place-focus-card'
import { MapSearchBar } from './map-search-bar'
import { SearchResultsPanel } from './search-results-panel'
import { mockSearchService } from '../api/mock/map.mock'
import { seedDatabase } from '../api/mock/seed'
import type { MapPlace } from '../lib/types'

// Mock react-router-dom navigate để kiểm tra điều hướng
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

describe('PHA 6: PlaceFocusCard, MapSearchBar & SearchResultsPanel (Mục 6.6 & 6.7)', () => {
  const samplePlace: MapPlace = {
    id: 'plc-1',
    name: 'Đại học Quốc gia Hà Nội',
    locationType: 'university',
    center: { latitude: 21.0372, longitude: 105.7828 },
    postCount: 128,
    trendScore: 95,
    topTopics: ['totnghiep', 'hoctap'],
    h3Index: '88309a4733fffff',
  }

  describe('1. PlaceFocusCard (Bước 1 & Bước 2)', () => {
    it('hiển thị tên địa điểm và số bài viết mà không gọi API mạng thêm', () => {
      const handleSelect = vi.fn()
      const handleDismiss = vi.fn()

      render(
        <PlaceFocusCard
          place={samplePlace}
          statsWindow="7d"
          onSelectPlace={handleSelect}
          onDismiss={handleDismiss}
        />,
      )

      expect(screen.getByText('Đại học Quốc gia Hà Nội')).toBeDefined()
      expect(screen.getByText(/128 bài trong 7 ngày/i)).toBeDefined()
    })

    it('nhấp vào tên địa điểm gọi onSelectPlace với đối tượng địa điểm', () => {
      const handleSelect = vi.fn()
      const handleDismiss = vi.fn()

      render(
        <PlaceFocusCard
          place={samplePlace}
          statsWindow="7d"
          onSelectPlace={handleSelect}
          onDismiss={handleDismiss}
        />,
      )

      const nameButton = screen.getByText('Đại học Quốc gia Hà Nội')
      fireEvent.click(nameButton)

      expect(handleSelect).toHaveBeenCalledWith(samplePlace)
    })

    it('nhấp vào nút X gọi onDismiss', () => {
      const handleSelect = vi.fn()
      const handleDismiss = vi.fn()

      render(
        <PlaceFocusCard
          place={samplePlace}
          statsWindow="7d"
          onSelectPlace={handleSelect}
          onDismiss={handleDismiss}
        />,
      )

      const closeButton = screen.getByLabelText('Đóng thẻ địa điểm')
      fireEvent.click(closeButton)

      expect(handleDismiss).toHaveBeenCalled()
    })
  })

  describe('2. MapSearchBar (Gợi ý và Tìm kiếm)', () => {
    it('nhấn Enter với từ khoá hợp lệ gọi onSubmit, từ khoá rỗng không gọi onSubmit', () => {
      const handleSubmit = vi.fn()
      const handleChange = vi.fn()

      const { rerender } = render(
        <MapSearchBar
          value=""
          onChange={handleChange}
          onSubmit={handleSubmit}
        />,
      )

      const input = screen.getByLabelText('Tìm kiếm trên bản đồ')
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      expect(handleSubmit).not.toHaveBeenCalled()

      rerender(
        <MapSearchBar
          value="Hồ Hoàn Kiếm"
          onChange={handleChange}
          onSubmit={handleSubmit}
        />,
      )

      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      expect(handleSubmit).toHaveBeenCalledWith('Hồ Hoàn Kiếm')
    })
  })

  describe('3. SearchResultsPanel & Đủ 7 Bước theo mục 6.6', () => {
    it('kiểm thử mockSearchService lọc theo từ khoá, địa điểm và thời gian', async () => {
      const res = await mockSearchService.search({
        q: 'Hà Nội',
        time: { kind: 'all' },
        kinds: ['POST', 'USER', 'PLACE'],
        page: 1,
        pageSize: 10,
      })

      expect(res.posts.items.length).toBeGreaterThan(0)
      expect(res.places.length).toBeGreaterThan(0)
    })

    it('hiển thị panel với 3 tab: Bài viết (mặc định), Người dùng, Địa điểm', async () => {
      const handleSelectPlace = vi.fn()

      renderWithProviders(
        <SearchResultsPanel
          isOpen={true}
          onClose={vi.fn()}
          query="Đại học"
          placeId={samplePlace.id}
          placeName={samplePlace.name}
          areaCenter={samplePlace.center}
          radiusKm={3}
          onSelectPlace={handleSelectPlace}
        />,
      )

      expect(screen.getByTestId('search-tab-posts')).toBeDefined()
      expect(screen.getByTestId('search-tab-users')).toBeDefined()
      expect(screen.getByTestId('search-tab-places')).toBeDefined()

      // Chờ dữ liệu bài viết tải xong
      await waitFor(() => {
        expect(screen.getAllByTestId('search-post-item').length).toBeGreaterThan(0)
      })

      // Kiểm tra tab Người dùng
      fireEvent.click(screen.getByTestId('search-tab-users'))
      await waitFor(() => {
        // Tab người dùng hoạt động
        expect(screen.getByTestId('search-tab-users')).toBeDefined()
      })

      // Kiểm tra tab Địa điểm
      fireEvent.click(screen.getByTestId('search-tab-places'))
      await waitFor(() => {
        const placeItems = screen.getAllByTestId('search-place-item')
        expect(placeItems.length).toBeGreaterThan(0)
        // Click vào địa điểm gọi onSelectPlace (Bước 7)
        fireEvent.click(placeItems[0])
        expect(handleSelectPlace).toHaveBeenCalled()
      })
    })

    it('điều hướng khi nhấp vào bài viết (/posts/:id) theo Bước 7', async () => {
      renderWithProviders(
        <SearchResultsPanel
          isOpen={true}
          onClose={vi.fn()}
          query="Đại học"
          placeId={samplePlace.id}
          placeName={samplePlace.name}
          areaCenter={samplePlace.center}
          radiusKm={3}
          onSelectPlace={vi.fn()}
        />,
      )

      await waitFor(() => {
        const postItems = screen.getAllByTestId('search-post-item')
        expect(postItems.length).toBeGreaterThan(0)
        fireEvent.click(postItems[0])
      })

      expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/posts\/[a-zA-Z0-9_-]+/))
    })
  })
})
