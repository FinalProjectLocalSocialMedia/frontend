import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MapSidePanel } from './map-side-panel'

describe('Khung MapSidePanel (PHA 3B - M17 / 6.4b)', () => {
  it('tuyệt đối không có role="dialog", aria-modal="true" và không render backdrop overlay', () => {
    const handleClose = vi.fn()
    const { container } = render(
      <MapSidePanel isOpen={true} onClose={handleClose} title="Tiêu đề thử nghiệm">
        <div>Nội dung kiểm thử</div>
      </MapSidePanel>,
    )

    // Tuyệt đối không có role="dialog" để không khoá tương tác bản đồ
    expect(screen.queryByRole('dialog')).toBeNull()

    // Không có thuộc tính aria-modal="true"
    expect(container.querySelector('[aria-modal="true"]')).toBeNull()

    // Không có backdrop hay overlay toàn màn hình
    expect(container.querySelector('.fixed.inset-0')).toBeNull()

    // Sử dụng thẻ aside ngữ nghĩa
    expect(container.querySelector('aside')).not.toBeNull()
    expect(screen.getByText('Nội dung kiểm thử')).toBeDefined()
  })

  it('chỉ có duy nhất một nút đóng và bấm vào gọi callback onClose', () => {
    const handleClose = vi.fn()
    render(
      <MapSidePanel isOpen={true} onClose={handleClose} title="Tiêu đề thử nghiệm">
        <div>Nội dung kiểm thử</div>
      </MapSidePanel>,
    )

    // Kiểm tra chỉ có duy nhất một nút đóng có aria-label="Đóng"
    const closeButtons = screen.getAllByRole('button', { name: /đóng/i })
    expect(closeButtons).toHaveLength(1)

    // Bấm nút đóng
    fireEvent.click(closeButtons[0])
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('lắng nghe và kích hoạt đóng panel khi người dùng nhấn phím Escape', () => {
    const handleClose = vi.fn()
    render(
      <MapSidePanel isOpen={true} onClose={handleClose} title="Tiêu đề thử nghiệm">
        <div>Nội dung kiểm thử</div>
      </MapSidePanel>,
    )

    // Nhấn phím Escape
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
