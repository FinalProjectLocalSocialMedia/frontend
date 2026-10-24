/**
 * Kiểu dữ liệu dùng chung cho admin & moderation (mục 6 của docs/admin-moderator-plan.md).
 * Bám `backend/db_schema.sql`; chú thích `// table.column` chỉ nguồn gốc của trường.
 * Kiểu riêng của từng feature (locations, config, stats, heatmap, ...) nằm trong `*.types.ts`
 * của feature đó ở các pha sau.
 */

export type Uuid = string
/** timestamptz → chuỗi ISO 8601 */
export type IsoDateTime = string

// ===== Enum bám CHECK constraint =====
export type UserStatus = 'ACTIVE' | 'LOCKED' // users.status
/** Suy ra từ bảng con: admins / moderators / normal_users. */
export type Role = 'ADMIN' | 'MODERATOR' | 'NORMAL_USER' | 'USER'
/** Vai trò được phép vào khu vực quản trị. */
export type StaffRole = 'ADMIN' | 'MODERATOR'
export type ReportTargetType = 'POST' | 'COMMENT' | 'USER' // reports.target_type
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED' // reports.status
export type NotificationType =
  // notifications.notification_type
  | 'LIKE'
  | 'COMMENT'
  | 'FOLLOW'
  | 'CHAT'
  | 'REPORT_RESULT'
  | 'WARNING'
  | 'ACCOUNT_LOCKED' // thông báo cho người dùng (S4)
  | 'REPORT_CREATED' // thông báo cho staff khi có báo cáo mới (S4)
export type InteractionType = 'VIEW' | 'LIKE' | 'COMMENT' | 'SHARE' | 'SAVE' // interaction_types.name (seed)
export type PostStatus = 'ACTIVE' | 'REMOVED' // posts.status / comments.status (S5, S6)

// ===== Địa lý =====
// DB: geography(Point,4326), WKT là POINT(lng lat). DTO luôn trả tên trường rõ ràng để khỏi nhầm thứ tự.
export type GeoPoint = { latitude: number; longitude: number }

// ===== Tham chiếu nhẹ =====
export type UserRef = { id: Uuid; displayName: string; avatarUrl?: string } // normal_users.full_name / avatar_url
/** admin/moderator không có tên hiển thị → dùng email (D13). */
export type StaffRef = { id: Uuid; email: string; role: StaffRole }
export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number }

// ===== Người dùng (users + bảng con) =====
export type AdminUserListItem = {
  id: Uuid // users.id
  role: Role
  status: UserStatus // users.status
  email?: string // users.email — chỉ khi có quyền users.pii.read
  phoneNumber?: string // users.phone_number — như trên
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
  deletedAt?: IsoDateTime // xoá mềm (S7)
  displayName: string // normal_users.full_name; staff: email
  avatarUrl?: string // normal_users.avatar_url
  moderator?: { grantedAt: IsoDateTime; grantedByAdminId: Uuid } // moderators.granted_at / granted_admin_id
  stats?: { posts: number; reportsAgainst: number; warnings: number } // tổng hợp phía backend (S3)
}

export type SanctionType = 'WARN' | 'LOCK' // account_sanctions.type (S3)
export type SanctionRecord = {
  // account_sanctions
  id: Uuid
  userId: Uuid
  type: SanctionType
  reason: string // WARN: nội dung cảnh báo · LOCK: lý do khoá (≤ 255)
  reportId?: Uuid // account_sanctions.report_id
  issuedBy: StaffRef
  issuedAt: IsoDateTime
  liftedAt?: IsoDateTime
  liftedBy?: StaffRef
  liftNote?: string // chỉ LOCK; không có liftedAt = đang bị khoá
}
/** = bản ghi LOCK chưa mở; KHÔNG có hạn (D8). */
export type LockInfo = {
  sanctionId: Uuid
  reason: string
  lockedAt: IsoDateTime
  lockedBy: StaffRef
}
export type AdminUserDetail = AdminUserListItem & {
  profile?: {
    // normal_users.*
    bio: string
    dateOfBirth?: string
    gender: number
  }
  lock?: LockInfo // có khi status = 'LOCKED'
  sanctions?: SanctionRecord[] // lịch sử cảnh báo/khoá (mới nhất trước)
}
export type CreateUserInput =
  | {
      role: 'NORMAL_USER'
      email: string
      password: string
      phoneNumber: string
      profile: {
        fullName: string
        avatarUrl?: string
        bio?: string
        dateOfBirth: string
        gender: number
      }
    }
  | { role: 'MODERATOR'; email: string; password: string; phoneNumber: string } // S11: không có permission level
  | { role: 'ADMIN'; email: string; password: string; phoneNumber: string }
