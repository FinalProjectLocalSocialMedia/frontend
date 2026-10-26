import type { PostMedia } from '../types/post-media'
import { requestPostUploadSignature } from './post-api'

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

function getCloudinaryDeliveryUrl(url: string): string {
  return url.replace('/upload/', '/upload/f_auto,q_auto/')
}

export async function uploadPostMedia(file: File): Promise<PostMedia> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY
  if (!cloudName || !apiKey) {
    throw new Error('Cloudinary upload is not configured')
  }

  const mediaType = file.type.startsWith('video/')
    ? 'VIDEO'
    : file.type.startsWith('image/')
      ? 'IMAGE'
      : null
  if (!mediaType) {
    throw new Error('Only image and video files can be uploaded')
  }

  const resourceType = mediaType === 'VIDEO' ? 'video' : 'image'

  const signature = await requestPostUploadSignature()
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

  if (
    typeof result.asset_id !== 'string' ||
    typeof result.public_id !== 'string' ||
    typeof result.secure_url !== 'string' ||
    typeof result.width !== 'number' ||
    typeof result.height !== 'number' ||
    typeof result.format !== 'string' ||
    typeof result.bytes !== 'number'
  ) {
    throw new Error('Cloudinary returned an invalid upload response')
  }

  return {
    type: mediaType,
    publicId: result.public_id,
    assetId: result.asset_id,
    url: getCloudinaryDeliveryUrl(result.secure_url),
    width: result.width,
    height: result.height,
    format: result.format,
    size: result.bytes,
    ...(typeof result.duration === 'number' ? { duration: result.duration } : {}),
  }
}
