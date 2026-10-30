import { useRef, useState, type ReactNode } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Camera,
  Check,
  Edit3,
  Flag,
  MoreHorizontal,
  Search,
  Trash2,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { SEED_AUTHORS } from '@/features/map/api/mock/seed'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog as UiDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { nearbyPosts, type NearbyPost } from '@/lib/mock-nearby'
import { currentUserId, usePosts } from '@/lib/posts-context'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import type { PostSearchItem } from '@/features/post/types/post'

export type ProfileData = {
  id: string
  name: string
  username: string
  bio: string
  initials: string
  color: string
  location: string
  followers: number
  following: number
}

const ownerProfile: ProfileData = {
  id: 'me',
  name: 'Nguyễn Minh',
  username: '@minhnguyen',
  bio: 'Sharing the local pulse around Cầu Giấy. Coffee, traffic, and good neighborhood energy.',
  initials: 'NM',
  color: 'bg-amber-100 text-amber-700',
  location: 'Cầu Giấy, Hanoi',
  followers: 248,
  following: 186,
}

const people = [
  {
    id: 'huy',
    name: 'Huy Phạm',
    username: '@huypham',
    initials: 'HP',
    color: 'bg-sky-100 text-sky-700',
  },
  {
    id: 'linh',
    name: 'Linh Trần',
    username: '@linh.works',
    initials: 'LT',
    color: 'bg-rose-100 text-rose-700',
  },
  {
    id: 'anh',
    name: 'Mai Anh',
    username: '@maianh',
    initials: 'MA',
    color: 'bg-violet-100 text-violet-700',
  },
]

function Dialog({
  title,
  description,
  children,
  onClose,
}: {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <UiDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </UiDialog>
  )
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'
  )
}

function formatPostTime(createdAt: string) {
  const date = new Date(createdAt)
  return Number.isNaN(date.getTime()) ? createdAt : formatDistanceToNow(date, { addSuffix: true })
}

