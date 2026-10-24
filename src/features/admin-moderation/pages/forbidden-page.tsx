import { ShieldAlert } from 'lucide-react'
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
 * Trang lỗi 403 khi nhân viên truy cập vào tài nguyên vượt quá quyền hạn (mục 5.6).
 */
export default function ForbiddenPage() {
  usePageTitle('403 - Không đủ quyền')
  const { user } = useAuth()

  const homePath = user ? `${ADMIN_BASE}/${defaultRouteForRole(user.role)}` : `${ADMIN_BASE}/login`

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Empty className="max-w-md border border-dashed py-12">
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="size-12 rounded-xl bg-destructive/10 text-destructive"
          >
            <ShieldAlert className="size-6!" />
          </EmptyMedia>
          {/* Thẻ h1 duy nhất trên trang 403 */}
          <EmptyTitle>
            <h1 className="text-xl font-bold">403 - Không có quyền truy cập</h1>
          </EmptyTitle>
          <EmptyDescription className="text-sm text-muted-foreground">
            Tài khoản của bạn không có quyền hạn cần thiết để truy cập tài nguyên hoặc chức năng
            này.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="mt-4">
          <Button nativeButton={false} render={<Link to={homePath} />}>
            Về trang chủ của bạn
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
