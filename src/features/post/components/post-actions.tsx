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
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Could not copy. Please copy it manually.')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="More options"
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
            toast(saved ? 'Removed from saved posts' : 'Saved to your posts')
          }}
        >
          {saved ? <BookmarkCheck /> : <Bookmark />}
          {saved ? 'Unsave post' : 'Save post'}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => void copyText(post.content)}>
          <Copy /> Copy text
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isOwn ? (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              removePost(post.id)
              toast.success('Post deleted')
            }}
          >
            <Trash2 /> Delete post
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              toast.success('Report submitted', {
                description: 'Thanks for helping keep nearby. safe.',
              })
            }
          >
            <Flag /> Report post
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
