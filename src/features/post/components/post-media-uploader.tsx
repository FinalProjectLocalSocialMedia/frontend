import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ImagePlus, LoaderCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PostMediaItem } from '@/features/post/components/post-media-item'
import type { PostMedia } from '@/features/post/types/post-media'

type PostMediaUploaderProps = {
  media: PostMedia[]
  onMediaChange: (media: PostMedia[]) => void
  uploadFile: (file: File) => Promise<PostMedia>
  disabled?: boolean
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred'
}

export function PostMediaUploader({
  media,
  onMediaChange,
  uploadFile,
  disabled = false,
}: PostMediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const uploadMutation = useMutation({ mutationFn: uploadFile })

  async function handleFilesSelected(files: FileList | null) {
    if (!files?.length) return

    setError(null)
    const uploadedMedia = [...media]
    const uploadErrors: string[] = []

    for (const file of Array.from(files)) {
      await new Promise<void>((resolve) => {
        uploadMutation.mutate(file, {
          onSuccess: (uploaded) => {
            uploadedMedia.push(uploaded)
            onMediaChange([...uploadedMedia])
            resolve()
          },
          onError: (uploadError) => {
            uploadErrors.push(`${file.name}: ${getErrorMessage(uploadError)}`)
            resolve()
          },
        })
      })
    }

    if (inputRef.current) inputRef.current.value = ''
    if (uploadErrors.length) {
      setError(`Could not upload ${uploadErrors.join('; ')}`)
    }
  }

  function removeMedia(assetId: string) {
    onMediaChange(media.filter((item) => item.assetId !== assetId))
  }

  return (
    <div className="space-y-3">
      <Input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        aria-label="Choose photos or videos"
        disabled={disabled || uploadMutation.isPending}
        onChange={(event) => void handleFilesSelected(event.target.files)}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploadMutation.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {uploadMutation.isPending ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
          {uploadMutation.isPending ? 'Uploading media…' : 'Add photos or videos'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {media.length > 0 && (
        <ul aria-label="Attached media" className="flex flex-wrap gap-2">
          {media.map((item) => (
            <li
              key={item.assetId}
              className="relative size-20 overflow-hidden rounded-md border border-border"
            >
              <PostMediaItem media={item} controls={false} className="size-full object-cover" />
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                aria-label={`Remove ${item.publicId}`}
                className="absolute top-1 right-1"
                disabled={disabled || uploadMutation.isPending}
                onClick={() => removeMedia(item.assetId)}
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
