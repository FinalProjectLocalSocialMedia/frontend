import { FileQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { useAuth } from '../auth/auth-context'
import { defaultRouteForRole } from '../auth/permissions'
import { ADMIN_BASE } from '../lib/constants'
import { usePageTitle } from '../lib/use-page-title'

/**
 * Trang 404 trong khu vực quản trị khi truy cập URL không tồn tại.
 */
export default function AdminNotFoundPage() {
  usePageTitle('404 - Không tìm thấy trang')
  const { user } = useAuth()

  const homePath = user
    ? `${ADMIN_BASE}/${defaultRouteForRole(user.role)}`
    : `${ADMIN_BASE}/login`

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Empty className="max-w-md border border-dashed py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-12 rounded-xl bg-muted text-muted-foreground">
            <FileQuestion className="size-6!" />
          </EmptyMedia>
          <EmptyTitle>
            <h1 className="text-xl font-bold">404 - Không tìm thấy trang</h1>
          </EmptyTitle>
          <EmptyDescription className="text-sm text-muted-foreground">
            Đường dẫn trong khu vực quản trị bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="mt-4">
          <Button nativeButton={false} render={<Link to={homePath} />}>
            Về trang chủ
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
