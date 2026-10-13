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
import { Textarea } from '@/components/ui/textarea'
import { reportReasons } from '@/lib/mock-chat'

export function ReportDialog({ onClose }: { onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check />
            </div>
            <DialogTitle>Report submitted</DialogTitle>
            <DialogDescription>Thanks for helping keep nearby. safe.</DialogDescription>
            <Button onClick={onClose} className="mt-2">
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Report conversation</DialogTitle>
              <DialogDescription>Choose a reason.</DialogDescription>
            </DialogHeader>
            <fieldset className="flex flex-col gap-1">
              <legend className="sr-only">Reason</legend>
              {reportReasons.map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted"
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={item}
                    checked={reason === item}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  {item}
                </label>
              ))}
            </fieldset>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
            />
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={!reason} onClick={() => setSent(true)}>
                Submit report
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
