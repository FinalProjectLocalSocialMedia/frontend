export type ConversationType = 'DIRECT' | 'GROUP'
export type MessageStatus = 'SENT' | 'DELIVERED' | 'SEEN'

export interface MediaItem {
  id?: string
  url: string
  type: string
  name?: string
  size?: number
}

export interface ChatMember {
  id: string
  fullName: string
  avatarUrl?: string
  bio?: string
  online?: boolean
}

export interface MessageDto {
  id: string
  conversationId: string
  senderId: string
  content: string
  sentAt: string
  status: MessageStatus
  media?: MediaItem[]
}

export interface ConversationSummary {
  id: string
  type: ConversationType
  name?: string
  createdAt: string
  members: ChatMember[]
  lastMessage?: MessageDto | null
  unreadCount?: number
}

export interface CursorPageResponse<T> {
  items?: T[]
  data?: T[]
  page?: {
    nextCursor?: string | null
    hasMore: boolean
  }
  nextCursor?: string | null
  hasMore?: boolean
}

export interface CreateConversationRequest {
  type: ConversationType
  name?: string
  memberIds: string[]
}

export interface SendMessageRequest {
  content: string
  media?: MediaItem[]
}

export interface TypingEvent {
  conversationId: string
  userId: string
  typing: boolean
}

export interface ReadReceiptEvent {
  conversationId: string
  messageId: string
  userId: string
}
