import { useState, useEffect } from 'react'
import { Check, MessageSquare, Plus, Search, Users, Loader2, Sparkles } from 'lucide-react'
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
import { chatUsers } from '@/lib/mock-chat'
import { chatApi } from '@/lib/chat-api'
import { cn } from '@/lib/utils'
import { Avatar } from './avatar'
import { toast } from 'sonner'

export interface FoundUser {
  id: string
  fullName: string
  username?: string
  avatarUrl?: string
  online?: boolean
  isReal?: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  onStartDirect: (targetUser: FoundUser) => Promise<void> | void
  onCreateGroup: (name: string, memberIds: string[]) => Promise<void> | void
  isLoggedIn: boolean
  currentUserId?: string
}

export function NewChatDialog({
  open,
  onClose,
  onStartDirect,
  onCreateGroup,
  isLoggedIn,
  currentUserId,
}: Props) {
  const [tab, setTab] = useState<'direct' | 'group'>('direct')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<FoundUser[]>([])
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Tải danh sách người dùng khi mở modal hoặc thay đổi từ khóa
  useEffect(() => {
    if (!open) return

    const trimmed = query.trim()
    setSearching(true)

    const timer = setTimeout(async () => {
      // 1. Mock users làm dự phòng
      const mockMatches: FoundUser[] = chatUsers
        .filter(
          (u) =>
            u.id !== 'me' &&
            (!trimmed || `${u.name} ${u.username}`.toLowerCase().includes(trimmed.toLowerCase())),
        )
        .map((u) => ({
          id: u.id,
          fullName: u.name,
          username: u.username,
          online: u.online,
          isReal: false,
        }))

      // 2. Nếu đã đăng nhập, tìm kiếm người dùng thực tế từ User Service
      if (isLoggedIn) {
        try {
          const apiUsers = await chatApi.searchUsers(trimmed)
          const mappedApiUsers: FoundUser[] = apiUsers
            .filter((u) => !currentUserId || u.id !== currentUserId)
            .map((u) => ({
              id: u.id,
              fullName: u.fullName,
              username: u.email,
              avatarUrl: u.avatarUrl,
              isReal: true,
            }))

          setSearchResults(mappedApiUsers)
        } catch (err) {
          console.error('Lỗi khi tải người dùng từ User Service:', err)
          setSearchResults([])
        } finally {
          setSearching(false)
        }
      } else {
        setSearchResults(mockMatches)
        setSearching(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [open, query, isLoggedIn, currentUserId])

  function toggleMember(id: string) {
    setSelectedGroupMembers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  async function handleSelectDirect(user: FoundUser) {
    setSubmitting(true)
    try {
      await onStartDirect(user)
      onClose()
    } catch {
      toast.error('Không thể bắt đầu cuộc trò chuyện. Vui lòng thử lại!')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateGroup() {
    if (selectedGroupMembers.length < 2) {
      toast.error('Vui lòng chọn ít nhất 2 thành viên')
      return
    }
    setSubmitting(true)
    try {
      const finalName = groupName.trim() || 'Nhóm mới'
      await onCreateGroup(finalName, selectedGroupMembers)
      onClose()
    } catch {
      toast.error('Lỗi khi tạo nhóm chat')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl sm:max-w-md">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold tracking-tight">
            Tạo cuộc trò chuyện mới
          </DialogTitle>
          <DialogDescription className="text-xs">
            Tìm kiếm người dùng đã đăng ký trên hệ thống hoặc danh bạ mẫu để chat trực tiếp.
          </DialogDescription>

          {/* Segmented Switcher Tab */}
          <div className="flex rounded-xl bg-muted/60 p-1 mt-4">
            <button
              type="button"
              onClick={() => setTab('direct')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all',
                tab === 'direct'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <MessageSquare className="size-3.5" />
              Nhắn tin trực tiếp (1-1)
            </button>
            <button
              type="button"
              onClick={() => setTab('group')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all',
                tab === 'group'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Users className="size-3.5" />
              Tạo nhóm chat
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 py-2 space-y-4">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === 'direct'
                  ? 'Tìm kiếm theo tên hoặc email...'
                  : 'Tìm kiếm thành viên để thêm...'
              }
              className="h-10 rounded-xl pl-9 text-sm"
            />
            {searching && (
              <Loader2 className="absolute top-3 right-3 size-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Trường hợp tạo nhóm: Nhập tên nhóm */}
          {tab === 'group' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tên nhóm</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="VD: Cà phê cuối tuần, Đội dự án..."
                className="h-10 rounded-xl text-sm"
              />
            </div>
          )}

          {/* Danh sách người dùng */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {tab === 'direct' ? 'Người dùng khả dụng' : `Chọn thành viên (${selectedGroupMembers.length} đã chọn)`}
              </p>
              {isLoggedIn && (
                <span className="text-[10px] text-primary flex items-center gap-1 font-medium">
                  <Sparkles className="size-3" />
                  Đã kết nối User Service
                </span>
              )}
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {searchResults.map((user) => {
                const isSelected = selectedGroupMembers.includes(user.id)
                return (
                  <button
                    key={user.id}
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      if (tab === 'direct') {
                        handleSelectDirect(user)
                      } else {
                        toggleMember(user.id)
                      }
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors',
                      isSelected ? 'bg-primary/10' : 'hover:bg-muted/80',
                    )}
                  >
                    <Avatar
                      id={user.id}
                      name={user.fullName}
                      avatarUrl={user.avatarUrl}
                      online={user.online}
                      small
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate leading-tight">{user.fullName}</p>
                        {user.isReal && (
                          <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                            Tài khoản thực
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.username || `@${user.id.slice(0, 8)}`}
                      </p>
                    </div>

                    {tab === 'direct' ? (
                      <span className="text-xs font-medium text-primary flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        Nhắn tin
                        <Plus className="size-3.5" />
                      </span>
                    ) : (
                      <div
                        className={cn(
                          'flex size-5 items-center justify-center rounded-md border text-primary-foreground transition-all',
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30 bg-transparent',
                        )}
                      >
                        {isSelected && <Check className="size-3 stroke-3" />}
                      </div>
                    )}
                  </button>
                )
              })}

              {searchResults.length === 0 && !searching && (
                <div className="py-8 text-center text-xs text-muted-foreground px-4">
                  {isLoggedIn
                    ? 'Chưa tìm thấy người dùng nào khác trong hệ thống. Hãy đăng ký thêm một tài khoản khác để nhắn tin 1-1.'
                    : 'Không tìm thấy người dùng phù hợp.'}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t border-border flex sm:justify-between items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>

          {tab === 'group' && (
            <Button
              size="sm"
              disabled={selectedGroupMembers.length < 2 || submitting}
              onClick={handleCreateGroup}
              className="gap-2"
            >
              {submitting && <Loader2 className="size-3.5 animate-spin" />}
              Tạo nhóm ({selectedGroupMembers.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
