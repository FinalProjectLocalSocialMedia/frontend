import { lazy, Suspense } from 'react'
import { Bell } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { Spinner } from '@/components/ui/spinner'
import ComingSoonPage from '@/pages/coming-soon'
import ExplorePage from '@/pages/explore'
import NotFoundPage from '@/pages/not-found'
import { ProfilePage } from '@/components/profile-page'
import HomeFeed from '@/features/post/pages/home-feed'
import PostDetail from '@/features/post/pages/post-detail'
import PostSearch from '@/features/post/pages/post-search'
import { ChatPage } from '@/features/chat/pages/chat-page'
import AuthPage from '@/features/auth/pages/auth-page'

const AdminRoutes = lazy(() => import('@/routes/admin-routes'))

export function AppRouter() {
  return (
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

      {/* Giao diện chung của người dùng (Sidebar trên desktop, header + bottom nav trên mobile) */}
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
  )
}
