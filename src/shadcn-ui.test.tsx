import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { RadiusControl } from '@/features/map/components/radius-control'
import { DensityModeControl } from '@/features/map/components/density-mode-control'
import { createPost as createPostRequest, getFeed } from '@/features/post/api/post-api'
import type { Post } from '@/features/post/types/post'
import type { CreatePostRequest } from './features/post/api/post-api'
import { setViewport } from '@/test-setup'

vi.mock('@/features/post/api/post-api', () => ({
  createPost: vi.fn(),
  getFeed: vi.fn(),
  searchPosts: vi.fn(),
}))

const createPostMock = vi.mocked(createPostRequest)
const getFeedMock = vi.mocked(getFeed)

const feedPosts = [
  {
    id: 'traffic-1',
    author: { id: 'minhnguyen', fullName: 'Nguyễn Minh' },
    content:
      'Traffic is extremely heavy around Cầu Giấy right now. Take a little extra time if you are heading toward Xuân Thủy.',
    media: null,
    location: { name: 'Cầu Giấy, Hanoi' },
    status: 'PUBLISHED',
    likeCount: 3,
    commentCount: 1,
    createdAt: '2026-10-22T10:00:00.000Z',
  },
  {
    id: 'campus-1',
    author: { id: 'huypham', fullName: 'Huy Phạm' },
    content: 'Anyone up for a casual badminton game at the university courts this evening?',
    media: null,
    location: { name: 'Cầu Giấy, Hanoi' },
    status: 'PUBLISHED',
    likeCount: 2,
    commentCount: 0,
    createdAt: '2026-10-22T09:00:00.000Z',
  },
]

function makeCreatedPost(content: string): Post {
  const now = new Date().toISOString()
  return {
    id: `created-${Date.now()}`,
    author: {
      id: 'minhnguyen',
      fullName: 'Nguyễn Minh',
      avatarUrl: '',
      bio: '',
      dateOfBirth: '',
      gender: '',
      currentLocation: { latitude: 21.0362, longitude: 105.7906 },
      currentH3Index: '',
      locationUpdateAt: now,
    },
    content,
    media: null,
    location: {
      id: 'location-1',
      name: 'Cầu Giấy, Hanoi',
      description: '',
      h3Index: '',
      locationType: '',
    },
    status: 'PUBLISHED',
    createdAt: now,
    updatedAt: now,
    sharedPost: null,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    comments: null,
    likes: null,
  }
}

