import { useState, type MouseEvent } from 'react'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useRespondFollowRequestMutation } from '../api/notification-queries'
import { NOTIFICATION_UI_TEXT } from '../api/notification-text'
import type { FollowStatus } from '../types/notification'

interface FollowRequestActionsProps {
  followId: string
  followStatus: FollowStatus | null
}

export function FollowRequestActions({ followId, followStatus }: FollowRequestActionsProps) {
  const [resolvedStatus, setResolvedStatus] = useState<'ACCEPTED' | 'REJECTED' | null>(null)
  const respondMutation = useRespondFollowRequestMutation()

  const effectiveStatus = resolvedStatus ?? followStatus

  if (effectiveStatus === 'ACCEPTED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
        <Check className="size-3.5" />
        {NOTIFICATION_UI_TEXT.accepted}
      </span>
    )
  }

  if (effectiveStatus === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <X className="size-3.5" />
        {NOTIFICATION_UI_TEXT.rejected}
      </span>
    )
  }

  if (effectiveStatus !== 'PENDING') {
    return null
  }

  const handleDecision = async (
    event: MouseEvent<HTMLButtonElement>,
    decision: 'ACCEPTED' | 'REJECTED',
  ) => {
    event.preventDefault()
    event.stopPropagation()

    try {
      await respondMutation.mutateAsync({ followId, decision })
      setResolvedStatus(decision)
      toast.success(
        decision === 'ACCEPTED'
          ? NOTIFICATION_UI_TEXT.acceptSuccess
          : NOTIFICATION_UI_TEXT.rejectSuccess,
      )
    } catch {
      toast.error(NOTIFICATION_UI_TEXT.followActionError)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        disabled={respondMutation.isPending}
        onClick={(e) => handleDecision(e, 'ACCEPTED')}
      >
        {NOTIFICATION_UI_TEXT.accept}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={respondMutation.isPending}
        onClick={(e) => handleDecision(e, 'REJECTED')}
      >
        {NOTIFICATION_UI_TEXT.reject}
      </Button>
    </div>
  )
}
