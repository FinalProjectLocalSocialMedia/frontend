import {
  Check,
  CheckCheck,
  Copy,
  Download,
  FileText,
  ImagePlus,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { userById } from '../mocks/mock-chat'
import type { ChatMessage } from '../types/chat'
import { ChatAvatar } from './chat-avatar'

export type MessageRowProps = {
  message: ChatMessage & { status?: string }
  quoted?: ChatMessage
  onReply: () => void
  currentUserId?: string
  partnerName?: string
}

export function MessageRow({
  message,
  quoted,
  onReply,
  currentUserId,
  partnerName,
}: MessageRowProps) {
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

          {message.media && message.media.length > 0 && (
            <div className="flex flex-col gap-2 my-1">
              {message.media.map((item, idx) => {
                if (item.type === 'IMAGE') {
                  return (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-xl"
                    >
                      <img
                        src={item.url}
                        alt={item.name || 'Ảnh đính kèm'}
                        className="max-h-64 max-w-full rounded-xl object-cover hover:opacity-95 transition-opacity"
                      />
                    </a>
                  )
                }
                if (item.type === 'VIDEO') {
                  return (
                    <video
                      key={idx}
                      src={item.url}
                      controls
                      className="max-h-64 max-w-full rounded-xl"
                    />
                  )
                }
                return (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl p-2.5 text-xs transition-colors',
                      mine
                        ? 'bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground'
                        : 'bg-background hover:bg-muted text-foreground',
                    )}
                  >
                    <FileText className="size-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name || 'Tập tin đính kèm'}</p>
                      {item.size && (
                        <p className="text-[10px] opacity-75">
                          {(item.size / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>
                    <Download className="size-4 shrink-0 opacity-75" />
                  </a>
                )
              })}
            </div>
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
          ) : message.text ? (
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          ) : null}

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
