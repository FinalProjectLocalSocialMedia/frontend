import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'

const renderAt = (path: string) =>
  render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </StrictMode>,
  )
const navs = () => screen.getAllByRole('navigation', { name: 'Primary' })

describe('AppLayout', () => {
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
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(within(navs()[0]).getByRole('link', { name: 'Home' }))
    expect(screen.getByText('Mưa to ở Cầu Giấy #Mưa')).toBeInTheDocument()
    await user.click(within(navs()[0]).getByRole('link', { name: 'Profile' }))
    expect(screen.getByText('Mưa to ở Cầu Giấy #Mưa')).toBeInTheDocument()
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