export type UpdateUserInput = Partial<{
  email: string
  phoneNumber: string
  profile: { fullName: string; avatarUrl: string; bio: string; dateOfBirth: string; gender: number }
}>
export type LockUserInput = { reason: string } // bắt buộc; không có hạn (D8)
export type UnlockUserInput = { note?: string }
export type WarnUserInput = { message: string } // ≤ 255 (notifications.content)

export type UserListParams = {
  q?: string
  role?: string
  status?: string
  includeDeleted?: boolean
  sort?: string
  page?: number
  pageSize?: number
}

// ===== Tài khoản vi phạm (Flagged Accounts - Pha 4) =====
export type FlaggedAccount = {
  user: UserRef & { status: UserStatus; role?: Role; email?: string }
  pendingReports: number
  totalReports: number
  warnings: number
  lock?: LockInfo
  lastActivityAt: IsoDateTime
}

export type FlaggedAccountsParams = {
  status?: UserStatus
  q?: string
  sort?: string
  page?: number
  pageSize?: number
}

// ===== Báo cáo (reports) =====
export type ReportListItem = {
  id: Uuid
  targetType: ReportTargetType // reports.target_type
  targetId: string // reports.target_id (varchar — id của post/comment/user)
  reason: string // reports.reason (map nhãn bằng REPORT_REASONS; chuỗi lạ hiển thị nguyên văn; không có priority — S2)
  status: ReportStatus
  reportedAt: IsoDateTime
  handledAt?: IsoDateTime // S1
  reporter: UserRef // reports.reporter_id → normal_users
  targetSummary: { text?: string; owner?: UserRef } // preview ngắn + chủ đối tượng (backend join)
  reportCount: number // số báo cáo cùng (targetType, targetId)
}
// S10: posts.content là TEXT (không giới hạn 255) — UI phải xử lý nội dung rất dài (cắt gọn + "Xem thêm").
export type PostTarget = {
  type: 'POST'
  id: Uuid
  status: PostStatus
  content: string
  media?: string
  createdAt: IsoDateTime
  author: UserRef & { status: UserStatus }
  location: { id: Uuid; name: string } & GeoPoint
  hashtags: string[] // post_hashtags → hashtags.name
  counts: { views: number; likes: number; comments: number; shares: number; saves: number }
  isShare: boolean // S6
}
export type CommentTarget = {
  type: 'COMMENT'
  id: Uuid
  status: PostStatus
  postId: Uuid // S5
  content: string
  media?: unknown /* comments.media jsonb */
  createdAt: IsoDateTime
  author: UserRef & { status: UserStatus }
  parentCommentId?: Uuid
}
export type UserTarget = {
  type: 'USER'
  user: AdminUserListItem
  lock?: LockInfo
  recentPosts?: { id: Uuid; content: string; createdAt: IsoDateTime }[]
}
export type ReportTarget = PostTarget | CommentTarget | UserTarget
export type ReportDetail = ReportListItem & {
  resolutionNote?: string // reports.resolution_note (≤ 255)
  handledBy?: StaffRef // reports.handle_moderator_id hoặc handle_admin_id (S1)
  otherReporters: UserRef[] // báo cáo PENDING khác cùng đối tượng
  target: ReportTarget
  history: AuditLog[] // timeline
  sanctions?: SanctionRecord[] // lịch sử xử phạt của chủ đối tượng
}

