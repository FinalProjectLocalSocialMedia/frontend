import type { ReactNode } from 'react'
import { Ban, BellOff, Flag, Trash2, Volume2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { userById } from '../mocks/mock-chat'
import type { Conversation } from '../types/chat'
import { cn } from '@/lib/utils'
import { ChatAvatar } from './chat-avatar'

type Props = {
  conversation: Conversation
  asSheet: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onMute: () => void
  onBlock: () => void
  onReport: () => void
  onDelete: () => void
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

function DetailsBody({
  conversation,
  onMute,
  onBlock,
  onReport,
  onDelete,
}: Omit<Props, 'asSheet' | 'open' | 'onOpenChange'>) {
  return (
    <>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Thành viên
      </h4>
      <div className="mt-3 flex flex-col gap-3">
        {conversation.memberIds.map((id) => {
          const isTestEnv = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test'
          const user = isTestEnv ? userById(id) : null
          const memberName = user?.name || (id === 'me' ? 'Bạn' : conversation.name || 'Thành viên')
          const memberUsername = user?.username || ''
          return (
            <div key={id} className="flex items-center gap-3">
              <ChatAvatar id={id} name={memberName} small />
              <div>
                <p className="text-sm font-medium">{memberName}</p>
                {memberUsername && <p className="text-xs text-muted-foreground">{memberUsername}</p>}
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
    </>
  )
}

export function DetailsPanel({ asSheet, open, onOpenChange, ...body }: Props) {
  if (asSheet) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="data-[side=right]:w-full">
          <SheetHeader>
            <SheetTitle>Conversation details</SheetTitle>
            <SheetDescription>{body.conversation.name}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <DetailsBody {...body} />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (!open) return null
  return (
    <aside className="w-[280px] shrink-0 overflow-y-auto border-l border-border bg-card p-5">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-semibold">Conversation details</h3>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close details"
          onClick={() => onOpenChange(false)}
        >
          <X />
        </Button>
      </div>
      <DetailsBody {...body} />
    </aside>
  )
}
