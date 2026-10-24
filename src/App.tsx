import { lazy, Suspense } from 'react'
import { Bell } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { AppLayout } from '@/components/layout/app-layout'
import { ChatPage } from '@/components/chat-page'
import { ProfilePage } from '@/components/profile-page'
import { PostsProvider } from '@/lib/posts-context'
import { AuthProvider } from '@/lib/auth-context'
import ComingSoonPage from '@/pages/coming-soon'
import { Spinner } from '@/components/ui/spinner'
import { Toaster } from '@/components/ui/sonner'
import ExplorePage from '@/pages/explore'
import HomePage from '@/pages/home'
import NotFoundPage from '@/pages/not-found'
import AuthPage from '@/pages/auth'
import HomeFeed from './features/post/pages/home-feed'
import PostDetail from './features/post/pages/post-detail'
import PostSearch from './features/post/pages/post-search'


const AdminRoutes = lazy(() => import('@/routes/admin-routes'))

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PostsProvider>
          <Routes>
            
{/* Khu vực quản trị & kiểm duyệt (Lazy chunk riêng) */}
          <Route
            path="admin/*"
            element={
              <Suspense
                fallback={
                  <div className="flex min-h-screen items-center justify-center">
                    <Spinner className="size-6 text-primary" />
                  </div>
                }
              >
                <AdminRoutes />
              </Suspense>
            }
          />
          {/* Every page shares AppLayout (Sidebar on desktop, header + bottom nav on mobile). */}
          <Route element={<AppLayout />}>
            
            <Route index element={<HomeFeed />} />
            <Route path="posts/:postId" element={<PostDetail />} />
            <Route path="search" element={<PostSearch />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="messages" element={<ChatPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="login" element={<AuthPage initialMode="login" />} />
            <Route path="register" element={<AuthPage initialMode="register" />} />
            <Route
              path="notifications"
              element={<ComingSoonPage title="Notifications" icon={Bell} />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        <Toaster position="top-center" />
      </PostsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
