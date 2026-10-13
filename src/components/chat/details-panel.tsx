import type { ReactNode } from 'react'
import { Ban, BellOff, Flag, Trash2, Volume2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { type Conversation, userById } from '@/lib/mock-chat'
import { cn } from '@/lib/utils'
import { Avatar } from './avatar'

type Props = {
  conversation: Conversation
  onMute: () => void
  onBlock: () => void
  onReport: () => void
  onDelete: () => void
  onClose: () => void
}

function Action({
  icon,
  children,
  onClick,
  destructive,
}: {
  icon: ReactNode
  children: ReactNode
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn('h-10 justify-start gap-3 px-2', destructive && 'text-destructive')}
    >
      {icon}
      {children}
    </Button>
  )
}

export function DetailsPanel({
  conversation,
  onMute,
  onBlock,
  onReport,
  onDelete,
  onClose,
}: Props) {
  return (
    // Full-screen sheet on mobile, fixed-width side column on desktop.
    <aside className="fixed inset-0 z-40 overflow-y-auto bg-card p-5 lg:static lg:z-auto lg:w-[280px] lg:shrink-0 lg:border-l lg:border-border">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Conversation details</h3>
        <Button variant="ghost" size="icon" aria-label="Close details" onClick={onClose}>
          <X />
        </Button>
      </div>

      <h4 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Members
      </h4>
      <div className="mt-3 flex flex-col gap-3">
        {conversation.memberIds.map((id) => {
          const user = userById(id)
          return (
            <div key={id} className="flex items-center gap-3">
              <Avatar id={id} small />
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.username}</p>
              </div>
            </div>
          )
        })}
      </div>

      <Separator className="my-6" />

      <div className="flex flex-col gap-1">
        <Action onClick={onMute} icon={conversation.muted ? <Volume2 /> : <BellOff />}>
          {conversation.muted ? 'Unmute notifications' : 'Mute notifications'}
        </Action>
        <Action onClick={onBlock} icon={<Ban />}>
          {conversation.blocked ? 'Unblock chat' : 'Block chat'}
        </Action>
        <Action onClick={onReport} icon={<Flag />}>
          Report conversation
        </Action>
        <Action onClick={onDelete} icon={<Trash2 />} destructive>
          Delete conversation
        </Action>
      </div>
    </aside>
  )
}
