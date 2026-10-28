import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { GoogleMapsOverlay } from '@deck.gl/google-maps'
import type { Layer } from '@deck.gl/core'
import { useMapContext } from './map-context'

type DeckOverlayContextValue = {
  setLayers: (id: string, layers: Layer[]) => void
  removeLayers: (id: string) => void
}

const DeckOverlayContext = createContext<DeckOverlayContextValue | null>(null)

export type DeckOverlayProps = {
  children?: ReactNode
}

/**
 * Quản lý DUY NHẤT một instance GoogleMapsOverlay cho bản đồ.
 * Hỗ trợ cơ chế đăng ký layer tập trung để các component con có thể tự động thêm/xoá layer của mình.
 */
export function DeckOverlay({ children }: DeckOverlayProps) {
  const { map } = useMapContext()
  const overlayRef = useRef<GoogleMapsOverlay | null>(null)
  const layerRegistryRef = useRef<Map<string, Layer[]>>(new Map())

  // Đẩy danh sách layer đã cập nhật vào overlay đang hoạt động
  const syncLayers = () => {
    if (!overlayRef.current) return
    const allLayers: Layer[] = []
    layerRegistryRef.current.forEach((layers) => {
      allLayers.push(...layers)
    })
    overlayRef.current.setProps({ layers: allLayers })
  }

  // Khởi tạo và dọn dẹp instance overlay
  useEffect(() => {
    if (!map) return

    // Ép buộc chế độ overlaid (interleaved: false) để tương thích ổn định với HeatmapLayer của deck.gl
    // Giới hạn useDevicePixels <= 1.5 theo mục 7.3b để tối ưu hoá hiệu năng render GPU
    const devicePixels = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1

    const overlay = new GoogleMapsOverlay({
      interleaved: false,
      useDevicePixels: devicePixels,
    })

    overlay.setMap(map)
    overlayRef.current = overlay

    // Đồng bộ bất kỳ layer nào đã đăng ký trước đó hoặc ngay khi gắn bản đồ
    syncLayers()

    return () => {
      overlay.setMap(null)
      try {
        overlay.finalize()
      } catch {
        /* bỏ qua lỗi dọn dẹp nếu có */
      }
      overlayRef.current = null
    }
  }, [map])

  const contextValue: DeckOverlayContextValue = {
    setLayers: (id: string, layers: Layer[]) => {
      layerRegistryRef.current.set(id, layers)
      syncLayers()
    },
    removeLayers: (id: string) => {
      layerRegistryRef.current.delete(id)
      syncLayers()
    },
  }

  return (
    <DeckOverlayContext.Provider value={contextValue}>
      {children}
    </DeckOverlayContext.Provider>
  )
}

/**
 * Hook để đăng ký một tập hợp layer deck.gl vào registry tập trung của DeckOverlay.
 * Tự động dọn dẹp các layer khi component unmount.
 */
export function useDeckLayers(id: string, layers: Layer[]) {
  const context = useContext(DeckOverlayContext)

  useEffect(() => {
    if (!context) return
    context.setLayers(id, layers)
    return () => {
      context.removeLayers(id)
    }
  }, [context, id, layers])
}
