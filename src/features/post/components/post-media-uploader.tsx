import { useRef } from 'react'
import { ImagePlus, LoaderCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { StagedMediaFile } from '@/hooks/use-staged-media'
import { PostMediaItem } from '@/features/post/components/post-media-item'

type PostMediaUploaderProps = {
  stagedFiles: StagedMediaFile<'IMAGE' | 'VIDEO'>[]
  onFilesAdd: (files: FileList | null) => void
  onFileRemove: (id: string) => void
  error?: string | null
  disabled?: boolean
  isUploading?: boolean
}

export function PostMediaUploader({
  stagedFiles,
  onFilesAdd,
  onFileRemove,
  error = null,
  disabled = false,
  isUploading = false,
}: PostMediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isBusy = disabled || isUploading

  function handleFilesSelected(files: FileList | null) {
    if (!files?.length) return
    onFilesAdd(files)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <Input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        aria-label="Chọn ảnh hoặc video"
        disabled={isBusy}
        onChange={(event) => handleFilesSelected(event.target.files)}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
          {isUploading ? 'Đang tải lên…' : 'Thêm ảnh hoặc video'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {stagedFiles.length > 0 && (
        <ul aria-label="Phương tiện đính kèm" className="flex flex-wrap gap-2">
          {stagedFiles.map((item) => (
            <li
              key={item.id}
              className="relative size-20 overflow-hidden rounded-md border border-border"
            >
              <PostMediaItem
                media={{
                  type: item.type,
                  publicId: item.label,
                  assetId: item.id,
                  url: item.previewUrl,
                  width: 0,
                  height: 0,
                  format: '',
                  size: item.size,
                }}
                controls={false}
                className="size-full object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                aria-label={`Xóa ${item.label}`}
                className="absolute top-1 right-1"
                disabled={isBusy}
                onClick={() => onFileRemove(item.id)}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
