import { useState, useEffect } from 'react'
import { BellOff, Search, UserPlus, Radio, X, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { messagesFor } from '../mocks/mock-chat'
import { chatApi } from '../api/chat-api'
import type { ChatMessage, Conversation } from '../types/chat'
import { ChatAvatar, GroupAvatars } from './chat-avatar'

export type FoundUser = {
  id: string
  fullName: string
  username?: string
  avatarUrl?: string
  isReal?: boolean
}

type Props = {
  conversations: Conversation[]
  messages: ChatMessage[]
  activeId: string | null
  query: string
  onQueryChange: (value: string) => void
  onSelect: (id: string) => void
  onCreateGroup: () => void
  onReset: () => void
  isRealtimeConnected?: boolean
  onSelectUser?: (user: FoundUser) => void
  currentUserId?: string
}

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

export function ConversationList({
  conversations,
  messages,
  activeId,
  query,
  onQueryChange,
  onSelect,
  onCreateGroup,
  onReset,
  isRealtimeConnected,
  onSelectUser,
  currentUserId,
}: Props) {
  const [searchedUsers, setSearchedUsers] = useState<FoundUser[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)

  const trimmedQuery = query.trim()
  const normQuery = removeVietnameseTones(trimmedQuery)

  // 1. Tìm kiếm hội thoại hiện có (hỗ trợ cả tiếng Việt có dấu, không dấu, và nội dung tin nhắn)
  const rows = conversations
    .map((c) => ({ conversation: c, last: messagesFor(c.id, messages).at(-1) }))
    .filter(({ conversation: c, last }) => {
      if (!trimmedQuery) return true
      const normName = removeVietnameseTones(c.name)
      const lastText = last?.text || last?.attachmentLabel || ''
      const normLastText = removeVietnameseTones(lastText)

      return (
        c.name.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
        normName.includes(normQuery) ||
        lastText.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
        normLastText.includes(normQuery)
      )
    })
    .sort((a, b) => lastTime(b.last) - lastTime(a.last))

  // 2. Tìm kiếm người dùng hệ thống từ backend nếu đang gõ tìm kiếm
  useEffect(() => {
    if (!trimmedQuery || trimmedQuery.length < 2 || !onSelectUser) {
      setSearchedUsers([])
      setSearchingUsers(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true)
      try {
        const users = await chatApi.searchUsers(trimmedQuery)
        const mapped: FoundUser[] = users
          .filter((u) => !currentUserId || u.id !== currentUserId)
          .map((u) => ({
            id: u.id,
            fullName: u.fullName,
            username: u.email,
            avatarUrl: u.avatarUrl,
            isReal: true,
          }))
        setSearchedUsers(mapped)
      } catch {
        setSearchedUsers([])
      } finally {
        setSearchingUsers(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [trimmedQuery, currentUserId, onSelectUser])

  // Lọc những user hệ thống chưa có trong danh sách kết quả hội thoại phía trên
  const existingMemberIds = new Set(rows.flatMap((r) => r.conversation.memberIds))
  const newDiscoveredUsers = searchedUsers.filter((u) => !existingMemberIds.has(u.id))

  return (
    <aside className="flex min-h-0 w-full flex-1 flex-col border-r border-border/70 bg-card">
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                nearby.
              </p>
              {isRealtimeConnected !== undefined && (
                <span
                  title={isRealtimeConnected ? 'STOMP WebSocket trực tuyến' : 'Đang chờ WebSocket'}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                    isRealtimeConnected
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Radio
                    className={cn(
                      'size-2.5',
                      isRealtimeConnected && 'animate-pulse text-emerald-500',
                    )}
                  />
                  {isRealtimeConnected ? 'Trực tuyến' : 'Offline'}
                </span>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Messages</h1>
          </div>
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Create group chat"
            onClick={onCreateGroup}
            title="Create group chat"
          >
            <UserPlus />
          </Button>
        </div>
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search conversations"
            className="h-10 rounded-xl pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Xóa nội dung tìm kiếm"
              className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3">
        {rows.map(({ conversation, last }) => {
          const otherId = conversation.memberIds.find((id) => id !== 'me') ?? 'me'
          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              aria-current={activeId === conversation.id}
              className={cn(
                'flex items-center gap-3 rounded-xl p-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                activeId === conversation.id ? 'bg-primary/10' : 'hover:bg-muted',
              )}
            >
              {conversation.kind === 'group' ? (
                <GroupAvatars ids={conversation.memberIds.filter((id) => id !== 'me')} />
              ) : (
                <ChatAvatar id={otherId} name={conversation.name} />
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 truncate text-sm font-semibold">
                  {conversation.name}
                  {conversation.muted && <BellOff className="size-3.5 text-muted-foreground" />}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {last ? (last.text ?? last.attachmentLabel) : 'No messages yet'}
                </span>
              </span>
              {conversation.unread ? <Badge>{conversation.unread}</Badge> : null}
            </button>
          )
        })}

        {rows.length === 0 && !newDiscoveredUsers.length && !searchingUsers && (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            {trimmedQuery ? 'Không tìm thấy cuộc trò chuyện nào.' : 'Chưa có cuộc trò chuyện nào.'}
          </p>
        )}

        {/* Danh sách người dùng hệ thống tìm thấy */}
        {trimmedQuery.length >= 2 && onSelectUser && (
          <div className="mt-3 border-t border-border/60 pt-3">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Người dùng hệ thống</span>
              {searchingUsers && <span className="lowercase font-normal">đang tìm...</span>}
            </p>
            {newDiscoveredUsers.length > 0 ? (
              newDiscoveredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    onSelectUser(u)
                    onQueryChange('')
                  }}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left outline-none transition-colors hover:bg-muted"
                >
                  <ChatAvatar id={u.id} name={u.fullName} avatarUrl={u.avatarUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{u.fullName}</span>
                    {u.username && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {u.username}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-primary font-medium shrink-0 flex items-center gap-1">
                    <User className="size-3" />
                    Nhắn tin
                  </span>
                </button>
              ))
            ) : (
              !searchingUsers &&
              rows.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Không tìm thấy người dùng phù hợp.
                </p>
              )
            )}
          </div>
        )}
      </div>

      {typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test' && (
        <Button
          variant="ghost"
          size="xs"
          onClick={onReset}
          className="m-3 self-start text-muted-foreground hover:text-foreground"
        >
          Reset demo data
        </Button>
      )}
    </aside>
  )
}

function lastTime(message?: ChatMessage) {
  return message ? Date.parse(message.createdAt) : Number.MAX_SAFE_INTEGER
}
