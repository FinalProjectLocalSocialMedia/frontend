import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { AuthProvider } from '@/features/auth/context/auth-context'
import { PostsProvider } from '@/features/post/context/posts-context'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PostsProvider>
          {children}
          <Toaster position="top-center" />
        </PostsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
