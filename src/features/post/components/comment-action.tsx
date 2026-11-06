import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Copy, Flag, MoreHorizontal, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Comment } from "../types/comment"



export const CommentAction = ({ comment, isOwnComment, deleteCommentMutation }: { comment: Comment; isOwnComment: boolean; deleteCommentMutation: any }) => {

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    async function copyComment() {
        try {
            await navigator.clipboard.writeText(comment.content)
            toast.success('Đã sao chép bình luận')
        } catch {
            toast.error('Không thể sao chép. Vui lòng sao chép thủ công.')
        }
    }
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon-sm" aria-label="Tùy chọn bình luận" />}
                >
                    <MoreHorizontal />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => void copyComment()}>
                        <Copy /> Sao chép bình luận
                    </DropdownMenuItem>
                    {isOwnComment ? (
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                            <Trash2 /> Xóa bình luận
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
                            <Flag /> Báo cáo bình luận
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
                <AlertDialog
                    open={deleteDialogOpen}
                    onOpenChange={(open) => {
                        if (!deleteCommentMutation.isPending) {
                            setDeleteDialogOpen(open)
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Xóa bình luận này?</AlertDialogTitle>
                            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteCommentMutation.isPending}>
                                Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction
                                variant="destructive"
                                disabled={deleteCommentMutation.isPending}
                                onClick={() => {
                                    deleteCommentMutation.mutate(comment.id, {
                                        onSuccess: () => setDeleteDialogOpen(false),
                                    })
                                }}
                            >
                                {deleteCommentMutation.isPending ? 'Đang xóa...' : 'Xóa'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenu>
        </>
    )
}