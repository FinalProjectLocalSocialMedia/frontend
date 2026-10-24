import { Avatar as UiAvatar, AvatarFallback, AvatarImage, AvatarBadge } from '@/components/ui/avatar'
import { userById } from '@/lib/mock-chat'

const COLOR_PALETTES = [
  'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
]

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getColorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length
  return COLOR_PALETTES[index]
}

export function Avatar({
  id,
  name,
  avatarUrl,
  small = false,
  online,
}: {
  id?: string
  name?: string
  avatarUrl?: string
  small?: boolean
  online?: boolean
}) {
  const mock = id ? userById(id) : null
  const displayName = name || mock?.name || 'User'
  const initials = getInitials(displayName)
  const color = mock?.color || getColorForName(displayName)
  const isOnline = online ?? mock?.online

  return (
    <UiAvatar size={small ? 'sm' : 'default'} aria-label={displayName} className="relative">
      {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
      <AvatarFallback className={color}>{initials}</AvatarFallback>
      {isOnline && (
        <AvatarBadge className="bg-emerald-500 ring-2 ring-background" />
      )}
    </UiAvatar>
  )
}

export function GroupAvatars({
  ids,
  names,
}: {
  ids?: string[]
  names?: string[]
}) {
  const items = names || ids || []
  return (
    <span className="flex -space-x-3">
      {items.slice(0, 3).map((item, idx) => (
        <span key={item + idx} className="rounded-full ring-2 ring-card">
          {names ? (
            <Avatar name={item} small />
          ) : (
            <Avatar id={item} small />
          )}
        </span>
      ))}
    </span>
  )
}
