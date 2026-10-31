import { Bookmark, BookmarkCheck, Copy, Flag, MoreHorizontal, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PostSearchItem } from '../types/post'

interface PostActionsProps {
  post: PostSearchItem
  saved: boolean
  isOwn: boolean
  toggleSaved: (id: PostSearchItem['id']) => void
  removePost: (id: PostSearchItem['id']) => void
}

export function PostActions({ post, saved, isOwn, toggleSaved, removePost }: PostActionsProps) {
  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Đã sao chép vào bộ nhớ tạm')
    } catch {
      toast.error('Không thể sao chép. Vui lòng sao chép thủ công.')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Tùy chọn khác"
            className="-mr-2 -mt-1 text-muted-foreground"
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => {
            toggleSaved(post.id)
            toast(saved ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết')
          }}
        >
          {saved ? <BookmarkCheck /> : <Bookmark />}
          {saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => void copyText(post.content)}>
          <Copy /> Sao chép nội dung
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isOwn ? (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              removePost(post.id)
              toast.success('Đã xóa bài viết')
            }}
          >
            <Trash2 /> Xóa bài viết
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              toast.success('Đã gửi báo cáo', {
                description: 'Cảm ơn bạn đã góp phần giữ an toàn cho Nearby.',
              })
            }
          >
            <Flag /> Báo cáo bài viết
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
