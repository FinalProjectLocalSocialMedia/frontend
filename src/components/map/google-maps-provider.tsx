import { type ReactNode } from 'react'
import { APIProvider } from '@vis.gl/react-google-maps'
import { VITE_GOOGLE_MAPS_API_KEY } from '@/config/env'

export type GoogleMapsProviderProps = {
  children?: ReactNode
  apiKey?: string
}

/**
 * Loads the Google Maps JavaScript API with Vietnamese locale and async script loading.
 * API key defaults to VITE_GOOGLE_MAPS_API_KEY from @/config/env.
 */
export function GoogleMapsProvider({
  children,
  apiKey = VITE_GOOGLE_MAPS_API_KEY || '',
}: GoogleMapsProviderProps) {
  return (
    <APIProvider
      apiKey={apiKey}
      language="vi"
      region="VN"
      libraries={['maps', 'marker']}
    >
      {children}
    </APIProvider>
  )
}
