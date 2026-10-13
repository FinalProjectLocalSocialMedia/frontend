import { BellOff, Search, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { type ChatMessage, type Conversation, messagesFor } from '@/lib/mock-chat'
import { Avatar, GroupAvatars } from './avatar'

type Props = {
  conversations: Conversation[]
  messages: ChatMessage[]
  activeId: string | null
  query: string
  onQueryChange: (value: string) => void
  onSelect: (id: string) => void
  onCreateGroup: () => void
  onReset: () => void
}

export function ConversationList({
  conversations,
  messages,
  activeId,
  query,
  onQueryChange,
  onSelect,
  onCreateGroup,
  onReset,
}: Props) {
  const rows = conversations
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    .map((c) => ({ conversation: c, last: messagesFor(c.id, messages).at(-1) }))
    // Newest activity first; conversations without messages (just created) stay on top.
    .sort((a, b) => lastTime(b.last) - lastTime(a.last))

  return (
    <aside className="flex min-h-0 w-full flex-1 flex-col border-r border-border/70 bg-card">
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              nearby.
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Messages</h1>
          </div>
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Create group chat"
            onClick={onCreateGroup}
          >
            <UserPlus />
          </Button>
        </div>
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search conversations"
            className="h-10 rounded-xl pl-9"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3">
        {rows.map(({ conversation, last }) => {
          const otherId = conversation.memberIds.find((id) => id !== 'me') ?? 'me'
          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              aria-current={activeId === conversation.id}
              className={cn(
                'flex items-center gap-3 rounded-xl p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                activeId === conversation.id ? 'bg-primary/10' : 'hover:bg-muted',
              )}
            >
              {conversation.kind === 'group' ? (
                <GroupAvatars ids={conversation.memberIds.filter((id) => id !== 'me')} />
              ) : (
                <Avatar id={otherId} />
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 truncate text-sm font-semibold">
                  {conversation.name}
                  {conversation.muted && <BellOff className="size-3.5 text-muted-foreground" />}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {last ? (last.text ?? last.attachmentLabel) : 'No messages yet'}
                </span>
              </span>
              {conversation.unread ? <Badge>{conversation.unread}</Badge> : null}
            </button>
          )
        })}
        {rows.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            No conversations found.
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        size="xs"
        onClick={onReset}
        className="m-3 self-start text-muted-foreground"
      >
        Reset demo data
      </Button>
    </aside>
  )
}

function lastTime(message?: ChatMessage) {
  return message ? Date.parse(message.createdAt) : Number.MAX_SAFE_INTEGER
}
