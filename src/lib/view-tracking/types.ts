export interface ViewEventPayload {
  postId: string
  viewAt: string // ISO8601 của startedAt, cố định cho mọi lần retry
  duration: number // giây, nguyên, >= 1 (dwell time)
}

export type ViewSender = (events: ViewEventPayload[]) => Promise<void> | void

export interface ViewSession {
  startedAt: number // ms
  qualified: boolean
  dwellTimerId: ReturnType<typeof setTimeout> | null // chỉ tồn tại khi chưa qualified
}

export interface ObservedPostMeta {
  postId: string
  authorId: string
}

export interface ViewTrackerOptions {
  send: ViewSender
  sendKeepalive: ViewSender
  getUserId?: () => string | null
  now?: () => number
}
