import type {
  GeoPoint,
  IsoDateTime,
  NotificationType,
  PostStatus,
  ReportStatus,
  ReportTargetType,
  SanctionType,
  UserStatus,
  Uuid,
} from '../../lib/types'

/**
 * Hình dạng các bảng của mock db — bám `backend/db_schema.sql` (camelCase).
 * Chỉ gồm các bảng cần cho khu vực quản trị; thêm bảng khi pha tương ứng cần.
 */

export type DbUser = {
  id: Uuid
  email: string
  /** Chỉ tồn tại trong mock để kiểm tra đăng nhập; KHÔNG BAO GIỜ đưa vào DTO. */
  password: string
  phoneNumber?: string
  status: UserStatus
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
  deletedAt?: IsoDateTime
}
export type DbAdmin = { userId: Uuid }
export type DbModerator = { userId: Uuid; grantedAdminId: Uuid; grantedAt: IsoDateTime }
export type DbNormalUser = {
  userId: Uuid
  fullName: string
  avatarUrl: string
  bio: string
  dateOfBirth: string
  gender: number
  currentLocation: GeoPoint
  currentH3Index: string
  locationUpdatedAt: IsoDateTime
}

export type DbLocation = {
  id: Uuid
  name: string
  description: string
  coordinate: GeoPoint
  h3Index: string
  locationType: string
}
export type DbHashtag = { id: Uuid; name: string }
export type DbPost = {
  id: Uuid
  authorId: Uuid
  content: string
  media: string
  locationId: Uuid
  status: PostStatus
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
  sharedPostId?: Uuid
}
export type DbPostHashtag = { postId: Uuid; hashtagId: Uuid }
export type DbComment = {
  id: Uuid
  authorId: Uuid
  content: string
  media: unknown
  parentCommentId?: Uuid
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
  postId: Uuid
  status: PostStatus
}

export type DbReport = {
  id: Uuid
  reporterId: Uuid
  targetType: ReportTargetType
  targetId: string
  reason: string
  status: ReportStatus
  reportedAt: IsoDateTime
  handledAt?: IsoDateTime
  resolutionNote?: string
  handleModeratorId?: Uuid
  handleAdminId?: Uuid
}
export type DbSanction = {
  id: Uuid
  userId: Uuid
  type: SanctionType
  reason: string
  reportId?: Uuid
  issuedBy: Uuid
  issuedAt: IsoDateTime
  liftedAt?: IsoDateTime
  liftedBy?: Uuid
  liftNote?: string
}
export type DbNotification = {
  id: Uuid
  recipient: Uuid
  type: NotificationType
  content: string
  referenceTargetId: string
  isRead: boolean
  createdAt: IsoDateTime
}
export type DbAuditLog = {
  id: Uuid
  userId: Uuid
  action: string
  targetType: string
  targetId: string
  details: Record<string, unknown>
  ipAddress: string
  occurredAt: IsoDateTime
}

export type MockDb = {
  users: DbUser[]
  admins: DbAdmin[]
  moderators: DbModerator[]
  normalUsers: DbNormalUser[]
  locations: DbLocation[]
  hashtags: DbHashtag[]
  posts: DbPost[]
  postHashtags: DbPostHashtag[]
  comments: DbComment[]
  reports: DbReport[]
  sanctions: DbSanction[]
  notifications: DbNotification[]
  auditLogs: DbAuditLog[]
}
