import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, within, cleanup, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { createPost, getFeed } from '@/features/post/api/post-api'
import type { GetFeedParams } from '@/features/post/api/post-api'
import type { PostCursorPage } from './features/post/types/post'
import { uploadPostMedia } from '@/features/post/api/post-upload-api'
import type { Post } from '@/features/post/types/post'
import type { CreatePostRequest } from './features/post/api/post-api'
import type { PostMedia } from '@/features/post/types/post-media'

vi.mock('@/features/post/api/post-api', () => ({
  createPost: vi.fn(),
  getFeed: vi.fn(),
  searchPosts: vi.fn(),
}))

vi.mock('@/features/post/api/post-upload-api', () => ({
  uploadPostMedia: vi.fn(),
}))

const createPostMock = vi.mocked(createPost)
const getFeedMock = vi.mocked(getFeed)
const uploadPostMediaMock = vi.mocked(uploadPostMedia)

afterEach(() => {
  vi.unstubAllGlobals()
})

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

const renderAt = (
  path: string,
  feedResponder?: (params: GetFeedParams) => Promise<PostCursorPage>,
) => {
  createPostMock.mockReset()
  createPostMock.mockImplementation(async (request: CreatePostRequest) =>
    makeCreatedPost(request.content),
  )
  getFeedMock.mockReset()
  getFeedMock.mockImplementation(
    feedResponder ?? (async () => ({ items: [], nextCursor: null, hasNextPage: false })),
  )
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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
const navs = () => screen.getAllByRole('navigation', { name: 'Primary' })

describe('AppLayout', () => {
  it('loads the first Home feed page from the feed API', async () => {
    renderAt('/')
    await waitFor(() => expect(getFeedMock).toHaveBeenCalledWith({ cursor: undefined, limit: 20 }))
  })

  it('loads the next Home feed page when the end sentinel intersects', async () => {
    let intersectionCallback: IntersectionObserverCallback | undefined
    class TestIntersectionObserver implements IntersectionObserver {
      readonly root = null
      readonly rootMargin = '240px'
      readonly thresholds = [0]
      observe = vi.fn()
      disconnect = vi.fn()
      unobserve = vi.fn()
      takeRecords = () => []

      constructor(callback: IntersectionObserverCallback) {
        intersectionCallback = callback
      }
    }

    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)
    renderAt('/', async ({ cursor }) => ({
      items: [],
      nextCursor: cursor ? null : 'cursor-2',
      hasNextPage: false,
    }))

    await waitFor(() => expect(intersectionCallback).toBeDefined())
    act(() => {
      intersectionCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    })
    await waitFor(() =>
      expect(getFeedMock).toHaveBeenNthCalledWith(2, { cursor: 'cursor-2', limit: 20 }),
    )
  })

  it('renders ONE sidebar nav + ONE bottom nav, and exactly one <main>', () => {
    renderAt('/')
    expect(navs()).toHaveLength(2)
    expect(document.querySelectorAll('main')).toHaveLength(1)
    const sidebarNav = navs()[0]
    expect(
      within(sidebarNav)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['/', '/explore', '/notifications', '/messages', '/profile'])
    const bottom = navs()[1]
    expect(
      within(bottom)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['/', '/explore', '/messages', '/profile'])
  })

  it('marks the current page and navigates with the router', async () => {
    const user = userEvent.setup()
    renderAt('/')
    expect(within(navs()[0]).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await user.click(within(navs()[0]).getByRole('link', { name: 'Explore' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Explore' })).toBeInTheDocument()
    expect(within(navs()[0]).getByRole('link', { name: 'Explore' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(navs()[0]).getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    )
    await user.click(within(navs()[1]).getByRole('link', { name: 'Profile' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Nguyễn Minh' })).toBeInTheDocument()
  })

  it('Notifications/unknown routes render inside the same layout', () => {
    renderAt('/notifications')
    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument()
    expect(navs()).toHaveLength(2)
    cleanup()
    renderAt('/nope')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(navs()).toHaveLength(2)
  })

  it('Create Post works from any page and the post shows on Home + Profile', async () => {
    const user = userEvent.setup()
    renderAt('/explore')
    await user.click(screen.getAllByRole('button', { name: 'Create Post' })[0])
    const dialog = await screen.findByRole('dialog')
    const submit = within(dialog).getByRole('button', { name: 'Post update' })
    expect(submit).toBeDisabled()
    await user.type(
      within(dialog).getByPlaceholderText("What's happening nearby?"),
      'Mưa to ở Cầu Giấy #Mưa',
    )
    await user.click(submit)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await user.click(within(navs()[0]).getByRole('link', { name: 'Home' }))
    expect(
      screen
        .getAllByRole('article')
        .some((article) => article.textContent?.includes('Mưa to ở Cầu Giấy #Mưa')),
    ).toBe(true)
    await user.click(within(navs()[0]).getByRole('link', { name: 'Profile' }))
    expect(
      screen
        .getAllByRole('article')
        .some((article) => article.textContent?.includes('Mưa to ở Cầu Giấy #Mưa')),
    ).toBe(true)
  })

  it('allows creating a media-only post after uploading an attachment', async () => {
    const user = userEvent.setup()
    const media: PostMedia = {
      type: 'IMAGE',
      publicId: 'photo',
      assetId: 'asset-photo',
      url: 'https://res.cloudinary.com/test/image/upload/f_auto,q_auto/photo.jpg',
      width: 640,
      height: 480,
      format: 'jpg',
      size: 1200,
    }
    uploadPostMediaMock.mockResolvedValue(media)
    renderAt('/')
    await user.click(screen.getAllByRole('button', { name: 'Create Post' })[0])
    const dialog = await screen.findByRole('dialog')
    await user.upload(
      within(dialog).getByLabelText('Choose photos or videos'),
      new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }),
    )

    await screen.findByRole('button', { name: 'Remove photo' })
    await user.click(within(dialog).getByRole('button', { name: 'Post update' }))

    await waitFor(() =>
      expect(createPostMock).toHaveBeenCalledWith(
        expect.objectContaining({ content: '', media: [media] }),
      ),
    )
  })

  it('Home composer card opens the same dialog', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getByText(/What's happening around you/))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('Messages: list stays mounted after selecting a conversation, no global mobile header', async () => {
    const user = userEvent.setup()
    renderAt('/messages')
    expect(document.querySelectorAll('main')).toHaveLength(1)
    expect(document.querySelector('header.sticky')).toBeNull()
    const list = screen.getByRole('heading', { name: 'Messages' })
    const row = screen
      .getAllByRole('button')
      .find((b) => b.querySelector('span.font-semibold')?.firstChild?.textContent === 'Hoa Phạm')!
    await user.click(row)
    expect(list).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Hoa Phạm' })).toBeInTheDocument()
  })

  it('other pages keep the mobile header', () => {
    renderAt('/explore')
    expect(document.querySelector('header.sticky')).not.toBeNull()
  })

  it('Chat: sending updates the list preview and survives a remount (StrictMode)', async () => {
    const user = userEvent.setup()
    const rowFor = (name: string) =>
      screen
        .getAllByRole('button')
        .find((b) => b.querySelector('span.font-semibold')?.firstChild?.textContent === name)!
    const { unmount } = renderAt('/messages')
    await user.click(rowFor('Nam Trần'))
    await user.type(screen.getByPlaceholderText('Write a message...'), 'xin chào{Enter}')
    expect(within(rowFor('Nam Trần')).getByText('xin chào')).toBeInTheDocument()
    unmount()
    renderAt('/messages')
    expect(within(rowFor('Nam Trần')).getByText('xin chào')).toBeInTheDocument()
  })
})
