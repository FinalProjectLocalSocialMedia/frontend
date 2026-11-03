import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  BellOff,
  Film,
  Mic,
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
import { useStagedMedia, type StagedMediaBatch } from '@/hooks/use-staged-media'
import { userById } from '../mocks/mock-chat'
import type { ChatMessage, Conversation, MediaItem } from '../types/chat'
import { ChatAvatar, GroupAvatars } from './chat-avatar'
import { MessageRow } from './message-row'

const CHAT_MEDIA_TYPES = ['IMAGE', 'VIDEO', 'AUDIO'] as const

type Props = {
  conversation: Conversation
  messages: ChatMessage[]
  detailsOpen: boolean
  onSend: (
    text: string,
    replyTo?: string,
    media?: MediaItem[],
    stagedBatch?: StagedMediaBatch<'IMAGE' | 'VIDEO' | 'AUDIO'>,
  ) => void
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
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { stagedFiles, addFiles, removeFile, takeFiles } = useStagedMedia({
    allowedTypes: CHAT_MEDIA_TYPES,
    onError: (msg) => toast.error(msg),
  })

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

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setText(val)

    if (onTyping) {
      onTyping(true)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false)
      }, 1500)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      addFiles(e.target.files)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const canSend = (Boolean(text.trim()) || stagedFiles.length > 0) && !conversation.blocked

  function send() {
    const value = text.trim()
    if ((!value && stagedFiles.length === 0) || conversation.blocked) {
      return
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    onTyping?.(false)

    const stagedBatch = stagedFiles.length > 0 ? takeFiles() : undefined
    const replyId = reply?.id

    setText('')
    setReply(null)

    onSend(value, replyId, undefined, stagedBatch)
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
            aria-label="Quay lại danh sách hội thoại"
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
                `${conversation.memberIds.length} thành viên`
              ) : other?.online ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang hoạt động
                </span>
              ) : (
                (other?.lastSeen ?? 'Trực tuyến gần đây')
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Tìm kiếm tin nhắn"
            aria-pressed={searchOpen}
            onClick={toggleSearch}
            className={searchOpen ? 'bg-muted text-primary' : 'text-muted-foreground'}
          >
            <Search />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Chi tiết cuộc trò chuyện"
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
            placeholder="Tìm kiếm tin nhắn..."
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
              {term ? 'Không tìm thấy tin nhắn phù hợp.' : 'Gửi lời chào để bắt đầu cuộc trò chuyện.'}
            </p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {reply && (
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-xs">
          <span className="truncate">
            Đang trả lời {userById(reply.senderId)?.name || conversation.name}:{' '}
            {reply.text || reply.attachmentLabel || 'Tệp đính kèm'}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Hủy trả lời"
            onClick={() => setReply(null)}
            className="ml-2"
          >
            <X />
          </Button>
        </div>
      )}

      {stagedFiles.length > 0 && (
        <div className="border-t border-border bg-muted/40 px-4 py-2 flex flex-wrap gap-2 items-center">
          {stagedFiles.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs shadow-2xs"
            >
              {item.type === 'IMAGE' ? (
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="size-7 rounded-md object-cover"
                />
              ) : item.type === 'VIDEO' ? (
                <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Film className="size-4" />
                </span>
              ) : (
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Mic className="size-3.5" />
                </span>
              )}
              <div className="min-w-0 max-w-40">
                <p className="truncate font-medium text-foreground">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {item.type === 'AUDIO'
                    ? 'Ghi âm'
                    : item.type === 'VIDEO'
                      ? 'Video'
                      : 'Hình ảnh'}{' '}
                  • {(item.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Xóa ${item.name}`}
                onClick={() => removeFile(item.id)}
                className="size-5 p-0 ml-0.5 hover:bg-muted"
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border bg-card p-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            aria-label="Chọn ảnh, video hoặc ghi âm"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Đính kèm ảnh, video hoặc ghi âm"
            className="text-muted-foreground"
            disabled={conversation.blocked}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="size-5" />
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
            placeholder={
              conversation.blocked
                ? 'Cuộc trò chuyện đã bị chặn'
                : stagedFiles.length > 0
                  ? 'Thêm lời nhắn hoặc nhấn Gửi ngay...'
                  : 'Nhập tin nhắn...'
            }
            disabled={conversation.blocked}
            rows={1}
            className="min-h-10 flex-1 rounded-xl text-sm resize-none"
          />
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Thêm biểu tượng cảm xúc"
            className="text-muted-foreground"
          >
            <Smile />
          </Button>
          <Button
            size="icon-lg"
            aria-label="Gửi tin nhắn"
            onClick={send}
            disabled={!canSend}
            className="rounded-xl shadow-xs"
          >
            <Send />
          </Button>
        </div>
      </div>
    </section>
  )
}
