import { useEffect, useRef, useState } from 'react'
import {
  validateMediaFile,
  type UploadMediaType,
} from '@/lib/cloudinary-upload'

export interface StagedMediaFile<T extends UploadMediaType = UploadMediaType> {
  id: string
  file: File
  previewUrl: string
  type: T
  name: string
  label: string
  size: number
}

export interface StagedMediaBatch<T extends UploadMediaType = UploadMediaType> {
  items: StagedMediaFile<T>[]
  releaseUrls: () => void
}

export interface UseStagedMediaOptions<T extends UploadMediaType = UploadMediaType> {
  allowedTypes: readonly T[]
  onError?: (message: string) => void
}

function createPreviewUrl(file: File): string {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    return URL.createObjectURL(file)
  }
  return `blob:preview-${file.name}`
}

function revokePreviewUrl(url: string): void {
  if (
    url.startsWith('blob:') &&
    typeof URL !== 'undefined' &&
    typeof URL.revokeObjectURL === 'function'
  ) {
    URL.revokeObjectURL(url)
  }
}

function getFileBaseLabel(fileName: string): string {
  const stripped = fileName.replace(/\.[^.]+$/, '').trim()
  return stripped || fileName
}

let stagedCounter = 0

export function useStagedMedia<T extends UploadMediaType = UploadMediaType>({
  allowedTypes,
  onError,
}: UseStagedMediaOptions<T>) {
  const [stagedFiles, setStagedFiles] = useState<StagedMediaFile<T>[]>([])
  const [error, setError] = useState<string | null>(null)
  const urlsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const activeUrls = urlsRef.current
    return () => {
      for (const url of activeUrls) {
        revokePreviewUrl(url)
      }
      activeUrls.clear()
    }
  }, [])

  function addFiles(fileList: FileList | readonly File[] | null): StagedMediaFile<T>[] {
    if (!fileList || fileList.length === 0) return []

    setError(null)
    const added: StagedMediaFile<T>[] = []
    const errors: string[] = []

    for (const file of Array.from(fileList)) {
      try {
        const mediaType = validateMediaFile(file, allowedTypes)
        const previewUrl = createPreviewUrl(file)
        urlsRef.current.add(previewUrl)
        stagedCounter += 1

        added.push({
          id: `staged-${Date.now()}-${stagedCounter}`,
          file,
          previewUrl,
          type: mediaType,
          name: file.name,
          label: getFileBaseLabel(file.name),
          size: file.size,
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : `Không thể thêm tệp ${file.name}`
        errors.push(msg)
      }
    }

    if (added.length > 0) {
      setStagedFiles((prev) => [...prev, ...added])
    }

    if (errors.length > 0) {
      const combined = errors.join(' ')
      setError(combined)
      onError?.(combined)
    }

    return added
  }

  function removeFile(id: string) {
    setStagedFiles((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target) {
        revokePreviewUrl(target.previewUrl)
        urlsRef.current.delete(target.previewUrl)
      }
      return prev.filter((item) => item.id !== id)
    })
  }

  function clearFiles() {
    setStagedFiles((prev) => {
      for (const item of prev) {
        revokePreviewUrl(item.previewUrl)
        urlsRef.current.delete(item.previewUrl)
      }
      return []
    })
    setError(null)
  }

  /**
   * Tách danh sách stagedFiles hiện tại ra để hiển thị Optimistic UI (vd: tin nhắn "Đang gửi...")
   * mà chưa thu hồi blob URL cho tới khi gọi `releaseUrls()` sau khi upload hoàn tất.
   */
  function takeFiles(): StagedMediaBatch<T> {
    const snapshot = [...stagedFiles]
    setStagedFiles([])
    setError(null)
    return {
      items: snapshot,
      releaseUrls: () => {
        for (const item of snapshot) {
          revokePreviewUrl(item.previewUrl)
          urlsRef.current.delete(item.previewUrl)
        }
      },
    }
  }

  return {
    stagedFiles,
    error,
    setError,
    addFiles,
    removeFile,
    clearFiles,
    takeFiles,
  }
}
