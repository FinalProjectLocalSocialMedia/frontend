export type ConversationType = 'DIRECT' | 'GROUP'
export type MessageStatus = 'SENT' | 'DELIVERED' | 'SEEN'

export type ChatUser = {
  id: string
  name: string
  username: string
  initials: string
  color: string
  online: boolean
  lastSeen?: string
}

export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  text?: string
  content?: string
  kind?: 'text' | 'image' | 'video' | 'audio'
  attachmentLabel?: string
  createdAt: string
  reactions?: string[]
  replyTo?: string
  status?: 'SENT' | 'DELIVERED' | 'SEEN' | string
  media?: MediaItem[]
}

export type Conversation = {
  id: string
  kind: 'direct' | 'group'
  name: string
  memberIds: string[]
  muted?: boolean
  blocked?: boolean
  unread?: number
}

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

export interface ChatState {
  conversations: Conversation[]
  messages: ChatMessage[]
}
