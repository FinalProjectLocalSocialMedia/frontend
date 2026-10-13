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
import { type Conversation, userById } from '@/lib/mock-chat'
import { cn } from '@/lib/utils'
import { Avatar } from './avatar'

type Props = {
  conversation: Conversation
  /** true → bottom/side sheet (mobile); false → inline column (desktop). */
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
