import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { chatUsers } from '../mocks/mock-chat'
import { cn } from '@/lib/utils'
import { ChatAvatar } from './chat-avatar'

export function CreateGroupDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, memberIds: string[]) => void
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [name, setName] = useState('')

  const users = chatUsers.filter(
    (user) =>
      user.id !== 'me' &&
      `${user.name} ${user.username}`.toLowerCase().includes(query.toLowerCase()),
  )

  function toggle(id: string) {
    setSelected((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo nhóm chat</DialogTitle>
          <DialogDescription>Chọn ít nhất 2 thành viên.</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm thành viên..."
        />
        <div className="flex max-h-48 flex-col gap-1 overflow-auto">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => toggle(user.id)}
              className={cn(
                'flex items-center gap-3 rounded-xl p-2 text-left hover:bg-muted',
                selected.includes(user.id) && 'bg-primary/10',
              )}
            >
              <ChatAvatar id={user.id} small />
              <span className="flex-1">
                <span className="block text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.username}</span>
              </span>
              {selected.includes(user.id) && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên nhóm (tùy chọn)"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={selected.length < 2}
            onClick={() => onCreate(name.trim() || 'Nhóm mới', selected)}
          >
            Tạo nhóm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
