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
 * Manages a SINGLE GoogleMapsOverlay instance for the map.
 * Supports a layer registry so sub-components can register/unregister their own layers dynamically.
 */
export function DeckOverlay({ children }: DeckOverlayProps) {
  const { map } = useMapContext()
  const overlayRef = useRef<GoogleMapsOverlay | null>(null)
  const layerRegistryRef = useRef<Map<string, Layer[]>>(new Map())

  // Push updated layers to the active overlay
  const syncLayers = () => {
    if (!overlayRef.current) return
    const allLayers: Layer[] = []
    layerRegistryRef.current.forEach((layers) => {
      allLayers.push(...layers)
    })
    overlayRef.current.setProps({ layers: allLayers })
  }

  // Initialize and clean up the overlay instance
  useEffect(() => {
    if (!map) return

    // Determine rendering type: 'VECTOR' enables interleaved deck.gl rendering
    const renderingType = typeof map.getRenderingType === 'function' ? map.getRenderingType() : 'RASTER'
    const interleaved = renderingType === 'VECTOR'

    const overlay = new GoogleMapsOverlay({
      interleaved,
    })

    overlay.setMap(map)
    overlayRef.current = overlay

    // Sync any layers registered prior to or upon map attachment
    syncLayers()

    return () => {
      overlay.setMap(null)
      try {
        overlay.finalize()
      } catch {
        /* ignore any deck cleanup errors */
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
 * Hook to register a set of deck.gl layers to the central DeckOverlay registry.
 * Automatically cleans up layers when unmounted.
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
