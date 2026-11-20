import type { AppNotification } from '../types/notification'

function formatGroupedActor(n: AppNotification): string {
  const actorName = n.actor?.fullName?.trim() || 'Ai đó'
  if (n.actorCount >= 2) {
    return `${actorName} và ${n.actorCount - 1} người khác`
  }
  return actorName
}

function formatSingleActor(n: AppNotification): string {
  return n.actor?.fullName?.trim() || 'Ai đó'
}

export function describeNotification(n: AppNotification): string {
  switch (n.type) {
    case 'FOLLOW_REQUEST':
      return `${formatSingleActor(n)} đã gửi yêu cầu theo dõi bạn`
    case 'FOLLOW_REQUEST_ACCEPTED':
      return `${formatSingleActor(n)} đã chấp nhận yêu cầu theo dõi của bạn`
    case 'POST_LIKED':
      return `${formatGroupedActor(n)} đã thích bài viết của bạn`
    case 'POST_COMMENTED': {
      const base = `${formatGroupedActor(n)} đã bình luận về bài viết của bạn`
      const excerpt = n.content?.trim()
      return excerpt ? `${base}: "${excerpt}"` : base
    }
    case 'COMMENT_REPLIED':
      return `${formatGroupedActor(n)} đã trả lời bình luận của bạn`
    case 'COMMENT_LIKED':
      return `${formatGroupedActor(n)} đã thích bình luận của bạn`
    case 'REPORT_RESOLVED':
      return 'Báo cáo của bạn đã được xử lý'
    case 'REPORT_REJECTED':
      return 'Báo cáo của bạn đã được xem xét và không phát hiện vi phạm'
    case 'CONTENT_REMOVED':
      return n.content?.trim()
        ? `Nội dung của bạn đã bị gỡ: ${n.content.trim()}`
        : 'Nội dung của bạn đã bị gỡ'
    case 'CONTENT_HIDDEN':
      return n.content?.trim()
        ? `Bài viết của bạn đã bị ẩn: ${n.content.trim()}`
        : 'Bài viết của bạn đã bị ẩn'
    case 'ACCOUNT_WARNING':
      return n.content?.trim()
        ? `Bạn đã nhận một cảnh cáo: ${n.content.trim()}`
        : 'Bạn đã nhận một cảnh cáo'
    case 'ACCOUNT_LOCKED':
      return n.content?.trim()
        ? `Tài khoản của bạn đã bị khóa: ${n.content.trim()}`
        : 'Tài khoản của bạn đã bị khóa'
    case 'TRENDING_LOCATION': {
      const locationName = n.metadata?.name?.trim()
      return locationName
        ? `${locationName} đang thịnh hành gần bạn`
        : 'Một địa điểm đang thịnh hành gần bạn'
    }
    case 'TRENDING_POST':
      return 'Một bài viết đang thịnh hành gần bạn'
  }
}

export function getNotificationHref(n: AppNotification): string | undefined {
  switch (n.type) {
    case 'FOLLOW_REQUEST':
    case 'FOLLOW_REQUEST_ACCEPTED':
      return n.actor?.id ? `/profile/${n.actor.id}` : undefined
    case 'POST_LIKED':
    case 'POST_COMMENTED':
    case 'TRENDING_POST': {
      const postId = n.metadata?.postId || n.referenceId
      return postId ? `/posts/${postId}` : undefined
    }
    case 'COMMENT_REPLIED':
    case 'COMMENT_LIKED': {
      const postId = n.metadata?.postId
      return postId ? `/posts/${postId}` : undefined
    }
    case 'TRENDING_LOCATION':
      return '/explore'
    case 'REPORT_RESOLVED':
    case 'REPORT_REJECTED':
    case 'CONTENT_REMOVED':
    case 'CONTENT_HIDDEN':
    case 'ACCOUNT_WARNING':
    case 'ACCOUNT_LOCKED':
      return undefined
  }
}

export const NOTIFICATION_UI_TEXT = {
  pageTitle: 'Thông báo',
  markAllRead: 'Đánh dấu tất cả đã đọc',
  markAllReadSuccess: 'Đã đánh dấu tất cả thông báo là đã đọc',
  markAllReadError: 'Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại.',
  loadMore: 'Tải thêm',
  loadingMore: 'Đang tải...',
  emptyTitle: 'Chưa có thông báo nào',
  emptyDescription: 'Khi có tương tác mới hoặc cập nhật quanh bạn, thông báo sẽ hiển thị tại đây.',
  loadError: 'Không thể tải thông báo. Vui lòng thử lại.',
  retry: 'Thử lại',
  accept: 'Chấp nhận',
  reject: 'Từ chối',
  accepted: 'Đã chấp nhận',
  rejected: 'Đã từ chối',
  acceptSuccess: 'Đã chấp nhận yêu cầu theo dõi',
  rejectSuccess: 'Đã từ chối yêu cầu theo dõi',
  followActionError: 'Không thể xử lý yêu cầu theo dõi. Vui lòng thử lại.',
} as const
