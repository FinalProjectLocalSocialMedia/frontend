import { useMutation } from '@tanstack/react-query'
import type { ViewEventPayload } from '@/lib/view-tracking/types'
import { sendViewBatch } from './interaction-api'

export function useSendViewBatchMutation() {
  return useMutation({
    mutationFn: (events: ViewEventPayload[]) => sendViewBatch(events),
  })
}
