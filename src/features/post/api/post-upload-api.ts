import {
  uploadFileToCloudinary,
  type CloudinarySignature,
} from '@/lib/cloudinary-upload'
import type { PostMedia } from '../types/post-media'
import { requestPostUploadSignature } from './post-api'

const POST_ALLOWED_MEDIA_TYPES = ['IMAGE', 'VIDEO'] as const

export async function uploadPostMedia(
  file: File,
  signature?: CloudinarySignature,
): Promise<PostMedia> {
  const uploaded = await uploadFileToCloudinary(file, {
    allowedTypes: POST_ALLOWED_MEDIA_TYPES,
    getSignature: requestPostUploadSignature,
    signature,
    applyDeliveryOptimization: true,
  })

  if (typeof uploaded.width !== 'number' || typeof uploaded.height !== 'number') {
    throw new Error('Phản hồi từ Cloudinary thiếu kích thước ảnh/video.')
  }

  return {
    type: uploaded.type,
    publicId: uploaded.publicId,
    assetId: uploaded.assetId,
    url: uploaded.url,
    width: uploaded.width,
    height: uploaded.height,
    format: uploaded.format,
    size: uploaded.size,
    ...(typeof uploaded.duration === 'number' ? { duration: uploaded.duration } : {}),
  }
}

export async function uploadPostMediaBatch(files: readonly File[]): Promise<PostMedia[]> {
  if (files.length === 0) return []
  const signature = await requestPostUploadSignature()
  return Promise.all(files.map((file) => uploadPostMedia(file, signature)))
}
