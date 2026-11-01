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
import type { ChatMessage, MediaItem } from '../types/chat'
import { AudioMessagePlayer } from './audio-message-player'
import { ChatAvatar } from './chat-avatar'

export type MessageRowProps = {
  message: ChatMessage & { status?: string }
  quoted?: ChatMessage
  onReply: () => void
  currentUserId?: string
  partnerName?: string
}

function getQuotedSummary(msg: ChatMessage): string {
  if (msg.text?.trim()) return msg.text
  if (msg.attachmentLabel) return msg.attachmentLabel
  const firstMedia = msg.media?.[0]
  if (!firstMedia) return 'Tệp đính kèm'
  if (firstMedia.type === 'AUDIO') return 'Tin nhắn thoại'
  if (firstMedia.type === 'VIDEO') return 'Video đính kèm'
  if (firstMedia.type === 'IMAGE') return 'Hình ảnh đính kèm'
  return firstMedia.name || 'Tệp đính kèm'
}

function isAudioMedia(item: MediaItem): boolean {
  if (item.type === 'AUDIO') return true
  if (item.format && /^(mp3|wav|ogg|m4a|aac|flac|opus|weba)$/i.test(item.format)) {
    return true
  }
  return /\.(mp3|wav|ogg|m4a|aac|flac|opus|weba)(\?|$)/i.test(item.url)
}

export function MessageRow({
  message,
  quoted,
  onReply,
  currentUserId,
  partnerName,
}: MessageRowProps) {
  const mine = Boolean(
    message.senderId === 'me' || (currentUserId && message.senderId === currentUserId),
  )
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
              {userById(quoted.senderId)?.name ?? 'Tin nhắn'}: {getQuotedSummary(quoted)}
            </p>
          )}

          {message.media && message.media.length > 0 && (
            <div className="flex flex-col gap-2 my-1">
              {message.media.map((item, idx) => {
                const key = item.assetId || item.publicId || `${item.url}-${idx}`

                if (isAudioMedia(item)) {
                  return (
                    <AudioMessagePlayer
                      key={key}
                      url={item.url}
                      duration={item.duration}
                      mine={mine}
                    />
                  )
                }

                if (item.type === 'IMAGE') {
                  return (
                    <a
                      key={key}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-xl"
                    >
                      <img
                        src={item.url}
                        alt={item.name || item.publicId || 'Ảnh đính kèm'}
                        className="max-h-64 max-w-full rounded-xl object-cover hover:opacity-95 transition-opacity"
                      />
                    </a>
                  )
                }

                if (item.type === 'VIDEO') {
                  return (
                    <video
                      key={key}
                      src={item.url}
                      controls
                      playsInline
                      preload="metadata"
                      className="max-h-64 max-w-full rounded-xl"
                    />
                  )
                }

                return (
                  <a
                    key={key}
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
                      <p className="truncate font-medium">
                        {item.name || item.publicId || 'Tập tin đính kèm'}
                      </p>
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
              aria-label="Sao chép tin nhắn"
              onClick={() => navigator.clipboard?.writeText(message.text ?? '')}
            >
              <Copy />
            </Button>
          )}
          <Button variant="ghost" size="xs" onClick={onReply}>
            Trả lời
          </Button>
        </div>
      </div>
    </div>
  )
}
