import { useRef, useState, type ChangeEvent } from 'react'
import { Camera } from 'lucide-react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { requestPostUploadSignature } from '@/features/post/api/post-api'
import { uploadFileToCloudinary } from '@/lib/cloudinary-upload'
import { useUpdateProfileMutation } from '../api/profile-queries'

interface EditProfileDialogProps {
  initialName: string
  initialBio: string
  initialAvatarUrl?: string | null
  initials: string
  avatarFallbackClassName: string
  onClose: () => void
}

function getErrorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || 'Không thể cập nhật hồ sơ.'
  }
  if (error instanceof Error) return error.message
  return 'Không thể cập nhật hồ sơ.'
}

export function EditProfileDialog({
  initialName,
  initialBio,
  initialAvatarUrl,
  initials,
  avatarFallbackClassName,
  onClose,
}: EditProfileDialogProps) {
  const [name, setName] = useState(initialName)
  const [bio, setBio] = useState(initialBio)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const updateProfileMutation = useUpdateProfileMutation()

  const trimmedName = name.trim()
  const isInvalid = !trimmedName || bio.length > 160
  const isBusy = uploadingAvatar || updateProfileMutation.isPending

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploadingAvatar(true)
    try {
      const uploaded = await uploadFileToCloudinary(file, {
        allowedTypes: ['IMAGE'],
        getSignature: requestPostUploadSignature,
        applyDeliveryOptimization: true,
      })
      setAvatarUrl(uploaded.url)
      toast.success('Đã tải ảnh đại diện mới')
    } catch (error) {
      toast.error('Không thể tải ảnh đại diện', {
        description: getErrorMessage(error),
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSave() {
    if (isInvalid || isBusy) return
    try {
      await updateProfileMutation.mutateAsync({
        fullName: trimmedName,
        bio: bio.trim(),
        ...(avatarUrl ? { avatarUrl } : {}),
      })
      toast.success('Đã cập nhật hồ sơ')
      onClose()
    } catch (error) {
      toast.error('Không thể cập nhật hồ sơ', {
        description: getErrorMessage(error),
      })
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isBusy) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa hồ sơ</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <Avatar size="lg">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={trimmedName || 'Ảnh đại diện'} /> : null}
            <AvatarFallback className={avatarFallbackClassName}>{initials}</AvatarFallback>
          </Avatar>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleAvatarChange(event)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={() => avatarInputRef.current?.click()}
          >
            {uploadingAvatar ? (
              <>
                <Spinner /> Đang tải ảnh...
              </>
            ) : (
              <>
                <Camera data-icon="inline-start" /> Đổi ảnh đại diện
              </>
            )}
          </Button>
        </div>

        <label className="grid gap-1.5 text-sm font-medium">
          Tên hiển thị
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Tiểu sử
          <Textarea
            value={bio}
            maxLength={160}
            onChange={(e) => setBio(e.target.value)}
            className="min-h-24"
          />
          <span className="text-xs font-normal text-muted-foreground">{bio.length}/160</span>
        </label>

        {isInvalid && (
          <p className="text-sm text-destructive">
            Vui lòng nhập tên hiển thị và giới hạn tiểu sử dưới 160 ký tự.
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isBusy}>
            Hủy
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={isInvalid || isBusy}>
            {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
