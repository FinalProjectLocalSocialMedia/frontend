import { apiClient } from '@/lib/api-client'
import type { MediaItem } from '../types/chat'

type CloudinaryUploadResponse = {
  asset_id?: unknown
  public_id?: unknown
  secure_url?: unknown
  width?: unknown
  height?: unknown
  format?: unknown
  bytes?: unknown
  duration?: unknown
  resource_type?: unknown
  error?: { message?: string }
}

export async function requestChatUploadSignature(): Promise<{
  signature: string
  timestamp: number
  folder: string
}> {
  const res = await apiClient.post<{
    signature: string
    timestamp: number
    folder: string
  }>('/chat/signature')
  return res.data
}

export async function uploadChatMedia(file: File): Promise<MediaItem> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY
  if (!cloudName || !apiKey) {
    throw new Error('Cloudinary upload is not configured in client environment')
  }

  let mediaType = 'FILE'
  let resourceType = 'raw'

  if (file.type.startsWith('image/')) {
    mediaType = 'IMAGE'
    resourceType = 'image'
  } else if (file.type.startsWith('video/')) {
    mediaType = 'VIDEO'
    resourceType = 'video'
  }

  const signature = await requestChatUploadSignature()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', apiKey)
  formData.append('timestamp', String(signature.timestamp))
  formData.append('folder', signature.folder)
  formData.append('signature', signature.signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`,
    { method: 'POST', body: formData },
  )
  const result = (await response.json()) as CloudinaryUploadResponse

  if (!response.ok) {
    throw new Error(result.error?.message ?? `Cloudinary upload failed (${response.status})`)
  }

  if (typeof result.secure_url !== 'string') {
    throw new Error('Cloudinary returned an invalid upload response: missing secure_url')
  }

  return {
    url: result.secure_url,
    type: mediaType,
    name: file.name,
    size: typeof result.bytes === 'number' ? result.bytes : file.size,
  }
}
