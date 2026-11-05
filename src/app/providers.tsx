import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { AuthProvider } from '@/features/auth/context/auth-context'
import { PostInteractionsProvider } from '@/features/post/context/post-interactions-context'
import { Toaster } from '@/components/ui/sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
export function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient()
  return (
    <QueryClientProvider client={queryClient}>

    <ThemeProvider>
      <AuthProvider>
        <PostInteractionsProvider>
          {children}
          <Toaster position="top-center" />
        </PostInteractionsProvider>
      </AuthProvider>
    </ThemeProvider>
    <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
