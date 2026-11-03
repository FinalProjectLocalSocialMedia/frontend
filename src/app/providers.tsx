import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { AuthProvider } from '@/features/auth/context/auth-context'
import { PostInteractionsProvider } from '@/features/post/context/post-interactions-context'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PostInteractionsProvider>
          {children}
          <Toaster position="top-center" />
        </PostInteractionsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
