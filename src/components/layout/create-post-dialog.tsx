import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { currentLocation } from '@/lib/mock-nearby'
import { usePosts } from '@/lib/posts-context'

const MAX_LENGTH = 280

export function CreatePostDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const { addPost } = usePosts()
  const [text, setText] = useState('')

  function submit() {
    const value = text.trim()
    if (!value) return
    addPost(value)
    setText('')
    onOpenChange(false)
    toast.success('Post shared', {
      description: 'Your update is now visible to people nearby.',
      action: { label: 'View', onClick: () => navigate('/') },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share an update</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-primary" /> {currentLocation.name}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          value={text}
          maxLength={MAX_LENGTH}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
          }}
          placeholder="What's happening nearby?"
          className="min-h-28"
        />
        <DialogFooter className="items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {text.length}/{MAX_LENGTH}
          </span>
          <Button onClick={submit} disabled={!text.trim()}>
            Post update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
