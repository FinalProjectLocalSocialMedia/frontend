import { useState } from 'react'
import {
  Check,
  Clock,
  Edit3,
  Flag,
  MoreHorizontal,
  UserCheck,
  UserMinus,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react'
import { isAxiosError } from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
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
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getDisplayName } from '@/features/auth/types/auth'
import { SEED_AUTHORS } from '@/features/map/api/mock/seed'
import { useLikedPosts, useSavedPosts, useUserPosts } from '@/features/post/api/post-queries'
import { PostCard } from '@/features/post/components/post-card'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import {
  useBlockUserMutation,
  useFollowMutation,
  usePublicProfile,
  useUnblockUserMutation,
} from '../api/profile-queries'
import { EditProfileDialog } from '../components/edit-profile-dialog'
import { ReportUserDialog } from '../components/report-user-dialog'

export type ProfileData = {
  id: string
  name: string
  username: string
  bio: string
  avatarUrl?: string | null
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
  bio: 'Chia sẻ nhịp sống xung quanh Cầu Giấy. Cà phê, phố xá và năng lượng tích cực của khu dân cư.',
  initials: 'NM',
  color: 'bg-amber-100 text-amber-700',
  location: '',
  followers: 0,
  following: 0,
}

const emptyStates: Record<string, { title: string; hint: string }> = {
  Posts: { title: 'Chưa có bài viết nào', hint: 'Bài viết được chia sẻ sẽ xuất hiện tại đây.' },
  Liked: {
    title: 'Chưa có bài viết đã thích',
    hint: 'Nhấn vào biểu tượng trái tim trên bài viết để thích.',
  },
  Saved: { title: 'Chưa có bài viết đã lưu', hint: 'Dùng menu tùy chọn trên bài viết để lưu lại.' },
}

function getInitials(name: string): string {
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

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}

interface ProfilePageProps {
  profile?: ProfileData
  isOwnProfile?: boolean
}

export function ProfilePage({ profile = ownerProfile, isOwnProfile = true }: ProfilePageProps) {
  const { userId } = useParams()
  const { user } = useAuth()
  const routeKey = `${userId ?? 'self'}:${user?.id ?? 'anon'}:${isOwnProfile}`
  return <ProfilePageContent key={routeKey} profile={profile} isOwnProfile={isOwnProfile} />
}