export type ReportSummary = {
  content: { pending: number; resolved: number; rejected: number }
  user: { pending: number; resolved: number; rejected: number }
  pendingTotal: number
}

export type ModerationAction =
  | 'REMOVE_CONTENT'
  | 'WARN_OWNER'
  | 'LOCK_OWNER' // báo cáo POST/COMMENT
  | 'WARN_USER'
  | 'LOCK_USER' // báo cáo USER
  | 'REJECT' // không vi phạm → status REJECTED
export type ResolveReportInput = {
  actions: ModerationAction[] // ≥ 1; REJECT loại trừ các action khác
  resolutionNote?: string // ≤ 255 (reports.resolution_note)
  warning?: WarnUserInput // bắt buộc khi có WARN_*
  lock?: LockUserInput // bắt buộc khi có LOCK_*
}
export type ResolveReportResult = {
  reports: ReportListItem[] // mọi báo cáo bị ảnh hưởng (D7)
  resolvedCount: number
  notifications: { reporters: number; owner: number }
  auditLogIds: Uuid[]
}

// ===== Audit (audit_logs) =====
export type AuditAction =
  | 'REPORT_RESOLVED'
  | 'REPORT_REJECTED'
  | 'POST_REMOVED'
  | 'COMMENT_REMOVED'
  | 'USER_WARNED'
  | 'USER_LOCKED'
  | 'USER_UNLOCKED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'CONFIG_UPDATED'
  | 'LOCATION_CREATED'
  | 'LOCATION_UPDATED'
  | 'LOCATION_DELETED'
  | (string & {})
export type AuditLog = {
  id: Uuid
  actor: StaffRef // audit_logs.user_id → users (+ role)
  action: AuditAction // audit_logs.action (varchar)
  targetType: string // 'REPORT' | 'POST' | 'COMMENT' | 'USER' | 'SYSTEM_CONFIG' | 'INTERACTION_TYPE' | 'LOCATION'
  targetId: string // audit_logs.target_id (varchar)
  details: Record<string, unknown> // audit_logs.details (jsonb): { actions, note, reportId, before, after, reason, … }
  ipAddress: string // audit_logs.ip_address
  occurredAt: IsoDateTime
}

// ===== Thông báo (bảng notifications — S4) =====
export type AppNotification = {
  id: Uuid
  recipientId: Uuid
  type: NotificationType
  content: string /* ≤255 */
  referenceTargetId: string /* vd. reportId */
  isRead: boolean
  createdAt: IsoDateTime
}
// Thông báo của admin/moderator = AppNotification có type 'REPORT_CREATED'.

// ===== Xác thực (mục 5.5) =====
export type AuthUser = { id: Uuid; email: string; role: StaffRole }
export type LoginInput = { email: string; password: string }

// ===== Tuỳ chọn request =====
/** Truyền `signal` từ TanStack Query xuống service để huỷ request cũ. */
export type RequestOptions = { signal?: AbortSignal }

// ===== Thống kê nội dung & Trending (Pha 6) =====
export type StatsRange = '7d' | '30d' | '90d'

export type PostStatsOverviewNewPosts = {
  today: number
  last7d: number
  last30d: number
}

export type PostStatsOverview = {
  totalPosts: number
  newPosts: PostStatsOverviewNewPosts
  growthPct: number
  activeAuthors: number
}

export type PostsTimePoint = {
  date: string
  count: number
}

export type PostStats = {
  overview: PostStatsOverview
  series: PostsTimePoint[]
}

export type TrendingHashtag = {
  hashtagId: Uuid
  name: string
  postCount: number
  previousPostCount: number
  changePct: number
}

export type TrendingPostCounts = {
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
}

export type TrendingPost = {
  id: Uuid
  content: string
  author: UserRef
  locationName: string
  createdAt: IsoDateTime
  counts: TrendingPostCounts
  score: number // Σ (interaction_types.weight × count)
}

export type InteractionWeight = { name: InteractionType; weight: number }
