import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ArrowLeft,
  BellOff,
  FileText,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  Smile,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { userById } from '../mocks/mock-chat'
import { uploadChatMedia } from '../api/chat-upload-api'
import type { ChatMessage, Conversation, MediaItem } from '../types/chat'
import { ChatAvatar, GroupAvatars } from './chat-avatar'
import { MessageRow } from './message-row'

type Props = {
  conversation: Conversation
  messages: ChatMessage[]
  detailsOpen: boolean
  onSend: (text: string, replyTo?: string, media?: MediaItem[]) => void
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
  const [attachedMedia, setAttachedMedia] = useState<MediaItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const otherId = conversation.memberIds.find((id) => id !== 'me' && id !== currentUserId) ?? 'me'
  const isTestEnv = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test'
  const other = isTestEnv ? userById(otherId) : null
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

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const item = await uploadChatMedia(file)
      setAttachedMedia((prev) => [...prev, item])
      toast.success(`Đã tải lên tệp: ${file.name}`)
    } catch (err: unknown) {
      console.error('Lỗi tải tệp lên Cloudinary:', err)
      const msg = err instanceof Error ? err.message : 'Không thể tải tệp lên'
      toast.error(msg)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function send() {
    const value = text.trim()
    if ((!value && attachedMedia.length === 0) || conversation.blocked) return

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    onTyping?.(false)

    onSend(value, reply?.id, attachedMedia.length ? attachedMedia : undefined)
    setText('')
    setAttachedMedia([])
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

      {(attachedMedia.length > 0 || isUploading) && (
        <div className="border-t border-border bg-muted/40 px-4 py-2 flex flex-wrap gap-2 items-center">
          {attachedMedia.map((m, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs shadow-2xs"
            >
              {m.type === 'IMAGE' ? (
                <img src={m.url} alt="" className="size-5 rounded object-cover" />
              ) : (
                <FileText className="size-4 text-muted-foreground" />
              )}
              <span className="max-w-36 truncate font-medium">{m.name || 'Tập tin'}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Xóa tệp đính kèm"
                onClick={() => setAttachedMedia((prev) => prev.filter((_, i) => i !== idx))}
                className="size-4 p-0 ml-1 hover:bg-muted"
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
          {isUploading && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Đang tải lên Cloudinary...</span>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border bg-card p-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Attach file"
            className="text-muted-foreground"
            disabled={conversation.blocked || isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? <Loader2 className="size-5 animate-spin" /> : <Paperclip className="size-5" />}
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

