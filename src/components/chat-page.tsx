import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useIsDesktop } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import {
  type ChatMessage,
  type ChatState,
  type Conversation,
  defaultChatState,
  loadChatState,
  resetChatState,
  saveChatState,
} from '@/lib/mock-chat'
import { ChatWindow } from './chat/chat-window'
import { ConversationList } from './chat/conversation-list'
import { CreateGroupDialog } from './chat/create-group-dialog'
import { DetailsPanel } from './chat/details-panel'
import { ReportDialog } from './chat/report-dialog'

/**
 * Layout rules
 * - Desktop (lg+): ConversationList is ALWAYS visible on the left, ChatWindow on the right.
 * - Mobile: one pane at a time. `mobileChatOpen` decides which one (pure CSS, both stay mounted).
 */
export function ChatPage() {
  const [state, setState] = useState<ChatState>(loadChatState)
  const [activeId, setActiveId] = useState<string | null>(() => state.conversations[0]?.id ?? null)
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const isDesktop = useIsDesktop()

  useEffect(() => {
    saveChatState(state)
  }, [state])

  const active = state.conversations.find((c) => c.id === activeId) ?? null
  const activeMessages = state.messages.filter((m) => m.conversationId === active?.id)

  function selectConversation(id: string) {
    setActiveId(id)
    setMobileChatOpen(true)
    setDetailsOpen(false)
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

  function sendMessage(text: string, replyTo?: string) {
    if (!active || active.blocked) return
    const message: ChatMessage = {
      id: `local-${Date.now()}`,
      conversationId: active.id,
      senderId: 'me',
      text,
      createdAt: new Date().toISOString(),
      replyTo,
    }
    setState((s) => ({ ...s, messages: [...s.messages, message] }))
  }

  function createGroup(name: string, memberIds: string[]) {
    const group: Conversation = {
      id: `group-${Date.now()}`,
      kind: 'group',
      name,
      memberIds: ['me', ...memberIds],
    }
    setState((s) => ({ ...s, conversations: [group, ...s.conversations] }))
    setActiveId(group.id)
    setMobileChatOpen(true)
    setGroupOpen(false)
    toast.success(`Group “${name}” created`)
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
    toast.success('Conversation deleted')
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
          onCreateGroup={() => setGroupOpen(true)}
          onReset={resetDemo}
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
            />
            <DetailsPanel
              conversation={active}
              asSheet={!isDesktop}
              open={detailsOpen}
              onOpenChange={setDetailsOpen}
              onMute={() => {
                updateActive({ muted: !active.muted })
                toast(active.muted ? 'Notifications unmuted' : 'Notifications muted')
              }}
              onBlock={() => {
                updateActive({ blocked: !active.blocked })
                toast(active.blocked ? 'Chat unblocked' : 'Chat blocked')
              }}
              onReport={() => {
                // Close the mobile sheet first so two modal layers never stack.
                if (!isDesktop) setDetailsOpen(false)
                setReportOpen(true)
              }}
              onDelete={deleteActive}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageCircle className="size-10" />
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      {groupOpen && (
        <CreateGroupDialog onClose={() => setGroupOpen(false)} onCreate={createGroup} />
      )}
      {reportOpen && <ReportDialog onClose={() => setReportOpen(false)} />}
    </div>
  )
}

export default ChatPage
