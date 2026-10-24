import { useEffect, useState, useCallback, useRef } from 'react'
import { MessageCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useIsDesktop } from '@/hooks/use-media-query'
import { useAuth } from '@/features/auth/context/auth-context'
import { cn } from '@/lib/utils'
import { defaultChatState, loadChatState, resetChatState, saveChatState } from '../mocks/mock-chat'
import { chatApi } from '../api/chat-api'
import { useChatSocket } from '../hooks/use-chat-socket'
import type {
  ChatMember,
  ChatMessage,
  ChatState,
  Conversation,
  ConversationSummary,
} from '../types/chat'
import { ChatWindow } from '../components/chat-window'
import { ConversationList } from '../components/conversation-list'
import { DetailsPanel } from '../components/details-panel'
import { ReportDialog } from '../components/report-dialog'
import { NewChatDialog } from '../components/new-chat-dialog'

/** Kiểm tra xem một ID có phải là UUID chuẩn (từ backend DB) hay không */
function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export function ChatPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [state, setState] = useState<ChatState>(() => loadChatState())
  const [activeId, setActiveId] = useState<string | null>(() => {
    const initial = loadChatState()
    return initial.conversations[0]?.id ?? null
  })
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const isDesktop = useIsDesktop()
  const sendReadRef = useRef<((messageId: string, conversationId?: string) => void) | null>(null)

  // Tự động lưu mock state cho demo & vitest test runner chỉ khi chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      saveChatState(state)
    }
  }, [state, isAuthenticated, isLoading])

  // Xử lý nạp dữ liệu phù hợp theo trạng thái đăng nhập
  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      const mock = loadChatState()
      setState(mock)
      setActiveId((prev) => prev ?? mock.conversations[0]?.id ?? null)
    }
  }, [isAuthenticated, isLoading])

  // Lấy cuộc trò chuyện đang chọn
  const active = state.conversations.find((c) => c.id === activeId) ?? null
  const activeMessages = state.messages.filter((m) => m.conversationId === active?.id)

  // 1. Tải danh sách cuộc trò chuyện thực tế từ Backend khi người dùng đã đăng nhập
  const fetchBackendConversations = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return

    try {
      const summaries = await chatApi.getConversations()
      const list: ConversationSummary[] = Array.isArray(summaries)
        ? summaries
        : (summaries as any)?.items || (summaries as any)?.data || []

      // Tải thông tin hồ sơ người dùng thực tế cho các cuộc trò chuyện trực tiếp
      const realConversations: Conversation[] = await Promise.all(
        list.map(async (s) => {
          const otherMember = s.members.find((m: ChatMember) => m.id !== user.id) || s.members[0]
          let displayName = s.name
          if (s.type === 'GROUP') {
            displayName = s.name || 'Nhóm trò chuyện'
          } else if (otherMember && otherMember.id) {
            try {
              const profile = await chatApi.getUserProfile(otherMember.id)
              if (profile?.fullName) displayName = profile.fullName
            } catch {
              displayName = otherMember.fullName !== 'Member' ? otherMember.fullName : 'Người dùng'
            }
          }

          return {
            id: s.id,
            kind: s.type === 'GROUP' ? 'group' : 'direct',
            name: displayName || 'Người dùng',
            memberIds: s.members.map((m: ChatMember) => m.id),
            unread: 0,
          }
        }),
      )

      setState((prev) => {
        const realConvIds = new Set(realConversations.map((c) => c.id))
        const validMessages = prev.messages.filter((m) => realConvIds.has(m.conversationId))

        return {
          conversations: realConversations,
          messages: validMessages,
        }
      })

      setActiveId((prevId) => {
        if (!prevId || !realConversations.some((c) => c.id === prevId)) {
          return realConversations[0]?.id ?? null
        }
        return prevId
      })
    } catch (err) {
      console.warn('Chưa tải được danh sách chat từ backend:', err)
    }
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    fetchBackendConversations()
  }, [fetchBackendConversations])

  // 2. Tải lịch sử tin nhắn khi mở 1 cuộc trò chuyện từ Backend
  useEffect(() => {
    if (!activeId || !isUuid(activeId) || !isAuthenticated || !user?.id) return

    chatApi
      .getMessages(activeId)
      .then((res) => {
        const rawList = res.items || res.data || []
        const loaded: ChatMessage[] = rawList
          .sort((a, b) => Date.parse(a.sentAt) - Date.parse(b.sentAt))
          .map((dto) => ({
            id: dto.id,
            conversationId: dto.conversationId,
            senderId: dto.senderId,
            text: dto.content,
            createdAt: dto.sentAt,
            status: dto.status,
          }))

        setState((prev) => {
          const otherMessages = prev.messages.filter((m) => m.conversationId !== activeId)
          const pendingLocal = prev.messages.filter(
            (m) =>
              m.conversationId === activeId &&
              m.id.startsWith('local-') &&
              !loaded.some((l) => l.text?.trim() === m.text?.trim()),
          )

          return {
            ...prev,
            messages: [...otherMessages, ...loaded, ...pendingLocal],
          }
        })
      })
      .catch((err) => {
        console.warn('Lỗi khi tải tin nhắn cuộc trò chuyện:', err)
      })
  }, [activeId, isAuthenticated, user?.id])

  // 3. Kết nối STOMP WebSocket cho tin nhắn thời gian thực
  const handleMessageReceived = useCallback(
    (msg: {
      id: string
      conversationId: string
      senderId: string
      content: string
      sentAt: string
      status: string
    }) => {
      const chatMsg: ChatMessage = {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        text: msg.content,
        createdAt: msg.sentAt,
        status: msg.status as 'SENT' | 'DELIVERED' | 'SEEN',
      }

      setState((prev) => {
        const existsConv = prev.conversations.some((c) => c.id === chatMsg.conversationId)
        if (!existsConv) {
          fetchBackendConversations()
        }

        const existingIndex = prev.messages.findIndex((m) => m.id === chatMsg.id)

        let updatedMessages: ChatMessage[]
        if (existingIndex !== -1) {
          updatedMessages = prev.messages.map((m, idx) =>
            idx === existingIndex ? { ...m, ...chatMsg } : m,
          )
        } else {
          const isFromMe =
            Boolean(
              chatMsg.senderId &&
              user?.id &&
              chatMsg.senderId.toLowerCase() === user.id.toLowerCase(),
            ) || chatMsg.senderId === 'me'

          const optimisticIndex = isFromMe
            ? prev.messages.findIndex(
                (m) =>
                  m.id.startsWith('local-') &&
                  m.conversationId === chatMsg.conversationId &&
                  m.text?.trim() === chatMsg.text?.trim(),
              )
            : -1

          if (optimisticIndex !== -1) {
            updatedMessages = prev.messages.map((m, idx) => (idx === optimisticIndex ? chatMsg : m))
          } else {
            updatedMessages = [...prev.messages, chatMsg]
          }
        }

        const updatedConvs = prev.conversations.map((c) => {
          if (c.id === chatMsg.conversationId) {
            return {
              ...c,
              unread: c.id === activeId ? 0 : (c.unread ?? 0) + 1,
            }
          }
          return c
        })

        return {
          conversations: updatedConvs,
          messages: updatedMessages,
        }
      })

      if (chatMsg.conversationId === activeId && chatMsg.senderId !== user?.id) {
        sendReadRef.current?.(chatMsg.id, chatMsg.conversationId)
      }
    },
    [activeId, user?.id, fetchBackendConversations],
  )

  const handleTypingReceived = useCallback(
    (evt: { conversationId: string; userId: string; typing: boolean }) => {
      if (evt.conversationId === activeId && evt.userId !== user?.id) {
        setIsOtherTyping(evt.typing)
      }
    },
    [activeId, user?.id],
  )

  const handleReadReceiptReceived = useCallback(
    (evt: { conversationId: string; messageId: string; userId: string }) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === evt.messageId ||
          (m.conversationId === evt.conversationId && m.senderId === user?.id)
            ? { ...m, status: 'SEEN' }
            : m,
        ),
      }))
    },
    [user?.id],
  )

  const handleConversationReceived = useCallback(
    async (summary: any) => {
      if (!summary || !summary.id) return

      const otherMember =
        summary.members?.find((m: any) => m.id !== user?.id) || summary.members?.[0]
      let displayName = summary.name
      if (summary.type === 'GROUP') {
        displayName = summary.name || 'Nhóm trò chuyện'
      } else if (otherMember && otherMember.id) {
        try {
          const profile = await chatApi.getUserProfile(otherMember.id)
          if (profile?.fullName) displayName = profile.fullName
        } catch {
          displayName = otherMember.fullName !== 'Member' ? otherMember.fullName : 'Người dùng'
        }
      }

      const conv: Conversation = {
        id: summary.id,
        kind: summary.type === 'GROUP' ? 'group' : 'direct',
        name: displayName || 'Người dùng',
        memberIds: summary.members?.map((m: any) => m.id) || [],
        unread: 0,
      }

      setState((prev) => {
        const exists = prev.conversations.some((c) => c.id === conv.id)
        if (exists) return prev
        return {
          ...prev,
          conversations: [conv, ...prev.conversations],
        }
      })
      toast.info(`Có cuộc trò chuyện mới từ ${displayName}`)
    },
    [user?.id],
  )

  const {
    isConnected,
    sendMessage: socketSend,
    sendTyping: socketTyping,
    sendRead: socketSendRead,
  } = useChatSocket({
    userId: user?.id,
    activeConversationId: activeId && isUuid(activeId) ? activeId : null,
    onMessageReceived: handleMessageReceived,
    onTypingReceived: handleTypingReceived,
    onReadReceiptReceived: handleReadReceiptReceived,
  })

  useEffect(() => {
    sendReadRef.current = socketSendRead
  }, [socketSendRead])

  function selectConversation(id: string) {
    setActiveId(id)
    setMobileChatOpen(true)
    setDetailsOpen(false)
    setIsOtherTyping(false)
    setState((s) => ({
      ...s,
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    }))
  }

  function updateActive(patch: Partial<Conversation>) {
    if (!active) return
    setState((s) => ({
      ...s,
      conversations: s.conversations.map((c) => (c.id === active.id ? { ...c, ...patch } : c)),
    }))
  }

  // 4. Gửi tin nhắn
  async function sendMessage(text: string, replyTo?: string) {
    if (!active || active.blocked) return

    const tempId = `local-${Date.now()}`
    const myId = user?.id || 'me'

    const localMsg: ChatMessage = {
      id: tempId,
      conversationId: active.id,
      senderId: myId,
      text,
      createdAt: new Date().toISOString(),
      replyTo,
      status: 'SENT',
    }

    setState((s) => ({ ...s, messages: [...s.messages, localMsg] }))

    if (isUuid(active.id) && isAuthenticated) {
      const sentViaWs = socketSend(active.id, text)
      if (!sentViaWs) {
        try {
          const res = await chatApi.sendMessage(active.id, { content: text })
          setState((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === tempId ? { ...m, id: res.id, status: res.status } : m,
            ),
          }))
        } catch (err) {
          console.error('Lỗi gửi tin nhắn qua REST fallback:', err)
          toast.error('Không thể gửi tin nhắn. Vui lòng thử lại!')
        }
      }
    } else {
      if (active.id.endsWith('-chat') || active.id === 'cau-giay' || active.id === 'design') {
        const otherId = active.memberIds.find((id) => id !== 'me') ?? 'linh'
        setTimeout(() => {
          const replies = [
            'Mình vừa nhận được tin của bạn!',
            'Tuyệt vời, hẹn gặp bạn lát nữa nhé.',
            'Đồng ý nhé, mình sẽ chuẩn bị trước.',
            'Cảm ơn bạn đã thông tin!',
          ]
          const randomReply = replies[Math.floor(Math.random() * replies.length)]
          const autoMsg: ChatMessage = {
            id: `reply-${Date.now()}`,
            conversationId: active.id,
            senderId: otherId,
            text: randomReply,
            createdAt: new Date().toISOString(),
          }
          setState((s) => ({ ...s, messages: [...s.messages, autoMsg] }))
        }, 1500)
      }
    }
  }

  const handleTyping = useCallback(
    (typing: boolean) => {
      if (active && isUuid(active.id) && isAuthenticated) {
        socketTyping(active.id, typing)
      }
    },
    [active, isAuthenticated, socketTyping],
  )

  // 5. Tạo cuộc trò chuyện 1-1 mới
  async function handleStartDirect(targetUser: { id: string; fullName: string }) {
    const existing = state.conversations.find(
      (c) => c.kind === 'direct' && c.memberIds.includes(targetUser.id),
    )
    if (existing) {
      selectConversation(existing.id)
      toast.info(`Đã mở cuộc trò chuyện có sẵn với ${targetUser.fullName}`)
      return
    }

    if (isUuid(targetUser.id) && isAuthenticated && user?.id) {
      try {
        const newConv = await chatApi.createConversation({
          type: 'DIRECT',
          memberIds: [targetUser.id],
        })

        const mapped: Conversation = {
          id: newConv.id,
          kind: 'direct',
          name: targetUser.fullName,
          memberIds: [user.id, targetUser.id],
          unread: 0,
        }

        setState((s) => ({
          ...s,
          conversations: [mapped, ...s.conversations.filter((c) => c.id !== mapped.id)],
        }))
        setActiveId(mapped.id)
        setMobileChatOpen(true)
        toast.success(`Đã mở cuộc trò chuyện với ${targetUser.fullName}`)
        return
      } catch (err: any) {
        console.error('Lỗi khi tạo direct chat:', err)
        const errMsg =
          err?.response?.data?.message || err?.message || 'Không thể tạo cuộc trò chuyện mới'
        toast.error(errMsg)
        return
      }
    }

    if (!isAuthenticated) {
      const newLocal: Conversation = {
        id: `direct-${Date.now()}`,
        kind: 'direct',
        name: targetUser.fullName,
        memberIds: ['me', targetUser.id],
        unread: 0,
      }
      setState((s) => ({ ...s, conversations: [newLocal, ...s.conversations] }))
      setActiveId(newLocal.id)
      setMobileChatOpen(true)
      toast.success(`Bắt đầu trò chuyện với ${targetUser.fullName}`)
    }
  }

  // 6. Tạo nhóm chat mới
  async function handleCreateGroup(name: string, memberIds: string[]) {
    const realMemberIds = memberIds.filter(isUuid)
    if (realMemberIds.length >= 2 && isAuthenticated && user?.id) {
      try {
        const newConv = await chatApi.createConversation({
          type: 'GROUP',
          name,
          memberIds: realMemberIds,
        })

        const mapped: Conversation = {
          id: newConv.id,
          kind: 'group',
          name,
          memberIds: [user.id, ...realMemberIds],
          unread: 0,
        }

        setState((s) => ({ ...s, conversations: [mapped, ...s.conversations] }))
        setActiveId(mapped.id)
        setMobileChatOpen(true)
        toast.success(`Đã tạo nhóm “${name}”`)
        return
      } catch (err) {
        console.error('Lỗi khi tạo nhóm qua backend:', err)
      }
    }

    const group: Conversation = {
      id: `group-${Date.now()}`,
      kind: 'group',
      name,
      memberIds: ['me', ...memberIds],
    }
    setState((s) => ({ ...s, conversations: [group, ...s.conversations] }))
    setActiveId(group.id)
    setMobileChatOpen(true)
    toast.success(`Đã tạo nhóm “${name}”`)
  }

  function deleteActive() {
    if (!active) return
    const remaining = state.conversations.filter((c) => c.id !== active.id)
    setState((s) => ({
      conversations: remaining,
      messages: s.messages.filter((m) => m.conversationId !== active.id),
    }))
    setActiveId(remaining[0]?.id ?? null)
    setMobileChatOpen(false)
    setDetailsOpen(false)
    toast.success('Cuộc trò chuyện đã được xóa')
  }

  function resetDemo() {
    resetChatState()
    const fresh = defaultChatState()
    setState(fresh)
    setActiveId(fresh.conversations[0]?.id ?? null)
    setMobileChatOpen(false)
    setDetailsOpen(false)
  }

  return (
    <div className="flex h-[calc(100dvh-var(--bottom-nav-h))] min-w-0 bg-background">
      <div
        className={cn(
          'min-h-0 w-full lg:flex lg:w-[330px] lg:shrink-0',
          mobileChatOpen ? 'hidden' : 'flex',
        )}
      >
        <ConversationList
          conversations={state.conversations}
          messages={state.messages}
          activeId={activeId}
          query={query}
          onQueryChange={setQuery}
          onSelect={selectConversation}
          onCreateGroup={() => setNewChatOpen(true)}
          onReset={resetDemo}
          isRealtimeConnected={isAuthenticated ? isConnected : undefined}
        />
      </div>

      <div className={cn('min-h-0 min-w-0 flex-1 lg:flex', mobileChatOpen ? 'flex' : 'hidden')}>
        {active ? (
          <>
            <ChatWindow
              key={active.id}
              conversation={active}
              messages={activeMessages}
              detailsOpen={detailsOpen}
              onSend={sendMessage}
              onBack={() => setMobileChatOpen(false)}
              onToggleDetails={() => setDetailsOpen((open) => !open)}
              onTyping={handleTyping}
              isOtherTyping={isOtherTyping}
              currentUserId={user?.id}
            />
            <DetailsPanel
              conversation={active}
              asSheet={!isDesktop}
              open={detailsOpen}
              onOpenChange={setDetailsOpen}
              onMute={() => {
                updateActive({ muted: !active.muted })
                toast(active.muted ? 'Đã bật thông báo' : 'Đã tắt thông báo')
              }}
              onBlock={() => {
                updateActive({ blocked: !active.blocked })
                toast(active.blocked ? 'Đã bỏ chặn' : 'Đã chặn cuộc trò chuyện')
              }}
              onReport={() => {
                if (!isDesktop) setDetailsOpen(false)
                setReportOpen(true)
              }}
              onDelete={deleteActive}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6 text-center">
            <div className="size-16 rounded-3xl bg-muted/50 flex items-center justify-center text-primary/80 mb-2">
              <MessageCircle className="size-8" />
            </div>
            <h3 className="font-semibold text-foreground text-lg">Chưa chọn cuộc trò chuyện nào</h3>
            <p className="text-sm max-w-sm text-muted-foreground">
              Chọn một liên hệ từ danh sách bên trái hoặc bắt đầu cuộc trò chuyện mới để kết nối
              ngay.
            </p>
            <button
              onClick={() => setNewChatOpen(true)}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Sparkles className="size-4" />
              Bắt đầu trò chuyện mới
            </button>
          </div>
        )}
      </div>

      <NewChatDialog
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onStartDirect={handleStartDirect}
        onCreateGroup={handleCreateGroup}
        isLoggedIn={isAuthenticated}
        currentUserId={user?.id}
      />

      {reportOpen && <ReportDialog onClose={() => setReportOpen(false)} />}
    </div>
  )
}

export default ChatPage
