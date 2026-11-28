import { useContext, useState, type ReactNode } from 'react'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { AuthProvider } from '@/features/auth/context/auth-context'
import { Toaster } from '@/components/ui/sonner'
import { QueryClient, QueryClientContext, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { NotificationStreamBridge } from './notification-stream-bridge'
import { NavBadgesBridge } from './nav-badges-bridge'
import { ViewTrackerProvider } from '@/features/post/context/view-tracker-context'

export function Providers({ children }: { children: ReactNode }) {
  const existingClient = useContext(QueryClientContext)
  const [defaultClient] = useState(() => new QueryClient())
  const queryClient = existingClient ?? defaultClient

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ViewTrackerProvider>
            <NotificationStreamBridge />
            <NavBadgesBridge>{children}</NavBadgesBridge>
            <Toaster position="top-center" />
          </ViewTrackerProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
