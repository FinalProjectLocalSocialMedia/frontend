import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RadiusControl } from './radius-control'
import { WindowControl } from './window-control'
import { LocateButton } from './locate-button'
import { PickLocationButton } from './pick-location-button'
import { MapSearchBar } from './map-search-bar'

describe('Explore Map Controls', () => {
  it('RadiusControl renders all radius options and triggers onChange', () => {
    const handleChange = vi.fn()
    render(<RadiusControl value={3} onChange={handleChange} />)

    expect(screen.getByText('1 km')).toBeInTheDocument()
    expect(screen.getByText('3 km')).toBeInTheDocument()
    expect(screen.getByText('5 km')).toBeInTheDocument()
    expect(screen.getByText('10 km')).toBeInTheDocument()

    fireEvent.click(screen.getByText('5 km'))
    expect(handleChange).toHaveBeenCalledWith(5)
  })

  it('WindowControl renders window options and triggers onChange', () => {
    const handleChange = vi.fn()
    render(<WindowControl value="7d" onChange={handleChange} />)

    expect(screen.getByText('Hôm nay')).toBeInTheDocument()
    expect(screen.getByText('7 ngày')).toBeInTheDocument()
    expect(screen.getByText('30 ngày')).toBeInTheDocument()

    fireEvent.click(screen.getByText('30 ngày'))
    expect(handleChange).toHaveBeenCalledWith('30d')
  })

  it('LocateButton fires onClick callback', () => {
    const handleClick = vi.fn()
    render(<LocateButton onClick={handleClick} />)

    const btn = screen.getByRole('button', { name: /Vị trí của tôi/i })
    fireEvent.click(btn)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('PickLocationButton toggles active state', () => {
    const handleToggle = vi.fn()
    const { rerender } = render(<PickLocationButton isPicking={false} onToggle={handleToggle} />)

    const btn = screen.getByRole('button', { name: /Chọn vị trí/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(btn)
    expect(handleToggle).toHaveBeenCalledTimes(1)

    rerender(<PickLocationButton isPicking={true} onToggle={handleToggle} />)
    expect(screen.getByRole('button', { name: /Chọn vị trí/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Nhấp chọn trên bản đồ')).toBeInTheDocument()
  })

  it('MapSearchBar accepts text and triggers submit on Enter', () => {
    const handleChange = vi.fn()
    const handleSubmit = vi.fn()

    render(
      <MapSearchBar
        value="Hồ Tây"
        onChange={handleChange}
        onSubmit={handleSubmit}
      />,
    )

    const input = screen.getByLabelText('Tìm kiếm trên bản đồ')
    expect(input).toHaveValue('Hồ Tây')

    fireEvent.change(input, { target: { value: 'Cầu Giấy' } })
    expect(handleChange).toHaveBeenCalledWith('Cầu Giấy')

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })
})
