import { apiClient } from './api'
import type {
  ConversationSummary,
  CreateConversationRequest,
  CursorPageResponse,
  MessageDto,
  SendMessageRequest,
} from '@/types/chat'

export const chatApi = {
  // Lấy danh sách cuộc trò chuyện của user hiện tại
  async getConversations(): Promise<ConversationSummary[]> {
    const res = await apiClient.get<ConversationSummary[]>('/chat/conversations')
    return res.data
  },

  // Tạo cuộc trò chuyện mới (1-1 hoặc nhóm)
  async createConversation(data: CreateConversationRequest): Promise<ConversationSummary> {
    const res = await apiClient.post<ConversationSummary>('/chat/conversations', data)
    return res.data
  },

  // Lấy lịch sử tin nhắn của cuộc trò chuyện (hỗ trợ phân trang cursor)
  async getMessages(
    conversationId: string,
    cursor?: string | null,
    limit = 50,
  ): Promise<CursorPageResponse<MessageDto>> {
    const res = await apiClient.get<CursorPageResponse<MessageDto>>(
      `/chat/conversations/${conversationId}/messages`,
      {
        params: { cursor, limit },
      },
    )
    return res.data
  },

  // Gửi tin nhắn qua REST fallback (khi WebSocket gián đoạn)
  async sendMessage(
    conversationId: string,
    data: SendMessageRequest,
  ): Promise<MessageDto> {
    const res = await apiClient.post<MessageDto>(
      `/chat/conversations/${conversationId}/messages`,
      data,
    )
    return res.data
  },

  // Đánh dấu tin nhắn đã xem
  async markMessageAsRead(messageId: string): Promise<void> {
    await apiClient.put(`/chat/messages/${messageId}/read`)
  },

  // Kiểm tra trạng thái online/offline của 1 user
  async getUserPresence(userId: string): Promise<{ userId: string; online: boolean }> {
    const res = await apiClient.get<{ userId: string; online: boolean }>(
      `/chat/users/${userId}/presence`,
    )
    return res.data
  },

  // Kiểm tra trạng thái online/offline của nhiều users theo lô
  async getUsersPresenceBatch(userIds: string[]): Promise<Record<string, boolean>> {
    const res = await apiClient.post<Record<string, boolean>>(
      '/chat/users/presence/batch',
      userIds,
    )
    return res.data
  },

  // Tìm kiếm người dùng để bắt đầu trò chuyện
  async searchUsers(query: string): Promise<Array<{ id: string; fullName: string; email?: string; avatarUrl?: string }>> {
    const res = await apiClient.get('/user/users/search', {
      params: { q: query },
    })
    // Server trả về PageResponse<PublicUserProfile> với danh sách items
    if (res.data?.items && Array.isArray(res.data.items)) {
      return res.data.items
    }
    if (res.data?.content && Array.isArray(res.data.content)) {
      return res.data.content
    }
    if (Array.isArray(res.data)) {
      return res.data
    }
    return []
  },

  // Lấy thông tin hồ sơ của một user theo ID
  async getUserProfile(userId: string): Promise<{ id: string; fullName: string; avatarUrl?: string }> {
    const res = await apiClient.get<{ id: string; fullName: string; avatarUrl?: string }>(`/user/users/${userId}`)
    return res.data
  },
}
