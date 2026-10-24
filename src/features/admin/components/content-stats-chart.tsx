import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import type { PostsTimePoint } from '@/features/admin-moderation/lib/types'

const chartConfig = {
  count: {
    label: 'Số bài viết',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

interface ContentStatsChartProps {
  series?: PostsTimePoint[]
  isLoading?: boolean
  rangeLabel: string
}

export function ContentStatsChart({
  series = [],
  isLoading = false,
  rangeLabel,
}: ContentStatsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  // Format short date: "2026-10-24" -> "24/10"
  const formattedData = series.map((item) => {
    const parts = item.date.split('-')
    const shortLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date
    return {
      date: item.date,
      displayDate: shortLabel,
      count: item.count,
    }
  })

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold text-foreground">
            Biểu đồ tần suất đăng bài theo ngày
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Số lượng bài viết mới được tạo trong {rangeLabel}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {formattedData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl">
            Chưa có dữ liệu bài viết trong khoảng thời gian đã chọn
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillPostCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />

              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-[11px] fill-muted-foreground"
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                className="text-[11px] fill-muted-foreground"
              />

              <ChartTooltip
                cursor={{
                  stroke: 'hsl(var(--muted-foreground))',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_label, payload) => {
                      const item = payload[0]?.payload as { date?: string } | undefined
                      return item?.date ? `Ngày: ${item.date}` : _label
                    }}
                  />
                }
              />

              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#fillPostCount)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
