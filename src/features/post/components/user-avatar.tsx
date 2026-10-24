import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NormalUser } from '../types/normal-user'

interface UserAvatarProps {
  user: Pick<NormalUser, 'id' | 'fullName'> & {
    avatarUrl?: string | null
  }
}

export function UserAvatar({ user }: UserAvatarProps) {
  const { avatarUrl, fullName } = user
  return (
    <Avatar>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
      <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
    </Avatar>
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