const renderAt = (path: string) => {
  createPostMock.mockReset()
  createPostMock.mockImplementation(async (request: CreatePostRequest) =>
    makeCreatedPost(request.content),
  )
  getFeedMock.mockReset()
  getFeedMock.mockResolvedValue({
    items: feedPosts,
    page: {
      nextCursor: null,
      hasMore: false,
    },
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  queryClient.setQueryData(['auth', 'me'], {
    id: 'minhnguyen',
    email: 'minhnguyen@example.com',
    fullName: 'Nguyễn Minh',
    role: 'USER',
    avatarUrl: '',
    bio: '',
    status: 'ACTIVE',
  })
  return render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
}
const sidebarLink = (name: string) =>
  within(screen.getAllByRole('navigation', { name: 'Primary' })[0]).getByRole('link', { name })

async function submitCreatePost(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getAllByRole('button', { name: 'Tạo bài viết' })[0])
  const dialog = await screen.findByRole('dialog')
  await user.type(within(dialog).getByPlaceholderText('Có điều gì đang diễn ra xung quanh bạn?'), text)
  await user.click(within(dialog).getByRole('button', { name: 'Đăng bài' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

describe('Explore', () => {
  it('radius control renders and triggers onChange', () => {
    const handleChange = vi.fn()
    render(<RadiusControl value={3} onChange={handleChange} />)
    expect(screen.getByText('1 km')).toBeInTheDocument()
    expect(screen.getByText('5 km')).toBeInTheDocument()
    fireEvent.click(screen.getByText('5 km'))
    expect(handleChange).toHaveBeenCalledWith(5)
  })

  it('DensityModeControl flips aria-pressed', () => {
    const handleChange = vi.fn()
    const { rerender } = render(<DensityModeControl value="HEATMAP" onChange={handleChange} />)
    const toggleHex = screen.getByRole('button', { name: 'Ô lục giác' })
    expect(toggleHex).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(toggleHex)
    expect(handleChange).toHaveBeenCalledWith('HEX')
    rerender(<DensityModeControl value="HEX" onChange={handleChange} />)
    expect(toggleHex).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('PostCard menu', () => {
  it('Save post shows a toast', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const article = (await screen.findAllByRole('article'))[0]
    await user.click(within(article).getByRole('button', { name: 'Tùy chọn khác' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Lưu bài viết' }))
    expect(await screen.findByText('Đã lưu bài viết')).toBeInTheDocument()
  })

  it('own posts can be deleted from the menu, others can be reported', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const others = (await screen.findAllByRole('article')).find((article) =>
      article.textContent?.includes('Huy Phạm'),
    )!
    await user.click(within(others).getByRole('button', { name: 'Tùy chọn khác' }))
    expect(await screen.findByRole('menuitem', { name: 'Báo cáo bài viết' })).toBeInTheDocument()
    await user.keyboard('{Escape}')

    await submitCreatePost(user, 'bài của tôi để xoá')
    await user.click(
      within(screen.getAllByRole('article')[0]).getByRole('button', { name: 'Tùy chọn khác' }),
    )
    await user.click(await screen.findByRole('menuitem', { name: 'Xóa bài viết' }))
    expect(screen.queryByText('bài của tôi để xoá')).not.toBeInTheDocument()
  })
})

describe('Profile', () => {
  it('Tabs switch panels, Liked shows liked posts', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(sidebarLink('Trang cá nhân'))

    expect(screen.getByRole('tab', { name: 'Bài viết' })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('tab', { name: 'Đã thích' }))
    expect(screen.getByRole('tab', { name: 'Đã thích' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Chưa có bài viết đã thích')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Đã lưu' }))
    expect(screen.getByText('Chưa có bài viết đã lưu')).toBeInTheDocument()
  })

  it('deleting a post removes THAT post (not always the first one)', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await submitCreatePost(user, 'bài cũ nhất')
    await submitCreatePost(user, 'bài mới nhất')
    await user.click(sidebarLink('Trang cá nhân'))

    const older = screen.getByText('bài cũ nhất').closest('article')!
    await user.click(within(older).getByRole('button', { name: 'Xóa bài viết' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Xóa' }))

    expect(screen.queryByText('bài cũ nhất')).not.toBeInTheDocument()
    expect(screen.getByText('bài mới nhất')).toBeInTheDocument()
  })

  it('"More actions" DropdownMenu opens the report dialog', async () => {
    const user = userEvent.setup()
    renderAt('/profile')
    await user.click(screen.getByRole('button', { name: 'Tùy chọn khác' }))
    await user.click(await screen.findByRole('menuitem', { name: /Báo cáo hồ sơ/ }))
    expect(await screen.findByRole('dialog')).toHaveTextContent('Báo cáo hồ sơ')
  })
})

describe('Toasts', () => {
  it('shows a toast after posting', async () => {
    const user = userEvent.setup()
    renderAt('/explore')
    await submitCreatePost(user, 'Kẹt xe ở Cầu Giấy')
    expect((await screen.findAllByText('Đã đăng bài viết')).length).toBeGreaterThan(0)
    expect(createPostMock).toHaveBeenCalledWith({
      content: 'Kẹt xe ở Cầu Giấy',
      coordinates: { latitude: 21.0362, longitude: 105.7906 },
    })
  })

  it('keeps the dialog open and shows the server error when posting fails', async () => {
    const user = userEvent.setup()
    renderAt('/explore')
    createPostMock.mockRejectedValueOnce(new Error('Server unavailable'))
    await user.click(screen.getAllByRole('button', { name: 'Tạo bài viết' })[0])
    const dialog = await screen.findByRole('dialog')
    const textarea = within(dialog).getByPlaceholderText('Có điều gì đang diễn ra xung quanh bạn?')
    await user.type(textarea, 'Kẹt xe ở Cầu Giấy')
    await user.click(within(dialog).getByRole('button', { name: 'Đăng bài' }))

    expect(await screen.findByText('Server unavailable')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(textarea).toHaveValue('Kẹt xe ở Cầu Giấy')
  })
})

describe('Chat details panel', () => {
  async function openDetails(user: ReturnType<typeof userEvent.setup>) {
    const row = screen
      .getAllByRole('button')
      .find((b) => b.querySelector('span.font-semibold')?.firstChild?.textContent === 'Hoa Phạm')!
    await user.click(row)
    await user.click(screen.getByRole('button', { name: 'Chi tiết cuộc trò chuyện' }))
  }

  it('desktop: inline column, no modal', async () => {
    setViewport(true)
    const user = userEvent.setup()
    renderAt('/messages')
    await openDetails(user)
    expect(screen.getByText('Tắt thông báo')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mobile: opens as a Sheet (dialog) and Report closes it before opening the report dialog', async () => {
    setViewport(false)
    const user = userEvent.setup()
    renderAt('/messages')
    await openDetails(user)
    const sheet = await screen.findByRole('dialog')
    expect(sheet).toHaveTextContent('Chi tiết cuộc trò chuyện')
    await user.click(within(sheet).getByRole('button', { name: 'Báo cáo cuộc trò chuyện' }))
    const report = await screen.findByRole('dialog', { name: /Báo cáo cuộc trò chuyện/ })
    expect(report).toBeInTheDocument()
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })
})

describe('Theme', () => {
  it('ThemeToggle switches the <html> dark class', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getAllByRole('button', { name: 'Đổi giao diện' })[0])
    await user.click(await screen.findByRole('menuitemradio', { name: 'Tối' }))
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'))
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    await user.click(screen.getAllByRole('button', { name: 'Đổi giao diện' })[0])
    await user.click(await screen.findByRole('menuitemradio', { name: 'Sáng' }))
    await waitFor(() => expect(document.documentElement).not.toHaveClass('dark'))
  })
})
