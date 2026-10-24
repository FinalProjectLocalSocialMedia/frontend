import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ArrowLeft,
  BellOff,
  Check,
  CheckCheck,
  Copy,
  ImagePlus,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  Smile,
  Video,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { userById } from '../mocks/mock-chat'
import type { ChatMessage, Conversation } from '../types/chat'
import { ChatAvatar, GroupAvatars } from './chat-avatar'

type Props = {
  conversation: Conversation
  messages: ChatMessage[]
  detailsOpen: boolean
  onSend: (text: string, replyTo?: string) => void
  onBack: () => void
  onToggleDetails: () => void
  onTyping?: (isTyping: boolean) => void
  isOtherTyping?: boolean
  currentUserId?: string
}

export function ChatWindow({
  conversation,
  messages,
  detailsOpen,
  onSend,
  onBack,
  onToggleDetails,
  onTyping,
  isOtherTyping,
  currentUserId,
}: Props) {
  const [text, setText] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [reply, setReply] = useState<ChatMessage | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const otherId = conversation.memberIds.find((id) => id !== 'me' && id !== currentUserId) ?? 'me'
  const other = userById(otherId)
  const term = search.trim().toLowerCase()
  const visible = term
    ? messages.filter((m) =>
        `${m.text ?? ''} ${m.attachmentLabel ?? ''}`.toLowerCase().includes(term),
      )
    : messages

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, conversation.id, isOtherTyping])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value
      setText(val)

      if (onTyping) {
        onTyping(true)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false)
        }, 1500)
      }
    },
    [onTyping],
  )

  function send() {
    const value = text.trim()
    if (!value || conversation.blocked) return

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    onTyping?.(false)

    onSend(value, reply?.id)
    setText('')
    setReply(null)
  }

  function toggleSearch() {
    setSearchOpen((open) => !open)
    setSearch('')
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
      <header className="border-b border-border bg-card px-4 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={onBack}
            aria-label="Back to conversations"
            className="lg:hidden"
          >
            <ArrowLeft />
          </Button>
          {conversation.kind === 'group' ? (
            <GroupAvatars
              ids={conversation.memberIds.filter((id) => id !== 'me' && id !== currentUserId)}
            />
          ) : (
            <ChatAvatar id={otherId} name={conversation.name} online={other?.online} />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 truncate font-semibold">
              {conversation.name}
              {conversation.muted && <BellOff className="size-4 shrink-0 text-muted-foreground" />}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              {conversation.kind === 'group' ? (
                `${conversation.memberIds.length} members`
              ) : other?.online ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              ) : (
                (other?.lastSeen ?? 'Trực tuyến gần đây')
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Search messages"
            aria-pressed={searchOpen}
            onClick={toggleSearch}
            className={searchOpen ? 'bg-muted text-primary' : 'text-muted-foreground'}
          >
            <Search />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Conversation details"
            aria-pressed={detailsOpen}
            onClick={onToggleDetails}
            className={detailsOpen ? 'bg-muted text-primary' : 'text-muted-foreground'}
          >
            <MoreHorizontal />
          </Button>
        </div>
        {searchOpen && (
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages"
            className="mt-3"
          />
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {visible.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              quoted={message.replyTo ? messages.find((m) => m.id === message.replyTo) : undefined}
              onReply={() => setReply(message)}
              currentUserId={currentUserId}
              partnerName={conversation.name}
            />
          ))}

          {isOtherTyping && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1 animate-in fade-in duration-200">
              <ChatAvatar id={otherId} name={conversation.name} small />
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted/80 px-3.5 py-2 text-xs">
                <span className="size-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.3s]" />
                <span className="size-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.15s]" />
                <span className="size-1.5 rounded-full bg-primary/70 animate-bounce" />
                <span className="ml-1 text-[11px] font-medium text-foreground/80">
                  {conversation.name} đang soạn tin...
                </span>
              </div>
            </div>
          )}

          {visible.length === 0 && !isOtherTyping && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {term ? 'No messages match your search.' : 'Say hi to start the conversation.'}
            </p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {reply && (
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-xs">
          <span className="truncate">
            Replying to {userById(reply.senderId)?.name || conversation.name}:{' '}
            {reply.text ?? reply.attachmentLabel}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Cancel reply"
            onClick={() => setReply(null)}
            className="ml-2"
          >
            <X />
          </Button>
        </div>
      )}

      <div className="border-t border-border bg-card p-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Attach file"
            className="text-muted-foreground"
          >
            <Paperclip />
          </Button>
          <Textarea
            value={text}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229
              ) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={conversation.blocked ? 'Chat blocked' : 'Write a message...'}
            disabled={conversation.blocked}
            rows={1}
            className="min-h-10 flex-1 rounded-xl text-sm resize-none"
          />
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Add emoji"
            className="text-muted-foreground"
          >
            <Smile />
          </Button>
          <Button
            size="icon-lg"
            aria-label="Send message"
            onClick={send}
            disabled={!text.trim() || conversation.blocked}
            className="rounded-xl shadow-xs"
          >
            <Send />
          </Button>
        </div>
      </div>
    </section>
  )
}

function MessageRow({
  message,
  quoted,
  onReply,
  currentUserId,
  partnerName,
}: {
  message: ChatMessage & { status?: string }
  quoted?: ChatMessage
  onReply: () => void
  currentUserId?: string
  partnerName?: string
}) {
  const mine = message.senderId === 'me' || (currentUserId && message.senderId === currentUserId)

  const senderName = mine ? 'Tôi' : userById(message.senderId)?.name || partnerName || 'Người dùng'

  return (
    <div className={cn('group flex gap-2', mine && 'justify-end')}>
      {!mine && <ChatAvatar id={message.senderId} name={senderName} small />}
      <div className={cn('flex max-w-[78%] flex-col', mine && 'items-end')}>
        {!mine && (
          <span className="mb-1 px-1 text-[11px] font-medium text-muted-foreground">
            {senderName}
          </span>
        )}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-2xs transition-all',
            mine ? 'rounded-br-xs bg-primary text-primary-foreground' : 'rounded-bl-xs bg-muted',
          )}
        >
          {quoted && (
            <p className="mb-1.5 truncate border-l-2 border-current/40 pl-2 text-xs opacity-75">
              {userById(quoted.senderId)?.name ?? 'Tin nhắn'}:{' '}
              {quoted.text ?? quoted.attachmentLabel}
            </p>
          )}
          {message.kind === 'image' || message.kind === 'video' ? (
            <>
              {message.kind === 'image' ? (
                <ImagePlus className="mb-2 size-5" />
              ) : (
                <Video className="mb-2 size-5" />
              )}
              {message.attachmentLabel}
            </>
          ) : (
            message.text
          )}
          {message.reactions?.length ? (
            <span className="ml-2">{message.reactions.join(' ')}</span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 px-1 pt-1 text-[11px] text-muted-foreground focus-within:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <span>
            {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          {mine && (
            <span
              title={message.status === 'SEEN' ? 'Đã xem' : 'Đã gửi'}
              className="inline-flex items-center"
            >
              {message.status === 'SEEN' ? (
                <CheckCheck className="size-3 text-sky-500" />
              ) : (
                <Check className="size-3 text-muted-foreground" />
              )}
            </span>
          )}

          {message.text && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Copy message"
              onClick={() => navigator.clipboard?.writeText(message.text ?? '')}
            >
              <Copy />
            </Button>
          )}
          <Button variant="ghost" size="xs" onClick={onReply}>
            Reply
          </Button>
        </div>
      </div>
    </div>
  )
}
