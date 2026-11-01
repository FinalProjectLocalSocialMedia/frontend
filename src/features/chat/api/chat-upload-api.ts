import { apiClient } from '@/lib/api-client'
import {
  uploadFileToCloudinary,
  uploadFilesToCloudinary,
  type CloudinarySignature,
} from '@/lib/cloudinary-upload'
import type { MediaItem } from '../types/chat'

const CHAT_ALLOWED_MEDIA_TYPES = ['IMAGE', 'VIDEO', 'AUDIO'] as const

export async function requestChatUploadSignature(): Promise<CloudinarySignature> {
  const res = await apiClient.post<CloudinarySignature>('/chat/signature')
  return res.data
}

export async function uploadChatMedia(
  file: File,
  signature?: CloudinarySignature,
): Promise<MediaItem> {
  const uploaded = await uploadFileToCloudinary(file, {
    allowedTypes: CHAT_ALLOWED_MEDIA_TYPES,
    getSignature: requestChatUploadSignature,
    signature,
    applyDeliveryOptimization: false,
  })

  return {
    url: uploaded.url,
    type: uploaded.type,
    size: uploaded.size,
    format: uploaded.format,
    assetId: uploaded.assetId,
    publicId: uploaded.publicId,
    ...(typeof uploaded.width === 'number' ? { width: uploaded.width } : {}),
    ...(typeof uploaded.height === 'number' ? { height: uploaded.height } : {}),
    ...(typeof uploaded.duration === 'number' ? { duration: uploaded.duration } : {}),
    name: uploaded.name,
  }
}

export async function uploadChatMediaBatch(files: readonly File[]): Promise<MediaItem[]> {
  const uploadedList = await uploadFilesToCloudinary(files, {
    allowedTypes: CHAT_ALLOWED_MEDIA_TYPES,
    getSignature: requestChatUploadSignature,
    applyDeliveryOptimization: false,
  })

  return uploadedList.map((uploaded) => ({
    url: uploaded.url,
    type: uploaded.type,
    size: uploaded.size,
    format: uploaded.format,
    assetId: uploaded.assetId,
    publicId: uploaded.publicId,
    ...(typeof uploaded.width === 'number' ? { width: uploaded.width } : {}),
    ...(typeof uploaded.height === 'number' ? { height: uploaded.height } : {}),
    ...(typeof uploaded.duration === 'number' ? { duration: uploaded.duration } : {}),
    name: uploaded.name,
  }))
}
