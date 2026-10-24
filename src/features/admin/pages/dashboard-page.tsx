import {
  Activity,
  ArrowRight,
  FileText,
  Flame,
  Hash,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Users,
  UserX,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePendingReportCount } from '@/features/admin-moderation/api/shell.queries'
import { useAuth } from '@/features/admin-moderation/auth/auth-context'
import { PageHeader } from '@/features/admin-moderation/components/page-header'
import { cn } from '@/lib/utils'
import { usePostStats, useTrendingHashtags, useTrendingPosts } from '../api/stats.queries'
import { ContentStatsChart } from '../components/content-stats-chart'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: postStats, isLoading: isStatsLoading, refetch: refetchStats, isFetching: isStatsFetching } =
    usePostStats('7d')
  const { data: trendingHashtags, isLoading: isHashtagsLoading, refetch: refetchHashtags } =
    useTrendingHashtags('7d', 5)
  const { data: trendingPosts, isLoading: isPostsLoading, refetch: refetchPosts } =
    useTrendingPosts('7d', 3)
  const { data: pendingReportCount = 0 } = usePendingReportCount()

  const handleRefresh = () => {
    refetchStats()
    refetchHashtags()
    refetchPosts()
  }

  const overview = postStats?.overview

  return (
    <div className="space-y-6">
      {/* Welcome & System status header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Hệ thống trực tuyến
            </Badge>
          </div>
          <PageHeader
            title={`Chào mừng trở lại, ${user?.email.split('@')[0] || 'Quản trị viên'}`}
            description="Tổng quan tình hình hoạt động nền tảng mạng xã hội theo vị trí (LBSN)."
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isStatsFetching}
            className="text-xs gap-1.5 h-8"
          >
            <RefreshCw className={cn('size-3.5', isStatsFetching && 'animate-spin')} />
            <span>Cập nhật</span>
          </Button>
        </div>
      </div>

      {/* Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          to="/admin/reports"
          className="group p-3 rounded-xl border bg-card hover:bg-accent/40 hover:border-primary/40 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="size-4" />
            </div>
            {pendingReportCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                {pendingReportCount}
              </Badge>
            )}
          </div>
          <span className="text-xs font-semibold text-foreground group-hover:text-primary">
            Báo cáo
          </span>
          <span className="text-[10px] text-muted-foreground">Xử lý vi phạm</span>
        </Link>

        <Link
          to="/admin/accounts"
          className="group p-3 rounded-xl border bg-card hover:bg-accent/40 hover:border-primary/40 transition-all flex flex-col justify-between"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2">
            <UserX className="size-4" />
          </div>
          <span className="text-xs font-semibold text-foreground group-hover:text-primary">
            Tài khoản vi phạm
          </span>
          <span className="text-[10px] text-muted-foreground">Cảnh báo & khoá</span>
        </Link>

        <Link
          to="/admin/content"
          className="group p-3 rounded-xl border bg-card hover:bg-accent/40 hover:border-primary/40 transition-all flex flex-col justify-between"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-2">
            <FileText className="size-4" />
          </div>
          <span className="text-xs font-semibold text-foreground group-hover:text-primary">
            Nội dung
          </span>
          <span className="text-[10px] text-muted-foreground">Thống kê bài viết</span>
        </Link>

        <Link
          to="/admin/users"
          className="group p-3 rounded-xl border bg-card hover:bg-accent/40 hover:border-primary/40 transition-all flex flex-col justify-between"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-2">
            <Users className="size-4" />
          </div>
          <span className="text-xs font-semibold text-foreground group-hover:text-primary">
            Người dùng
          </span>
          <span className="text-[10px] text-muted-foreground">Quản lý tài khoản</span>
        </Link>

        <Link
          to="/admin/locations"
          className="group p-3 rounded-xl border bg-card hover:bg-accent/40 hover:border-primary/40 transition-all flex flex-col justify-between"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
            <MapPin className="size-4" />
          </div>
          <span className="text-xs font-semibold text-foreground group-hover:text-primary">
            Địa điểm
          </span>
          <span className="text-[10px] text-muted-foreground">Toạ độ & danh mục</span>
        </Link>

        <Link
          to="/admin/heatmap"
          className="group p-3 rounded-xl border bg-card hover:bg-accent/40 hover:border-primary/40 transition-all flex flex-col justify-between"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 mb-2">
            <Flame className="size-4" />
          </div>
          <span className="text-xs font-semibold text-foreground group-hover:text-primary">
            Bản đồ nhiệt
          </span>
          <span className="text-[10px] text-muted-foreground">Mật độ vùng H3</span>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Tổng số bài viết</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {isStatsLoading ? <Skeleton className="h-8 w-20" /> : overview?.totalPosts.toLocaleString()}
              <FileText className="size-5 text-muted-foreground/50" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground">
            Hôm nay: +{overview?.newPosts.today ?? 0} bài mới
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Tác giả hoạt động (7 ngày)</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {isStatsLoading ? <Skeleton className="h-8 w-20" /> : overview?.activeAuthors.toLocaleString()}
              <Users className="size-5 text-muted-foreground/50" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground">
            Tài khoản tích cực chia sẻ nội dung
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Tăng trưởng 7 ngày</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {isStatsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">
                  +{overview?.growthPct ?? 0}%
                </span>
              )}
              <Activity className="size-5 text-emerald-500/50" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground">
            So với chu kỳ 7 ngày liền trước
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Báo cáo chờ xử lý</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              <span className={pendingReportCount > 0 ? 'text-amber-600 dark:text-amber-400' : ''}>
                {pendingReportCount}
              </span>
              <ShieldAlert className="size-5 text-amber-500/50" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground">
            Báo cáo từ cộng đồng cần duyệt
          </CardContent>
        </Card>
      </div>

      {/* Main Chart & Side Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ContentStatsChart
            series={postStats?.series}
            isLoading={isStatsLoading}
            rangeLabel="7 ngày qua"
          />
        </div>

        <div className="space-y-6 lg:col-span-1">
          {/* Top Hashtags Mini Card */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Hash className="size-3.5 text-primary" />
                  Hashtag nổi bật
                </CardTitle>
                <CardDescription className="text-[11px]">Top chủ đề trong tuần</CardDescription>
              </div>
              <Link
                to="/admin/content"
                className={cn(buttonVariants({ variant: 'ghost', size: 'xs' }), 'text-[11px] h-7')}
              >
                Xem tất cả <ArrowRight className="size-3 ml-1" />
              </Link>
            </CardHeader>

            <CardContent className="space-y-2">
              {isHashtagsLoading ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
              ) : trendingHashtags && trendingHashtags.length > 0 ? (
                trendingHashtags.map((h, idx) => (
                  <div key={h.hashtagId} className="flex items-center justify-between text-xs py-1 border-b last:border-b-0">
                    <span className="font-medium text-foreground">
                      <span className="text-muted-foreground mr-1.5 font-mono">#{idx + 1}</span>
                      #{h.name}
                    </span>
                    <span className="font-mono text-muted-foreground text-[11px]">
                      {h.postCount} bài
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">Chưa có hashtag</p>
              )}
            </CardContent>
          </Card>

          {/* Top Trending Posts Mini Card */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-500" />
                  Bài viết hot nhất
                </CardTitle>
                <CardDescription className="text-[11px]">Điểm tương tác cao nhất</CardDescription>
              </div>
              <Link
                to="/admin/content"
                className={cn(buttonVariants({ variant: 'ghost', size: 'xs' }), 'text-[11px] h-7')}
              >
                Chi tiết <ArrowRight className="size-3 ml-1" />
              </Link>
            </CardHeader>

            <CardContent className="space-y-2.5">
              {isPostsLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              ) : trendingPosts && trendingPosts.length > 0 ? (
                trendingPosts.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-lg border bg-muted/20 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground truncate max-w-[150px]">
                        {p.author.displayName}
                      </span>
                      <Badge variant="secondary" className="text-[10px] font-mono h-4 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                        {p.score} điểm
                      </Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-1 text-[11px]">
                      {p.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">Chưa có bài viết</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
