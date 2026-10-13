import { Bell } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { AppLayout } from '@/components/layout/app-layout'
import { ChatPage } from '@/components/chat-page'
import { ProfilePage } from '@/components/profile-page'
import { PostsProvider } from '@/lib/posts-context'
import ComingSoonPage from '@/pages/coming-soon'
import { Toaster } from '@/components/ui/sonner'
import ExplorePage from '@/pages/explore'
import HomePage from '@/pages/home'
import NotFoundPage from '@/pages/not-found'

export default function App() {
  return (
    <ThemeProvider>
      <PostsProvider>
        <Routes>
          {/* Every page shares AppLayout (Sidebar on desktop, header + bottom nav on mobile). */}
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="messages" element={<ChatPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route
              path="notifications"
              element={<ComingSoonPage title="Notifications" icon={Bell} />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        <Toaster position="top-center" />
      </PostsProvider>
    </ThemeProvider>
  )
}
