import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  detectUploadMediaType,
  uploadFilesToCloudinary,
  uploadFileToCloudinary,
  validateMediaFile,
} from './cloudinary-upload'

describe('cloudinary-upload utility', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('detects IMAGE, VIDEO, and AUDIO files accurately and rejects unsupported types', () => {
    const imgFile = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    const videoFile = new File(['vid'], 'clip.mp4', { type: 'video/mp4' })
    const audioFile = new File(['aud'], 'voice.m4a', { type: 'audio/mp4' })
    const pdfFile = new File(['doc'], 'report.pdf', { type: 'application/pdf' })

    expect(detectUploadMediaType(imgFile)).toBe('IMAGE')
    expect(detectUploadMediaType(videoFile)).toBe('VIDEO')
    expect(detectUploadMediaType(audioFile)).toBe('AUDIO')
    expect(detectUploadMediaType(pdfFile)).toBeNull()

    expect(validateMediaFile(audioFile, ['IMAGE', 'VIDEO', 'AUDIO'])).toBe('AUDIO')
    expect(() => validateMediaFile(audioFile, ['IMAGE', 'VIDEO'])).toThrow(/Chỉ hỗ trợ tệp ảnh hoặc video/)
    expect(() => validateMediaFile(pdfFile, ['IMAGE', 'VIDEO', 'AUDIO'])).toThrow(
      /Chỉ hỗ trợ ảnh, video hoặc tệp ghi âm/,
    )
  })

  it('uploads audio file via video/upload endpoint and returns full Cloudinary metadata', async () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'demo-cloud')
    vi.stubEnv('VITE_CLOUDINARY_API_KEY', '123456')

    const getSignature = vi.fn().mockResolvedValue({
      signature: 'sig-abc',
      timestamp: 1700000000,
      folder: 'chat',
    })

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          asset_id: 'asset-audio-1',
          public_id: 'chat/voice-1',
          secure_url: 'https://res.cloudinary.com/demo-cloud/video/upload/v1/chat/voice-1.mp3',
          format: 'mp3',
          bytes: 48200,
          duration: 12.45,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const file = new File(['audio-bytes'], 'voice-note.mp3', { type: 'audio/mpeg' })
    const result = await uploadFileToCloudinary(file, {
      allowedTypes: ['IMAGE', 'VIDEO', 'AUDIO'],
      getSignature,
    })

    expect(getSignature).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cloudinary.com/v1_1/demo-cloud/video/upload',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result).toEqual({
      type: 'AUDIO',
      publicId: 'chat/voice-1',
      assetId: 'asset-audio-1',
      url: 'https://res.cloudinary.com/demo-cloud/video/upload/v1/chat/voice-1.mp3',
      format: 'mp3',
      size: 48200,
      duration: 12.45,
      name: 'voice-note.mp3',
    })
  })

  it('fetches signature only once when uploading a batch of files', async () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'demo-cloud')
    vi.stubEnv('VITE_CLOUDINARY_API_KEY', '123456')

    const getSignature = vi.fn().mockResolvedValue({
      signature: 'sig-batch',
      timestamp: 1700000001,
      folder: 'chat',
    })

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(
        JSON.stringify({
          asset_id: 'asset-img',
          public_id: 'chat/img',
          secure_url: 'https://res.cloudinary.com/demo-cloud/image/upload/v1/chat/img.png',
          format: 'png',
          bytes: 10240,
          width: 800,
          height: 600,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const files = [
      new File(['1'], 'one.png', { type: 'image/png' }),
      new File(['2'], 'two.png', { type: 'image/png' }),
    ]

    const results = await uploadFilesToCloudinary(files, {
      allowedTypes: ['IMAGE', 'VIDEO', 'AUDIO'],
      getSignature,
    })

    expect(getSignature).toHaveBeenCalledTimes(1)
    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      type: 'IMAGE',
      width: 800,
      height: 600,
      format: 'png',
      size: 10240,
      assetId: 'asset-img',
      publicId: 'chat/img',
    })
  })
})

