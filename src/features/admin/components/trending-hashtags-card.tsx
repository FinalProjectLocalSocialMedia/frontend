import { ArrowDownRight, ArrowUpRight, Hash, Minus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TrendingHashtag } from '@/features/admin-moderation/lib/types'
import { cn } from '@/lib/utils'

interface TrendingHashtagsCardProps {
  hashtags?: TrendingHashtag[]
  isLoading?: boolean
}

export function TrendingHashtagsCard({
  hashtags = [],
  isLoading = false,
}: TrendingHashtagsCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const maxPostCount = hashtags.length > 0 ? Math.max(...hashtags.map((h) => h.postCount), 1) : 1

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Hash className="size-4 text-primary" />
              Chủ đề thịnh hành (Hashtags)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Top các thẻ hashtag được gắn trong bài viết nhiều nhất
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {hashtags.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Chưa có hashtag nào trong khoảng thời gian này
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs hover:bg-transparent">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Hashtag</TableHead>
                <TableHead className="w-28 text-right">Số bài</TableHead>
                <TableHead className="w-24 text-right">Thay đổi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hashtags.map((item, index) => {
                const percent = Math.round((item.postCount / maxPostCount) * 100)
                const isPositive = item.changePct > 0
                const isNegative = item.changePct < 0

                return (
                  <TableRow key={item.hashtagId} className="text-xs">
                    <TableCell className="font-mono text-center text-muted-foreground">
                      <span
                        className={cn(
                          'inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
                          index === 0 &&
                            'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold',
                          index === 1 && 'bg-slate-500/20 text-slate-700 dark:text-slate-300',
                          index === 2 && 'bg-amber-700/20 text-amber-900 dark:text-amber-500',
                          index > 2 && 'text-muted-foreground',
                        )}
                      >
                        {index + 1}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground">#{item.name}</span>
                        <Progress value={percent} className="h-1.5 w-full bg-muted" />
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-medium font-mono text-foreground">
                      {item.postCount.toLocaleString()}
                    </TableCell>

                    <TableCell className="text-right font-mono">
                      <div
                        className={cn(
                          'inline-flex items-center gap-0.5 text-[11px] font-semibold',
                          isPositive && 'text-emerald-600 dark:text-emerald-400',
                          isNegative && 'text-rose-600 dark:text-rose-400',
                          !isPositive && !isNegative && 'text-muted-foreground',
                        )}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="size-3 shrink-0" />
                        ) : isNegative ? (
                          <ArrowDownRight className="size-3 shrink-0" />
                        ) : (
                          <Minus className="size-3 shrink-0" />
                        )}
                        <span>{Math.abs(item.changePct)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