function ProfilePageContent({ profile = ownerProfile, isOwnProfile = true }: ProfilePageProps) {
  const navigate = useNavigate()
  const { userId } = useParams()
  const { user: authUser } = useAuth()

  const isActualOwn = isOwnProfile && (!userId || userId === authUser?.id || userId === 'me')
  const targetUserId = isActualOwn ? authUser?.id : userId

  const seedAuthor = !isActualOwn && userId ? SEED_AUTHORS.find((a) => a.id === userId) : undefined

  const [tab, setTab] = useState('Posts')
  const [editOpen, setEditOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [unfollowConfirmOpen, setUnfollowConfirmOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [pendingFollowOverride, setPendingFollowOverride] = useState<boolean | null>(null)

  const activeTab = isActualOwn ? tab : 'Posts'

  const publicProfileQuery = usePublicProfile(targetUserId)
  const postsQuery = useUserPosts(targetUserId, Boolean(targetUserId))
  const likedQuery = useLikedPosts(isActualOwn && activeTab === 'Liked')
  const savedQuery = useSavedPosts(isActualOwn && activeTab === 'Saved')

  const followMutation = useFollowMutation(targetUserId, authUser?.id)
  const blockMutation = useBlockUserMutation(targetUserId)
  const unblockMutation = useUnblockUserMutation(targetUserId)

  const publicProfile = publicProfileQuery.data
  const authDisplayName = authUser ? getDisplayName(authUser) : ''
  const authAvatarUrl = authUser && 'avatarUrl' in authUser ? authUser.avatarUrl : undefined
  const authBio = authUser && 'bio' in authUser ? authUser.bio : undefined

  const displayName = isActualOwn
    ? publicProfile?.fullName || authDisplayName || profile.name
    : publicProfile?.fullName || seedAuthor?.displayName || (userId ? 'Người dùng' : profile.name)

  const displayUsername = isActualOwn
    ? authUser?.email
      ? `@${authUser.email.split('@')[0]}`
      : profile.username
    : ''

  const displayAvatarUrl = isActualOwn
    ? publicProfile?.avatarUrl || authAvatarUrl || profile.avatarUrl
    : publicProfile?.avatarUrl || seedAuthor?.avatarUrl || undefined

  const displayBio = isActualOwn
    ? publicProfile?.bio ?? authBio ?? (authUser ? 'Chưa có tiểu sử giới thiệu.' : profile.bio)
    : publicProfile?.bio ?? (seedAuthor ? 'Thành viên cộng đồng Nearby.' : '')

  const displayLocation = isActualOwn ? profile.location : ''
  const followersCount = publicProfile?.followerCount ?? (isActualOwn && !authUser ? profile.followers : 0)
  const followingCount = publicProfile?.followingCount ?? (isActualOwn && !authUser ? profile.following : 0)

  const postsItemsCount = postsQuery.data?.pages.flatMap((page) => page.items).length ?? 0
  const postsCount = Math.max(postsItemsCount, publicProfile?.postCount ?? 0)

  const isFollowingAccepted = Boolean(publicProfile?.isFollowing)
  const isBlocking = Boolean(publicProfile?.isBlocking)
  const isBlocked = Boolean(publicProfile?.isBlocked)
  const isFollowPending = pendingFollowOverride ?? false
  const hasFollowRelation = isFollowingAccepted || isFollowPending

  const initials = getInitials(displayName)
  const fallbackColor = isActualOwn ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'

  const tabs = isActualOwn ? ['Posts', 'Liked', 'Saved'] : ['Posts']

  async function handleFollowToggle() {
    if (!targetUserId || followMutation.isPending) return
    try {
      const result = await followMutation.mutateAsync(hasFollowRelation)
      if (result.action === 'unfollowed') {
        setPendingFollowOverride(false)
        toast.success(isFollowingAccepted ? 'Đã bỏ theo dõi' : 'Đã hủy yêu cầu theo dõi')
      } else if (result.follow.status === 'PENDING') {
        setPendingFollowOverride(true)
        toast.success('Đã gửi yêu cầu theo dõi')
      } else {
        setPendingFollowOverride(null)
        toast.success('Đã theo dõi người dùng')
      }
    } catch (error) {
      toast.error('Không thể thực hiện thao tác', {
        description: getApiErrorMessage(error, 'Vui lòng thử lại sau.'),
      })
    }
  }

  async function handleBlockConfirm() {
    if (!targetUserId || blockMutation.isPending) return
    try {
      await blockMutation.mutateAsync()
      setBlockOpen(false)
      toast.success('Đã chặn người dùng')
    } catch (error) {
      toast.error('Không thể chặn người dùng', {
        description: getApiErrorMessage(error, 'Vui lòng thử lại sau.'),
      })
    }
  }

  async function handleUnblock() {
    if (!targetUserId || unblockMutation.isPending) return
    try {
      await unblockMutation.mutateAsync()
      toast.success('Đã bỏ chặn người dùng')
    } catch (error) {
      toast.error('Không thể bỏ chặn người dùng', {
        description: getApiErrorMessage(error, 'Vui lòng thử lại sau.'),
      })
    }
  }

  async function handleUnfollowConfirm() {
    if (!targetUserId || followMutation.isPending) return
    try {
      await followMutation.mutateAsync(true)
      setPendingFollowOverride(false)
      setUnfollowConfirmOpen(false)
      toast.success('Đã bỏ theo dõi')
    } catch (error) {
      toast.error('Không thể bỏ theo dõi', {
        description: getApiErrorMessage(error, 'Vui lòng thử lại sau.'),
      })
    }
  }

  const showOtherProfileLoading = !isActualOwn && Boolean(targetUserId) && publicProfileQuery.isPending && !seedAuthor
  const showOtherProfileError = !isActualOwn && Boolean(targetUserId) && publicProfileQuery.isError && !seedAuthor

  if (showOtherProfileLoading) {
    return (
      <div role="status" className="mx-auto flex max-w-3xl justify-center px-5 py-16">
        <Spinner />
        <span className="sr-only">Đang tải hồ sơ người dùng</span>
      </div>
    )
  }

  if (showOtherProfileError) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <div role="alert" className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-destructive">
            {getApiErrorMessage(publicProfileQuery.error, 'Không thể tải thông tin hồ sơ người dùng.')}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => void publicProfileQuery.refetch()}
          >
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setTab(String(value))}
      className="flex w-full flex-col gap-0"
    >
      <section className="w-full border-b border-border bg-card px-5 py-8 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Hồ sơ cá nhân Nearby
          </p>

          <div className="mt-5 flex gap-4">
            <Avatar className="size-20 shrink-0">
              {displayAvatarUrl ? <AvatarImage src={displayAvatarUrl} alt={displayName} /> : null}
              <AvatarFallback className={cn('text-lg', fallbackColor)}>{initials}</AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{displayName}</h1>
                {displayUsername ? (
                  <span className="text-sm text-muted-foreground">{displayUsername}</span>
                ) : null}
              </div>

              {displayBio ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{displayBio}</p>
              ) : null}

              {isActualOwn && displayLocation ? (
                <p className="mt-2 text-xs font-medium text-primary">{displayLocation}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-5 text-sm">
                <span>
                  <strong>{followersCount}</strong> người theo dõi
                </span>
                <span>
                  <strong>{followingCount}</strong> đang theo dõi
                </span>
                <span>
                  <strong>{postsCount}</strong> bài viết
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {isActualOwn ? (
              <Button onClick={() => setEditOpen(true)}>
                <Edit3 data-icon="inline-start" /> Chỉnh sửa hồ sơ
              </Button>
            ) : (
              <>
                {isBlocking ? (
                  <Button
                    variant="outline"
                    disabled={unblockMutation.isPending}
                    onClick={() => void handleUnblock()}
                  >
                    <UserCheck data-icon="inline-start" />
                    {unblockMutation.isPending ? 'Đang bỏ chặn...' : 'Bỏ chặn'}
                  </Button>
                ) : (
                  <>
                    {isBlocked ? (
                      <Button
                        variant="secondary"
                        disabled
                        className="bg-muted text-muted-foreground hover:bg-muted"
                      >
                        <UserPlus data-icon="inline-start" /> Theo dõi
                      </Button>
                    ) : isFollowingAccepted ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="outline" disabled={followMutation.isPending} />
                          }
                        >
                          <Check data-icon="inline-start" /> Đang theo dõi
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-44">
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setUnfollowConfirmOpen(true)}
                          >
                            <UserMinus /> Bỏ theo dõi
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button
                        variant={isFollowPending ? 'outline' : 'default'}
                        disabled={followMutation.isPending}
                        onClick={() => void handleFollowToggle()}
                      >
                        {isFollowPending ? (
                          <Clock data-icon="inline-start" />
                        ) : (
                          <UserPlus data-icon="inline-start" />
                        )}{' '}
                        {isFollowPending ? 'Đã gửi yêu cầu' : 'Theo dõi'}
                      </Button>
                    )}

                    {!isBlocked && (
                      <Button variant="outline" onClick={() => navigate('/messages')}>
                        Nhắn tin
                      </Button>
                    )}
                  </>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="outline" size="icon" aria-label="Tùy chọn khác" />}
                  >
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {!isBlocking && (
                      <DropdownMenuItem onClick={() => setBlockOpen(true)}>
                        <UserRound /> Chặn người dùng
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setReportOpen(true)}
                    >
                      <Flag /> Báo cáo người dùng
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          <TabsList variant="line" className="mt-6 w-full border-t border-border pt-3">
            {tabs.map((item) => (
              <TabsTrigger key={item} value={item}>
                {item === 'Posts' ? 'Bài viết' : item === 'Liked' ? 'Đã thích' : 'Đã lưu'}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-10">
        {tabs.map((item) => {
          const query = item === 'Liked' ? likedQuery : item === 'Saved' ? savedQuery : postsQuery
          const list = query.data?.pages.flatMap((page) => page.items) ?? []
          return (
            <TabsContent key={item} value={item}>
              <div className="space-y-4">
                {query.isPending ? (
                  <div
                    role="status"
                    className="flex justify-center rounded-2xl border border-border bg-card px-6 py-16"
                  >
                    <Spinner />
                    <span className="sr-only">Đang tải bài viết</span>
                  </div>
                ) : query.isError && !query.data ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-border bg-card px-6 py-16 text-center"
                  >
                    <p className="text-sm text-destructive">{query.error.message}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => void query.refetch()}
                    >
                      Thử lại
                    </Button>
                  </div>
                ) : list.length ? (
                  list.map((post) => <PostCard key={post.id} post={post} />)
                ) : (
                  <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
                    <Users className="mx-auto text-primary" />
                    <h2 className="mt-4 font-semibold">{emptyStates[item].title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{emptyStates[item].hint}</p>
                  </div>
                )}

                {query.isFetchNextPageError && (
                  <p
                    role="alert"
                    className="rounded-2xl border border-destructive/30 bg-card px-6 py-3 text-center text-sm text-destructive"
                  >
                    Không thể tải thêm bài viết. Vui lòng thử lại.
                  </p>
                )}

                {query.hasNextPage && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void query.fetchNextPage()}
                      disabled={query.isFetchingNextPage}
                    >
                      {query.isFetchingNextPage ? (
                        <>
                          <Spinner /> Đang tải thêm...
                        </>
                      ) : query.isFetchNextPageError ? (
                        'Thử tải lại'
                      ) : (
                        'Xem thêm'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          )
        })}
      </section>

      {isActualOwn && editOpen && (
        <EditProfileDialog
          initialName={displayName}
          initialBio={publicProfile?.bio ?? authBio ?? ''}
          initialAvatarUrl={displayAvatarUrl}
          initials={initials}
          avatarFallbackClassName={fallbackColor}
          onClose={() => setEditOpen(false)}
        />
      )}

      {!isActualOwn && blockOpen && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !blockMutation.isPending) setBlockOpen(false)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chặn người dùng này?</DialogTitle>
              <DialogDescription>
                Người dùng này sẽ không thể xem hoặc tương tác với bạn.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBlockOpen(false)}
                disabled={blockMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={() => void handleBlockConfirm()}
                disabled={blockMutation.isPending}
              >
                {blockMutation.isPending ? 'Đang chặn...' : 'Chặn'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!isActualOwn && unfollowConfirmOpen && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !followMutation.isPending) setUnfollowConfirmOpen(false)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bỏ theo dõi người dùng này?</DialogTitle>
              <DialogDescription>
                Bạn sẽ không còn nhận được cập nhật từ {displayName} nữa.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUnfollowConfirmOpen(false)}
                disabled={followMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={() => void handleUnfollowConfirm()}
                disabled={followMutation.isPending}
              >
                {followMutation.isPending ? 'Đang xử lý...' : 'Bỏ theo dõi'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!isActualOwn && reportOpen && targetUserId && (
        <ReportUserDialog targetUserId={targetUserId} onClose={() => setReportOpen(false)} />
      )}
    </Tabs>
  )
}

export default ProfilePage
