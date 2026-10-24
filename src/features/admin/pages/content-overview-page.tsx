import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  FileText,
  Minus,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { usePendingReportCount } from '@/features/admin-moderation/api/shell.queries'
import { PageHeader } from '@/features/admin-moderation/components/page-header'
import type { StatsRange } from '@/features/admin-moderation/lib/types'
import { cn } from '@/lib/utils'
import {
  usePostStats,
  useTrendingHashtags,
  useTrendingPosts,
} from '../api/stats.queries'
import { ContentStatsChart } from '../components/content-stats-chart'
import { TrendingHashtagsCard } from '../components/trending-hashtags-card'
import { TrendingPostsCard } from '../components/trending-posts-card'

const RANGE_LABELS: Record<StatsRange, string> = {
  '7d': '7 ngày qua',
  '30d': '30 ngày qua',
  '90d': '90 ngày qua',
}

export function ContentOverviewPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawRange = searchParams.get('range') as StatsRange | null
  const currentRange: StatsRange =
    rawRange === '30d' || rawRange === '90d' ? rawRange : '7d'

  const handleRangeChange = (val: string) => {
    if (!val) return
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('range', val)
    setSearchParams(nextParams)
  }

  // Data queries
  const {
    data: postStats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
    isFetching: isStatsFetching,
  } = usePostStats(currentRange)

  const {
    data: trendingHashtags,
    isLoading: isHashtagsLoading,
    refetch: refetchHashtags,
    isFetching: isHashtagsFetching,
  } = useTrendingHashtags(currentRange, 10)

  const {
    data: trendingPosts,
    isLoading: isPostsLoading,
    refetch: refetchPosts,
    isFetching: isPostsFetching,
  } = useTrendingPosts(currentRange, 10)

  const { data: pendingReportCount = 0 } = usePendingReportCount()

  const isRefreshing = isStatsFetching || isHashtagsFetching || isPostsFetching

  const handleRefreshAll = () => {
    refetchStats()
    refetchHashtags()
    refetchPosts()
  }

  const overview = postStats?.overview
  const isPositiveGrowth = overview && overview.growthPct > 0
  const isNegativeGrowth = overview && overview.growthPct < 0

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Quản lý & Thống kê nội dung"
          description="Theo dõi tăng trưởng bài viết, chủ đề thịnh hành và đo lường tương tác trên toàn hệ thống."
        />

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Preset Range Selector */}
          <ToggleGroup
            value={[currentRange]}
            onValueChange={(val) => {
              if (val && val[0]) handleRangeChange(val[0])
            }}
            className="border rounded-lg p-0.5 bg-muted/40"
          >
            <ToggleGroupItem
              value="7d"
              className="text-xs px-2.5 py-1 h-7 data-[state=on]:bg-background data-[state=on]:shadow-xs"
            >
              7 ngày
            </ToggleGroupItem>
            <ToggleGroupItem
              value="30d"
              className="text-xs px-2.5 py-1 h-7 data-[state=on]:bg-background data-[state=on]:shadow-xs"
            >
              30 ngày
            </ToggleGroupItem>
            <ToggleGroupItem
              value="90d"
              className="text-xs px-2.5 py-1 h-7 data-[state=on]:bg-background data-[state=on]:shadow-xs"
            >
              90 ngày
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="gap-1.5 text-xs h-8"
          >
            <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Thẻ tóm tắt báo cáo nội dung chờ xử lý */}
      {pendingReportCount > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                Đang có {pendingReportCount} báo cáo vi phạm nội dung đang chờ kiểm duyệt
              </p>
              <p className="text-muted-foreground pt-0.5">
                Các bài viết và bình luận bị cộng đồng báo cáo cần được xem xét xử lý theo quy chuẩn.
              </p>
            </div>
          </div>

          <Link
            to="/admin/reports?type=content"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'gap-1 text-xs shrink-0 border-amber-500/40 hover:bg-amber-500/20'
            )}
          >
            <span>Đến trang Báo cáo</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tổng số bài viết */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Tổng số bài viết</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {isStatsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span>{overview?.totalPosts.toLocaleString() ?? '—'}</span>
              )}
              <FileText className="size-5 text-muted-foreground/50" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground">
            {isStatsLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span>Bài viết đang hoạt động trên hệ thống</span>
            )}
          </CardContent>
        </Card>

        {/* KPI 2: Bài viết mới trong kỳ */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">
              Bài viết mới ({RANGE_LABELS[currentRange]})
            </CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {isStatsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span>
                  {currentRange === '7d'
                    ? overview?.newPosts.last7d.toLocaleString()
                    : currentRange === '30d'
                      ? overview?.newPosts.last30d.toLocaleString()
                      : postStats?.series.reduce((sum, s) => sum + s.count, 0).toLocaleString()}
                </span>
              )}
              <TrendingUp className="size-5 text-primary/50" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground">
            {isStatsLoading ? (
              <Skeleton className="h-4 w-36" />
            ) : (
              <span>Hôm nay: +{overview?.newPosts.today ?? 0} bài mới</span>
            )}
          </CardContent>
        </Card>

        {/* KPI 3: Tăng trưởng % so với kỳ trước */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Tăng trưởng so với kỳ trước</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {isStatsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div
                  className={cn(
                    'flex items-center gap-1 font-mono',
                    isPositiveGrowth && 'text-emerald-600 dark:text-emerald-400',
                    isNegativeGrowth && 'text-rose-600 dark:text-rose-400',
                    !isPositiveGrowth && !isNegativeGrowth && 'text-foreground'
                  )}
                >
                  {isPositiveGrowth ? (
                    <ArrowUpRight className="size-6 shrink-0" />
                  ) : isNegativeGrowth ? (
                    <ArrowDownRight className="size-6 shrink-0" />
                  ) : (
                    <Minus className="size-6 shrink-0" />
                  )}
                  <span>{overview?.growthPct ?? 0}%</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground">
            {isStatsLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span>So sánh với {RANGE_LABELS[currentRange]} liền trước</span>
            )}
          </CardContent>
        </Card>

        {/* KPI 4: Tác giả hoạt động */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Tác giả hoạt động</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {isStatsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span>{overview?.activeAuthors.toLocaleString() ?? '—'}</span>
              )}
              <Users className="size-5 text-muted-foreground/50" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground">
            {isStatsLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span>Người dùng đã đăng bài trong {RANGE_LABELS[currentRange]}</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid: Biểu đồ chuỗi thời gian & Hashtag thịnh hành */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ContentStatsChart
            series={postStats?.series}
            isLoading={isStatsLoading}
            rangeLabel={RANGE_LABELS[currentRange]}
          />
        </div>

        <div className="lg:col-span-1">
          <TrendingHashtagsCard
            hashtags={trendingHashtags}
            isLoading={isHashtagsLoading}
          />
        </div>
      </div>

      {/* Bài viết thịnh hành */}
      <TrendingPostsCard
        posts={trendingPosts}
        isLoading={isPostsLoading}
      />
    </div>
  )
}
