import { useState, useEffect } from 'react'
import { Globe, UserCheck, Loader2, ShieldCheck, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { chatApi } from '../api/chat-api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  isLoggedIn?: boolean
}

export function ChatPrivacyDialog({ open, onClose, isLoggedIn = true }: Props) {
  const [blockStrangers, setBlockStrangers] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !isLoggedIn) return

    let isMounted = true
    setLoading(true)

    chatApi
      .getMySettings()
      .then((data) => {
        if (isMounted && data) {
          setBlockStrangers(Boolean(data.blockStrangers))
        }
      })
      .catch((err) => {
        console.error('Không thể tải cài đặt riêng tư:', err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, isLoggedIn])

  async function handleSave() {
    setSaving(true)
    try {
      await chatApi.updateMySettings({ blockStrangers })
      toast.success('Đã cập nhật cài đặt quyền riêng tư tin nhắn')
      onClose()
    } catch (err: unknown) {
      console.error('Lỗi khi lưu cài đặt tin nhắn:', err)
      toast.error('Không thể lưu cài đặt. Vui lòng thử lại!')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5" />
            <DialogTitle className="text-lg font-semibold">Cài đặt tin nhắn</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Thiết lập ai có quyền gửi tin nhắn và mở cuộc trò chuyện với bạn.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Đang tải cài đặt...</p>
          </div>
        ) : (
          <div className="space-y-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ai có thể nhắn tin cho tôi?
            </p>

            {/* Option 1: Mọi người */}
            <button
              type="button"
              onClick={() => setBlockStrangers(false)}
              className={cn(
                'w-full flex items-start gap-3.5 p-3.5 rounded-2xl border text-left transition-all',
                !blockStrangers
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border/70 hover:bg-muted/50 hover:border-border',
              )}
            >
              <div
                className={cn(
                  'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                  !blockStrangers ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                <Globe className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Mọi người</p>
                  {!blockStrangers && <Check className="size-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Bất kỳ ai trên nền tảng cũng có thể tìm thấy và bắt đầu nhắn tin với bạn.
                </p>
              </div>
            </button>

            {/* Option 2: Những người theo dõi tôi */}
            <button
              type="button"
              onClick={() => setBlockStrangers(true)}
              className={cn(
                'w-full flex items-start gap-3.5 p-3.5 rounded-2xl border text-left transition-all',
                blockStrangers
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border/70 hover:bg-muted/50 hover:border-border',
              )}
            >
              <div
                className={cn(
                  'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                  blockStrangers ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                <UserCheck className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Những người theo dõi tôi</p>
                  {blockStrangers && <Check className="size-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Chỉ những người đã theo dõi (follow) bạn mới có thể nhắn tin. Người lạ sẽ bị chặn.
                </p>
              </div>
            </button>
          </div>
        )}

        <DialogFooter className="mt-2 flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={saving} className="rounded-xl">
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={loading || saving} className="rounded-xl gap-2">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

