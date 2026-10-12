export type ChatUser = { id: string; name: string; username: string; initials: string; color: string; online: boolean; lastSeen?: string }
export type ChatMessage = { id: string; conversationId: string; senderId: string; text?: string; kind?: 'text' | 'image' | 'video' | 'audio'; attachmentLabel?: string; createdAt: string; reactions?: string[]; replyTo?: string }
export type Conversation = { id: string; kind: 'direct' | 'group'; name: string; memberIds: string[]; muted?: boolean; blocked?: boolean; unread?: number }

export const chatUsers: ChatUser[] = [
  { id: 'me', name: 'Minh Anh', username: '@minhanh', initials: 'MA', color: 'bg-sky-100 text-sky-700', online: true },
  { id: 'linh', name: 'Linh Nguyễn', username: '@linhnguyen', initials: 'LN', color: 'bg-rose-100 text-rose-700', online: true },
  { id: 'nam', name: 'Nam Trần', username: '@namtran', initials: 'NT', color: 'bg-amber-100 text-amber-700', online: false, lastSeen: 'Active 5m ago' },
  { id: 'hoa', name: 'Hoa Phạm', username: '@hoapham', initials: 'HP', color: 'bg-violet-100 text-violet-700', online: true },
  { id: 'duc', name: 'Đức Lê', username: '@ducle', initials: 'DL', color: 'bg-emerald-100 text-emerald-700', online: false, lastSeen: 'Active 2h ago' },
  { id: 'an', name: 'An Võ', username: '@anvo', initials: 'AV', color: 'bg-orange-100 text-orange-700', online: true },
  { id: 'mai', name: 'Mai Đỗ', username: '@maido', initials: 'MĐ', color: 'bg-pink-100 text-pink-700', online: false, lastSeen: 'Active 1d ago' },
  { id: 'quang', name: 'Quang Bùi', username: '@quangbui', initials: 'QB', color: 'bg-cyan-100 text-cyan-700', online: true },
]

export const initialConversations: Conversation[] = [
  { id: 'linh-chat', kind: 'direct', name: 'Linh Nguyễn', memberIds: ['me', 'linh'], unread: 2 },
  { id: 'hoa-chat', kind: 'direct', name: 'Hoa Phạm', memberIds: ['me', 'hoa'] },
  { id: 'cau-giay', kind: 'group', name: 'Cầu Giấy cuối tuần', memberIds: ['me', 'nam', 'an', 'mai'], muted: true },
  { id: 'design', kind: 'group', name: 'Nhóm thiết kế nearby.', memberIds: ['me', 'hoa', 'duc', 'quang'] },
  { id: 'nam-chat', kind: 'direct', name: 'Nam Trần', memberIds: ['me', 'nam'] },
  { id: 'mai-chat', kind: 'direct', name: 'Mai Đỗ', memberIds: ['me', 'mai'] },
  { id: 'new-chat', kind: 'direct', name: 'Đức Lê', memberIds: ['me', 'duc'] },
]

export const initialMessages: ChatMessage[] = [
  { id: 'm1', conversationId: 'linh-chat', senderId: 'linh', text: 'Bạn đã thử quán cà phê mới ở Cầu Giấy chưa?', createdAt: '2026-10-09T08:32:00', reactions: ['👍'] },
  { id: 'm2', conversationId: 'linh-chat', senderId: 'me', text: 'Chưa, nghe nói không gian khá yên tĩnh đúng không?', createdAt: '2026-10-09T08:34:00' },
  { id: 'm3', conversationId: 'linh-chat', senderId: 'linh', text: 'Đúng rồi. Chiều nay mình đi cùng nhé, mình gửi vị trí cho bạn.', createdAt: '2026-10-09T08:36:00', replyTo: 'm2' },
  { id: 'm4', conversationId: 'hoa-chat', senderId: 'hoa', text: 'Mình vừa đăng ảnh ở công viên Nghĩa Đô.', createdAt: '2026-10-08T17:12:00', kind: 'image', attachmentLabel: 'Ảnh công viên Nghĩa Đô' },
  { id: 'm5', conversationId: 'cau-giay', senderId: 'nam', text: 'Sáng thứ bảy mọi người chạy bộ không?', createdAt: '2026-10-07T06:40:00' },
  { id: 'm6', conversationId: 'cau-giay', senderId: 'me', text: 'Mình tham gia. Hẹn ở cổng công viên lúc 6:30 nhé.', createdAt: '2026-10-07T06:45:00' },
  { id: 'm7', conversationId: 'design', senderId: 'duc', text: 'Đã cập nhật bản đồ khu vực trong prototype.', createdAt: '2026-10-06T14:32:00', kind: 'video', attachmentLabel: 'nearby-map-demo.mp4' },
]

export function userById(id: string) { return chatUsers.find((user) => user.id === id) }
export function messagesFor(conversationId: string, messages = initialMessages) { return messages.filter((message) => message.conversationId === conversationId) }
export const reportReasons = ['Tin rác', 'Thù ghét, lạm dụng hoặc quấy rối', 'An toàn cho trẻ em', 'Phát ngôn mang tính bạo lực', 'Nội dung phản cảm hoặc bạo lực', 'Mạo danh', 'Nội dung về tình dục dành cho người lớn', 'Nội dung riêng tư hoặc không có sự đồng thuận', 'Tự tử hoặc tự làm hại bản thân', 'Chủ nghĩa khủng bố hoặc chủ nghĩa cực đoan bạo lực', 'Tính liêm chính của công dân', 'Lý do khác']

export const chatStorageKey = 'nearby-chat-demo-v1'
export function loadChatState() { try { const raw = window.localStorage.getItem(chatStorageKey); return raw ? JSON.parse(raw) : { conversations: initialConversations, messages: initialMessages } } catch { return { conversations: initialConversations, messages: initialMessages } } }
export function saveChatState(state: { conversations: Conversation[]; messages: ChatMessage[] }) { try { window.localStorage.setItem(chatStorageKey, JSON.stringify(state)) } catch { /* storage is optional for the prototype */ } }
export function resetChatState() { try { window.localStorage.removeItem(chatStorageKey) } catch {} }
