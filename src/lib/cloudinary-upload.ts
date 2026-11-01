export type UploadMediaType = 'IMAGE' | 'VIDEO' | 'AUDIO'

export interface CloudinarySignature {
  signature: string
  timestamp: number
  folder: string
}

export interface CloudinaryMediaMetadata<T extends UploadMediaType = UploadMediaType> {
  type: T
  publicId: string
  assetId: string
  url: string
  format: string
  size: number
  width?: number
  height?: number
  duration?: number
  name: string
}

export interface UploadToCloudinaryOptions<T extends UploadMediaType = UploadMediaType> {
  allowedTypes: readonly T[]
  getSignature: () => Promise<CloudinarySignature>
  signature?: CloudinarySignature
  applyDeliveryOptimization?: boolean
}

type CloudinaryUploadRawResponse = {
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

const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|m4a|aac|flac|opus|weba)$/i
const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|mkv|avi|m4v)$/i
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|avif|heic|svg)$/i

export function detectUploadMediaType(file: File): UploadMediaType | null {
  const mime = file.type.toLowerCase()
  if (mime.startsWith('image/')) return 'IMAGE'
  if (mime.startsWith('video/')) return 'VIDEO'
  if (mime.startsWith('audio/')) return 'AUDIO'

  if (AUDIO_EXTENSIONS.test(file.name)) return 'AUDIO'
  if (VIDEO_EXTENSIONS.test(file.name)) return 'VIDEO'
  if (IMAGE_EXTENSIONS.test(file.name)) return 'IMAGE'

  return null
}

export function validateMediaFile<T extends UploadMediaType>(
  file: File,
  allowedTypes: readonly T[],
): T {
  const detected = detectUploadMediaType(file)
  if (!detected || !allowedTypes.includes(detected as T)) {
    const supportsAudio = (allowedTypes as readonly UploadMediaType[]).includes('AUDIO')
    throw new Error(
      supportsAudio
        ? `Tệp "${file.name}" không hợp lệ. Chỉ hỗ trợ ảnh, video hoặc tệp ghi âm.`
        : `Tệp "${file.name}" không hợp lệ. Chỉ hỗ trợ tệp ảnh hoặc video.`,
    )
  }
  return detected as T
}

export function getCloudinaryDeliveryUrl(url: string): string {
  return url.replace('/upload/', '/upload/f_auto,q_auto/')
}

export async function uploadFileToCloudinary<T extends UploadMediaType = UploadMediaType>(
  file: File,
  options: UploadToCloudinaryOptions<T>,
): Promise<CloudinaryMediaMetadata<T>> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY
  if (!cloudName || !apiKey) {
    throw new Error('Chưa cấu hình thông tin tải tệp Cloudinary ở môi trường client.')
  }

  const mediaType = validateMediaFile(file, options.allowedTypes)
  // Cloudinary xử lý cả video và audio qua endpoint /video/upload để hỗ trợ transformation q_auto và trả về duration
  const resourceType = mediaType === 'IMAGE' ? 'image' : 'video'

  const signature = options.signature ?? (await options.getSignature())
  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', apiKey)
  formData.append('timestamp', String(signature.timestamp))
  formData.append('folder', signature.folder)
  formData.append('transformation', 'q_auto')
  formData.append('signature', signature.signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`,
    { method: 'POST', body: formData },
  )
  const result = (await response.json()) as CloudinaryUploadRawResponse

  if (!response.ok) {
    throw new Error(result.error?.message ?? `Tải tệp lên Cloudinary thất bại (${response.status})`)
  }

  if (
    typeof result.asset_id !== 'string' ||
    typeof result.public_id !== 'string' ||
    typeof result.secure_url !== 'string' ||
    typeof result.format !== 'string' ||
    typeof result.bytes !== 'number'
  ) {
    throw new Error('Phản hồi từ Cloudinary không hợp lệ.')
  }

  const rawUrl = result.secure_url
  const finalUrl =
    options.applyDeliveryOptimization && mediaType !== 'AUDIO'
      ? getCloudinaryDeliveryUrl(rawUrl)
      : rawUrl

  const fallbackFormat = file.name.includes('.')
    ? (file.name.split('.').pop()?.toLowerCase() ?? '')
    : ''

  return {
    type: mediaType,
    publicId: result.public_id,
    assetId: result.asset_id,
    url: finalUrl,
    format: result.format || fallbackFormat,
    size: result.bytes,
    ...(typeof result.width === 'number' ? { width: result.width } : {}),
    ...(typeof result.height === 'number' ? { height: result.height } : {}),
    ...(typeof result.duration === 'number' ? { duration: result.duration } : {}),
    name: file.name,
  }
}

export async function uploadFilesToCloudinary<T extends UploadMediaType = UploadMediaType>(
  files: readonly File[],
  options: Omit<UploadToCloudinaryOptions<T>, 'signature'>,
): Promise<CloudinaryMediaMetadata<T>[]> {
  if (files.length === 0) return []

  for (const file of files) {
    validateMediaFile(file, options.allowedTypes)
  }

  const signature = await options.getSignature()
  return Promise.all(
    files.map((file) =>
      uploadFileToCloudinary(file, {
        ...options,
        signature,
      }),
    ),
  )
}

