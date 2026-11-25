import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
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
import { useSharePost } from '../hooks/use-share-post'
import type { PostSearchItem } from '../types/post'
import { useUserLocation } from '@/features/map/hooks/use-user-location'

interface PostShareComposerProps {
    post: PostSearchItem
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PostShareComposer({ post, open, onOpenChange }: PostShareComposerProps) {
    const [content, setContent] = useState('')
    const shareMutation = useSharePost()
    const { gpsPosition, isLoadingGps } = useUserLocation({})
    const hasGPS = gpsPosition?.latitude != null && gpsPosition?.longitude != null

    function submitShare(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault()
        const trimmedContent = content.trim()
        if (!trimmedContent || shareMutation.isPending) return

        shareMutation.mutate(
            { postId: post.id, content: trimmedContent, gpsPosition: gpsPosition },
            {
                onSuccess: () => {
                    setContent('')
                    onOpenChange(false)
                },
            },
        )
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!shareMutation.isPending) onOpenChange(nextOpen)
            }}
        >
            <DialogContent>
                <form onSubmit={submitShare} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>Chia sẻ bài viết</DialogTitle>
                        <DialogDescription>
                            Viết nội dung kèm theo bài viết của {post.author.fullName}.
                        </DialogDescription>
                    </DialogHeader>

                    <Textarea
                        aria-label="Nội dung chia sẻ"
                        autoFocus
                        placeholder="Bạn muốn chia sẻ điều gì?"
                        required
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        disabled={shareMutation.isPending && !hasGPS}
                    />

                    <div className="rounded-lg border border-border bg-muted/40 p-3">
                        <p className="text-sm font-medium text-foreground">{post.author.fullName}</p>
                        <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                            {post.content}
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={shareMutation.isPending}
                            onClick={() => onOpenChange(false)}
                        >
                            Hủy
                        </Button>
                        <Button type="submit" disabled={!content.trim() || shareMutation.isPending}>
                            {shareMutation.isPending ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Đang chia sẻ...
                                </>
                            ) : (
                                'Chia sẻ'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
