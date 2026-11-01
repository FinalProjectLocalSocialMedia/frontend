export type UploadMediaType = 'IMAGE' | 'VIDEO' | 'AUDIO'

export interface CloudinarySignature {
  signature: string
  audioSignature?: string
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

const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|m4a|aac|flac|opus|weba|3gp)$/i
const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|mkv|avi|m4v)$/i
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|avif|heic|svg)$/i

export function detectUploadMediaType(file: File): UploadMediaType | null {
  const mime = file.type.toLowerCase()
  if (mime.startsWith('image/')) return 'IMAGE'
  if (mime.startsWith('audio/')) return 'AUDIO'
  // File .m4a trên một số trình duyệt/OS có thể báo mime video/mp4 hoặc audio/x-m4a, ưu tiên kiểm tra đuôi .m4a là AUDIO
  if (AUDIO_EXTENSIONS.test(file.name)) return 'AUDIO'
  if (mime.startsWith('video/')) return 'VIDEO'

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

export function getCloudinaryAudioDeliveryUrl(url: string, format?: string): string {
  // Với định dạng 3gp hoặc raw upload, giữ nguyên URL gốc để tránh lỗi bộ giải mã video của Cloudinary
  if (!url.includes('/video/upload/') || format?.toLowerCase() === '3gp') {
    return url
  }
  // Nén bit-rate âm thanh ở tầng CDN delivery (br_128k) giúp giảm dung lượng tải mà không làm lỗi bước upload
  return url.replace('/video/upload/', '/video/upload/br_128k/')
}

async function postToCloudinaryEndpoint(
  cloudName: string,
  resourceType: 'image' | 'video' | 'raw',
  formData: FormData,
): Promise<{ ok: boolean; status: number; result: CloudinaryUploadRawResponse }> {
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`,
    { method: 'POST', body: formData },
  )
  const result = (await response.json()) as CloudinaryUploadRawResponse
  return { ok: response.ok, status: response.status, result }
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
  const signatureData = options.signature ?? (await options.getSignature())

  const isAudio = mediaType === 'AUDIO'
  // Nếu là AUDIO và backend đã cấp audioSignature (không ký kèm q_auto),
  // không gửi transformation=q_auto lúc upload để tránh lỗi "Unsupported video format: 3gp" với file .m4a/.3gp
  const useAudioSignature = isAudio && Boolean(signatureData.audioSignature)
  const activeSignature = useAudioSignature
    ? signatureData.audioSignature!
    : signatureData.signature

  function buildFormData(includeTransformation: boolean): FormData {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('api_key', apiKey)
    fd.append('timestamp', String(signatureData.timestamp))
    fd.append('folder', signatureData.folder)
    if (includeTransformation) {
      fd.append('transformation', 'q_auto')
    }
    fd.append('signature', activeSignature)
    return fd
  }

  const primaryResourceType = mediaType === 'IMAGE' ? 'image' : 'video'
  let uploadAttempt = await postToCloudinaryEndpoint(
    cloudName,
    primaryResourceType,
    buildFormData(!useAudioSignature),
  )

  // Dự phòng: Nếu file ghi âm (.m4a/.3gp đặc thù) vẫn bị endpoint /video/upload từ chối định dạng,
  // tự động chuyển sang /raw/upload với cùng audioSignature (không tốn thêm request lấy chữ ký)
  if (!uploadAttempt.ok && isAudio && useAudioSignature) {
    uploadAttempt = await postToCloudinaryEndpoint(
      cloudName,
      'raw',
      buildFormData(false),
    )
  }

  const { ok, status, result } = uploadAttempt

  if (!ok) {
    throw new Error(result.error?.message ?? `Tải tệp lên Cloudinary thất bại (${status})`)
  }

  const fallbackFormat = file.name.includes('.')
    ? (file.name.split('.').pop()?.toLowerCase() ?? 'bin')
    : 'bin'
  const resolvedFormat =
    typeof result.format === 'string' && result.format.trim() ? result.format : fallbackFormat

  if (
    typeof result.asset_id !== 'string' ||
    typeof result.public_id !== 'string' ||
    typeof result.secure_url !== 'string' ||
    typeof result.bytes !== 'number'
  ) {
    throw new Error('Phản hồi từ Cloudinary không hợp lệ.')
  }

  const rawUrl = result.secure_url
  let finalUrl = rawUrl
  if (isAudio && options.applyDeliveryOptimization) {
    finalUrl = getCloudinaryAudioDeliveryUrl(rawUrl, resolvedFormat)
  } else if (!isAudio && options.applyDeliveryOptimization) {
    finalUrl = getCloudinaryDeliveryUrl(rawUrl)
  }

  return {
    type: mediaType,
    publicId: result.public_id,
    assetId: result.asset_id,
    url: finalUrl,
    format: resolvedFormat,
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
