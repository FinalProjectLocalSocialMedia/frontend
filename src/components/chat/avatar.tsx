import { Avatar as UiAvatar, AvatarFallback } from '@/components/ui/avatar'
import { userById } from '@/lib/mock-chat'

export function Avatar({ id, small = false }: { id: string; small?: boolean }) {
  const user = userById(id)
  return (
    <UiAvatar size={small ? 'sm' : 'default'} aria-label={user?.name}>
      <AvatarFallback className={user?.color}>{user?.initials ?? '?'}</AvatarFallback>
    </UiAvatar>
  )
}

export function GroupAvatars({ ids }: { ids: string[] }) {
  return (
    <span className="flex -space-x-3">
      {ids.slice(0, 3).map((id) => (
        <span key={id} className="rounded-full ring-2 ring-card">
          <Avatar id={id} small />
        </span>
      ))}
    </span>
  )
}
