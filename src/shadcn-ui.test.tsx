import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { setViewport } from '@/test-setup'

const renderAt = (path: string) =>
  render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </StrictMode>,
  )
const sidebarLink = (name: string) =>
  within(screen.getAllByRole('navigation', { name: 'Primary' })[0]).getByRole('link', { name })

async function createPost(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getAllByRole('button', { name: 'Create Post' })[0])
  const dialog = await screen.findByRole('dialog')
  await user.type(within(dialog).getByPlaceholderText("What's happening nearby?"), text)
  await user.click(within(dialog).getByRole('button', { name: 'Post update' }))
}

describe('Explore', () => {
  it('radius Select filters the visible posts', async () => {
    const user = userEvent.setup()
    renderAt('/explore')
    const trigger = screen.getByRole('combobox', { name: 'Search radius' })
    expect(trigger).toHaveTextContent('5 km')
    const before = screen.getAllByRole('article').length
    await user.click(trigger)
    await user.click(await screen.findByRole('option', { name: '1 km' }))
    expect(screen.getByRole('combobox', { name: 'Search radius' })).toHaveTextContent('1 km')
    expect(screen.getAllByRole('article').length).toBeLessThan(before)
  })

  it('Heatmap Toggle flips aria-pressed and its label', async () => {
    const user = userEvent.setup()
    renderAt('/explore')
    const toggle = screen.getByRole('button', { name: /Heatmap on/ })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await user.click(toggle)
    expect(screen.getByRole('button', { name: /Heatmap off/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})

describe('PostCard menu', () => {
  it('Save post shows a toast and the post appears in Profile → Saved', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const article = screen.getAllByRole('article')[0]
    const text = article.querySelector('p.leading-6')!.textContent!
    await user.click(within(article).getByRole('button', { name: 'More options' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Save post' }))
    expect(await screen.findByText('Saved to your posts')).toBeInTheDocument()

    await user.click(sidebarLink('Profile'))
    await user.click(screen.getByRole('tab', { name: 'Saved' }))
    expect(await screen.findByText(text)).toBeInTheDocument()
  })

  it('own posts can be deleted from the menu, others can be reported', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const others = screen
      .getAllByRole('article')
      .find((article) => article.textContent?.includes('Huy Phạm'))!
    await user.click(within(others).getByRole('button', { name: 'More options' }))
    expect(await screen.findByRole('menuitem', { name: 'Report post' })).toBeInTheDocument()
    await user.keyboard('{Escape}')

    await createPost(user, 'bài của tôi để xoá')
    await user.click(
      within(screen.getAllByRole('article')[0]).getByRole('button', { name: 'More options' }),
    )
    await user.click(await screen.findByRole('menuitem', { name: 'Delete post' }))
    expect(screen.queryByText('bài của tôi để xoá')).not.toBeInTheDocument()
  })
})

describe('Profile', () => {
  it('Tabs switch panels, Liked shows liked posts', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(
      within(screen.getAllByRole('article')[0]).getByRole('button', { name: 'Like' }),
    )
    await user.click(sidebarLink('Profile'))

    expect(screen.getByRole('tab', { name: 'Posts' })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('tab', { name: 'Liked' }))
    expect(screen.getByRole('tab', { name: 'Liked' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('article')).toHaveLength(1)
    await user.click(screen.getByRole('tab', { name: 'Saved' }))
    expect(screen.getByText('No saved posts yet')).toBeInTheDocument()
  })

  it('deleting a post removes THAT post (not always the first one)', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await createPost(user, 'bài cũ nhất')
    await createPost(user, 'bài mới nhất')
    await user.click(sidebarLink('Profile'))

    const older = screen.getByText('bài cũ nhất').closest('article')!
    await user.click(within(older).getByRole('button', { name: 'Delete post' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(screen.queryByText('bài cũ nhất')).not.toBeInTheDocument()
    expect(screen.getByText('bài mới nhất')).toBeInTheDocument()
  })

  it('"More actions" DropdownMenu opens the report dialog', async () => {
    const user = userEvent.setup()
    renderAt('/profile')
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(await screen.findByRole('menuitem', { name: /Report profile/ }))
    expect(await screen.findByRole('dialog')).toHaveTextContent('Report profile')
  })
})

describe('Toasts', () => {
  it('shows a toast after posting', async () => {
    const user = userEvent.setup()
    renderAt('/explore')
    await createPost(user, 'Kẹt xe ở Cầu Giấy')
    expect((await screen.findAllByText('Post shared')).length).toBeGreaterThan(0)
  })
})

describe('Chat details panel', () => {
  async function openDetails(user: ReturnType<typeof userEvent.setup>) {
    const row = screen
      .getAllByRole('button')
      .find((b) => b.querySelector('span.font-semibold')?.firstChild?.textContent === 'Hoa Phạm')!
    await user.click(row)
    await user.click(screen.getByRole('button', { name: 'Conversation details' }))
  }

  it('desktop: inline column, no modal', async () => {
    setViewport(true)
    const user = userEvent.setup()
    renderAt('/messages')
    await openDetails(user)
    expect(screen.getByText('Mute notifications')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mobile: opens as a Sheet (dialog) and Report closes it before opening the report dialog', async () => {
    setViewport(false)
    const user = userEvent.setup()
    renderAt('/messages')
    await openDetails(user)
    const sheet = await screen.findByRole('dialog')
    expect(sheet).toHaveTextContent('Conversation details')
    await user.click(within(sheet).getByRole('button', { name: 'Report conversation' }))
    const report = await screen.findByRole('dialog', { name: /Report conversation/ })
    expect(report).toBeInTheDocument()
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })
})

describe('Theme', () => {
  it('ThemeToggle switches the <html> dark class', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getAllByRole('button', { name: 'Change theme' })[0])
    await user.click(await screen.findByRole('menuitemradio', { name: 'Dark' }))
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'))
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    await user.click(screen.getAllByRole('button', { name: 'Change theme' })[0])
    await user.click(await screen.findByRole('menuitemradio', { name: 'Light' }))
    await waitFor(() => expect(document.documentElement).not.toHaveClass('dark'))
  })
})