/** `onDelete` is only passed for posts the current user is allowed to delete. */
function ProfilePost({ post, onDelete }: { post: PostSearchItem; onDelete?: () => void }) {
  const topic = post.content.match(/#[\p{L}\p{N}_]+/u)?.[0]

  return (
    <article className="border-b border-border p-5 last:border-0">
      <div className="flex gap-3">
        <Avatar>
          <AvatarFallback>{getInitials(post.author.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{post.author.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {formatPostTime(post.createdAt)} · {post.location?.name ?? 'Nearby'}
              </p>
            </div>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete post"
                onClick={onDelete}
                className="-mr-2 -mt-1 text-muted-foreground"
              >
                <Trash2 />
              </Button>
            )}
          </div>
          <p className="mt-3 leading-6">{post.content}</p>
          {topic && <p className="mt-2 text-xs font-semibold text-primary">{topic}</p>}
          <div className="mt-4 flex gap-5 text-xs text-muted-foreground">
            <span>♡ {post.likeCount}</span>
            <span>Comments {post.commentCount}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

type Confirm = { kind: 'block' } | { kind: 'report' } | { kind: 'delete'; postId: string } | null

const emptyStates: Record<string, { title: string; hint: string }> = {
  Posts: { title: 'No public posts yet', hint: 'Posts you share will appear here.' },
  Liked: { title: 'No liked posts yet', hint: 'Tap the heart on a post to like it.' },
  Saved: { title: 'No saved posts yet', hint: 'Use the “...” menu on a post to save it.' },
}

export function ProfilePage({
  profile = ownerProfile,
  isOwnProfile = true,
}: {
  profile?: ProfileData
  isOwnProfile?: boolean
}) {
  const navigate = useNavigate()
  const { userId } = useParams()
  const { user, isAuthenticated } = useAuth()
  const { posts: allPosts, savedIds, likedIds, removePost } = usePosts()

  // Xác định xem có phải trang cá nhân của chính mình không (dựa vào prop hoặc userId trên route)
  const isActualOwn = isOwnProfile && (!userId || userId === user?.id || userId === 'me')

  // Tìm tác giả tương ứng nếu xem profile của người dùng khác
  const otherAuthor = userId ? SEED_AUTHORS.find((a) => a.id === userId) : null
  const otherProfile: ProfileData = {
    id: userId || 'other',
    name: otherAuthor?.displayName || 'Người dùng',
    username: otherAuthor
      ? `@${otherAuthor.displayName.toLowerCase().replace(/\s+/g, '')}`
      : `@user_${userId}`,
    bio: 'Thành viên cộng đồng LBSN.',
    initials: otherAuthor?.displayName ? getInitials(otherAuthor.displayName) : 'U',
    color: 'bg-primary/10 text-primary',
    location: 'Hà Nội, Việt Nam',
    followers: 42,
    following: 18,
  }

  // Đồng bộ thông tin profile của user đăng nhập thực tế nếu có
  const effectiveProfile: ProfileData = isActualOwn
    ? user
      ? {
          id: user.id,
          name: ('fullName' in user && user.fullName) || 'Người dùng',
          username: user.email ? `@${user.email.split('@')[0]}` : '@user',
          bio: ('bio' in user && user.bio) || 'Chưa có tiểu sử giới thiệu.',
          initials:
            'fullName' in user && user.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'ME',
          color: 'bg-primary/10 text-primary',
          location: 'Hà Nội, Việt Nam',
          followers: 120,
          following: 85,
        }
      : profile
    : userId
      ? otherProfile
      : profile

  const [data, setData] = useState(effectiveProfile)
  const [tab, setTab] = useState('Posts')
  const [following, setFollowing] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [peopleOpen, setPeopleOpen] = useState<'followers' | 'following' | null>(null)
  const [peopleSearch, setPeopleSearch] = useState('')
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [reportDetails, setReportDetails] = useState('')
  const [draft, setDraft] = useState(data)
  const avatarInput = useRef<HTMLInputElement>(null)

  const postItems = allPosts?.items ?? []
  const profileUserId = isActualOwn ? currentUserId : (userId || profile.username.replace(/^@/, ''))
  const ownPosts = postItems.filter((post: PostSearchItem) => post.author.id === profileUserId)
  const tabs = isActualOwn ? ['Posts', 'Liked', 'Saved'] : ['Posts']
  const postsByTab: Record<string, PostSearchItem[]> = {
    Posts: ownPosts,
    Liked: postItems.filter((post: PostSearchItem) => likedIds.includes(post.id)),
    Saved: postItems.filter((post: PostSearchItem) => savedIds.includes(post.id)),
  }
  const visiblePeople = people.filter((person) =>
    `${person.name} ${person.username}`.toLowerCase().includes(peopleSearch.toLowerCase()),
  )

  function openEdit() {
    setDraft(data)
    setEditOpen(true)
  }

  function saveProfile() {
    if (!draft.name.trim() || !draft.username.trim() || draft.bio.length > 160) return
    setData({
      ...draft,
      name: draft.name.trim(),
      username: draft.username.trim(),
      bio: draft.bio.trim(),
    })
    setEditOpen(false)
    toast.success('Profile updated')
  }

  function closeConfirm() {
    setConfirm(null)
    setReportDetails('')
  }

  function executeConfirm() {
    if (!confirm) return
    if (confirm.kind === 'delete') {
      removePost(confirm.postId)
      toast.success('Post deleted')
    } else if (confirm.kind === 'block') {
      toast.success('User blocked')
    } else {
      toast.success('Report submitted', { description: 'Thanks for helping keep nearby. safe.' })
    }
    closeConfirm()
  }

  const confirmCopy = {
    report: {
      title: 'Report profile',
      text: 'Tell us what is wrong with this profile. Our team will review your report.',
      action: 'Submit report',
    },
    block: {
      title: 'Block this user?',
      text: 'This user will not be able to view or interact with you.',
      action: 'Block',
    },
    delete: {
      title: 'Delete this post?',
      text: 'This action cannot be undone.',
      action: 'Delete',
    },
  }

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(String(value))} className="gap-0">
      <section className="border-b border-border bg-card px-5 py-8 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Your identity nearby
          </p>
          <div className="mt-5 flex gap-4">
            <Avatar className="size-20">
              <AvatarFallback className={cn('text-lg', data.color)}>{data.initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{data.name}</h1>
                <span className="text-sm text-muted-foreground">{data.username}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{data.bio}</p>
              <p className="mt-2 text-xs font-medium text-primary">{data.location}</p>
              <div className="mt-4 flex flex-wrap gap-5 text-sm">
                <button onClick={() => setPeopleOpen('followers')}>
                  <strong>{data.followers}</strong> followers
                </button>
                <button onClick={() => setPeopleOpen('following')}>
                  <strong>{data.following}</strong> following
                </button>
                <span>
                  <strong>{ownPosts.length}</strong> posts
                </span>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {isOwnProfile ? (
              <Button onClick={openEdit}>
                <Edit3 data-icon="inline-start" /> Edit profile
              </Button>
            ) : (
              <>
                <Button
                  variant={following ? 'outline' : 'default'}
                  onClick={() => setFollowing(!following)}
                >
                  {following ? (
                    <Check data-icon="inline-start" />
                  ) : (
                    <UserPlus data-icon="inline-start" />
                  )}{' '}
                  {following ? 'Following' : 'Follow'}
                </Button>
                <Button variant="outline" onClick={() => navigate('/messages')}>
                  Message
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="icon" aria-label="More actions" />}
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem onClick={() => setConfirm({ kind: 'block' })}>
                  <UserRound /> Block user
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirm({ kind: 'report' })}
                >
                  <Flag /> Report profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <TabsList variant="line" className="mt-6 w-full border-t border-border pt-3">
            {tabs.map((item) => (
              <TabsTrigger key={item} value={item}>
                {item}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-10">
        {tabs.map((item) => {
          const list = postsByTab[item]
          return (
            <TabsContent key={item} value={item}>
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                {list.length ? (
                  list.map((post) => (
                    <ProfilePost
                      key={post.id}
                      post={post}
                      onDelete={
                        item === 'Posts' && isOwnProfile
                          ? () => setConfirm({ kind: 'delete', postId: post.id })
                          : undefined
                      }
                    />
                  ))
                ) : (
                  <div className="px-6 py-16 text-center">
                    <Users className="mx-auto text-primary" />
                    <h2 className="mt-4 font-semibold">{emptyStates[item].title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{emptyStates[item].hint}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          )
        })}
      </section>

      {editOpen && (
        <Dialog title="Edit profile" onClose={() => setEditOpen(false)}>
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className={draft.color}>{draft.initials}</AvatarFallback>
            </Avatar>
            <input ref={avatarInput} type="file" accept="image/*" className="hidden" />
            <Button variant="outline" onClick={() => avatarInput.current?.click()}>
              <Camera data-icon="inline-start" /> Change avatar
            </Button>
          </div>
          <label className="grid gap-1.5 text-sm font-medium">
            Display name
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Bio
            <Textarea
              value={draft.bio}
              maxLength={160}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              className="min-h-24"
            />
            <span className="text-xs font-normal text-muted-foreground">
              {draft.bio.length}/160
            </span>
          </label>
          {(!draft.name.trim() || draft.bio.length > 160) && (
            <p className="text-sm text-destructive">
              Enter a display name and keep your bio under 160 characters.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveProfile}>Save changes</Button>
          </DialogFooter>
        </Dialog>
      )}

      {peopleOpen && (
        <Dialog
          title={peopleOpen === 'followers' ? 'Followers' : 'Following'}
          onClose={() => {
            setPeopleOpen(null)
            setPeopleSearch('')
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              autoFocus
              value={peopleSearch}
              onChange={(e) => setPeopleSearch(e.target.value)}
              placeholder="Search people"
              className="pl-9"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {visiblePeople.length ? (
              visiblePeople.map((person) => (
                <button
                  key={person.id}
                  onClick={() => navigate('/profile')}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted"
                >
                  <Avatar>
                    <AvatarFallback className={person.color}>{person.initials}</AvatarFallback>
                  </Avatar>
                  <span>
                    <strong className="block text-sm">{person.name}</strong>
                    <span className="text-xs text-muted-foreground">{person.username}</span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">No users found.</p>
            )}
          </div>
        </Dialog>
      )}

      {confirm && (
        <Dialog
          title={confirmCopy[confirm.kind].title}
          description={confirmCopy[confirm.kind].text}
          onClose={closeConfirm}
        >
          {confirm.kind === 'report' && (
            <Textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Add details (optional)"
              className="min-h-24"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirm}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={executeConfirm}>
              {confirmCopy[confirm.kind].action}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </Tabs>
  )
}

export default ProfilePage
