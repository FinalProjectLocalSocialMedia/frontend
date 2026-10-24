export type PostMedia = {
  type: 'IMAGE' | 'VIDEO'
  publicId: string
  assetId: string
  url: string
  width: number
  height: number
  format: string
  size: number
  duration?: number | null
}
