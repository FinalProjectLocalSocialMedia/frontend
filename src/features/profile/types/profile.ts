export interface PublicUserProfile {
  id: string
  fullName: string
  avatarUrl?: string | null
  bio?: string | null
  postCount: number
  followerCount: number
  followingCount: number
  isFollowing: boolean
  isBlocking?: boolean
  isBlocked?: boolean
}

export interface UpdateProfilePayload {
  fullName?: string
  avatarUrl?: string
  bio?: string
}

export interface FollowDto {
  id: string
  followerId: string
  followedUserId: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
}

export type ReportTargetType = 'POST' | 'COMMENT' | 'USER'

export interface CreateReportPayload {
  targetType: ReportTargetType
  targetId: string
  reason: string
}

export interface CreateReportResponse {
  id: string
  status: string
  reportedAt: string
}

export const OTHER_REPORT_REASON = 'Lý do khác'

export const REPORT_USER_REASONS = [
  'Thông tin sai sự thật, lừa đảo, gian lận',
  'Thù ghét, lạm dụng hoặc quấy rối',
  'Phát ngôn mang tính bạo lực',
  'Nội dung phản cảm hoặc bạo lực',
  'Mạo danh',
  'Tự tử hoặc tự làm hại bản thân',
  'Chủ nghĩa khủng bố hoặc chủ nghĩa cực đoan bạo lực',
  OTHER_REPORT_REASON,
] as const
