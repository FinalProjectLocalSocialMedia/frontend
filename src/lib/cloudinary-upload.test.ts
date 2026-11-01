import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  detectUploadMediaType,
  uploadFilesToCloudinary,
  uploadFileToCloudinary,
  validateMediaFile,
} from './cloudinary-upload'
import { formatRelativeTime, formatTimeVN, parseServerDate } from './date-time'

describe('cloudinary-upload utility', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('detects IMAGE, VIDEO, and AUDIO files accurately (including .m4a with video/mp4 mime) and rejects unsupported types', () => {
    const imgFile = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    const videoFile = new File(['vid'], 'clip.mp4', { type: 'video/mp4' })
    const audioFile = new File(['aud'], 'voice.m4a', { type: 'video/mp4' })
    const pdfFile = new File(['doc'], 'report.pdf', { type: 'application/pdf' })

    expect(detectUploadMediaType(imgFile)).toBe('IMAGE')
    expect(detectUploadMediaType(videoFile)).toBe('VIDEO')
    expect(detectUploadMediaType(audioFile)).toBe('AUDIO')
    expect(detectUploadMediaType(pdfFile)).toBeNull()

    expect(validateMediaFile(audioFile, ['IMAGE', 'VIDEO', 'AUDIO'])).toBe('AUDIO')
    expect(() => validateMediaFile(audioFile, ['IMAGE', 'VIDEO'])).toThrow(
      /Chỉ hỗ trợ tệp ảnh hoặc video/,
    )
    expect(() => validateMediaFile(pdfFile, ['IMAGE', 'VIDEO', 'AUDIO'])).toThrow(
      /Chỉ hỗ trợ ảnh, video hoặc tệp ghi âm/,
    )
  })

  it('uploads audio file using audioSignature without transformation=q_auto and falls back to raw/upload if 3gp is rejected', async () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'demo-cloud')
    vi.stubEnv('VITE_CLOUDINARY_API_KEY', '123456')

    const getSignature = vi.fn().mockResolvedValue({
      signature: 'sig-with-qauto',
      audioSignature: 'sig-audio-no-qauto',
      timestamp: 1700000000,
      folder: 'chat',
    })

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Unsupported video format: 3gp' } }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            asset_id: 'asset-m4a-1',
            public_id: 'chat/voice-1.m4a',
            secure_url: 'https://res.cloudinary.com/demo-cloud/raw/upload/v1/chat/voice-1.m4a',
            bytes: 48200,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )

    const file = new File(['audio-bytes'], 'voice-note.m4a', { type: 'audio/mp4' })
    const result = await uploadFileToCloudinary(file, {
      allowedTypes: ['IMAGE', 'VIDEO', 'AUDIO'],
      getSignature,
      applyDeliveryOptimization: true,
    })

    expect(getSignature).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const firstFormData = fetchMock.mock.calls[0]?.[1]?.body as FormData
    expect(firstFormData.get('signature')).toBe('sig-audio-no-qauto')
    expect(firstFormData.get('transformation')).toBeNull()

    expect(result).toEqual({
      type: 'AUDIO',
      publicId: 'chat/voice-1.m4a',
      assetId: 'asset-m4a-1',
      url: 'https://res.cloudinary.com/demo-cloud/raw/upload/v1/chat/voice-1.m4a',
      format: 'm4a',
      size: 48200,
      name: 'voice-note.m4a',
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

    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
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
  })
})

describe('date-time utility', () => {
  it('guards against null/epoch-0 dates so relative time never shows 57 years ago', () => {
    expect(parseServerDate(null)).toBeNull()
    expect(parseServerDate(undefined)).toBeNull()
    expect(parseServerDate(0)).toBeNull()
    expect(formatRelativeTime(null)).not.toContain('57')
    expect(formatRelativeTime(null)).toMatch(/trước|vừa xong/i)
  })

  it('formats UTC timestamps accurately in Asia/Ho_Chi_Minh (+07:00) timezone', () => {
    // 03:15 UTC == 10:15 Asia/Ho_Chi_Minh
    expect(formatTimeVN('2026-11-01T03:15:00Z')).toBe('10:15')
    expect(formatTimeVN('2026-11-01T03:15:00')).toBe('10:15')
  })
})
