import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CopyIdProps = {
  id: string
  truncate?: boolean
  prefixChars?: number
  suffixChars?: number
  className?: string
  label?: string
}

/**
 * Nút sao chép mã định danh (UUID) có thể rút gọn hiển thị, sao chép vào clipboard và hiện toast.
 */
export function CopyId({
  id,
  truncate = true,
  prefixChars = 8,
  suffixChars = 4,
  className,
  label = 'Sao chép ID',
}: CopyIdProps) {
  const [copied, setCopied] = useState(false)

  const displayText =
    truncate && id.length > prefixChars + suffixChars + 3
      ? `${id.slice(0, prefixChars)}...${id.slice(-suffixChars)}`
      : id

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(id)
      } else {
        // Fallback cho môi trường không có clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = id
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopied(true)
      toast.success('Đã sao chép vào bộ nhớ tạm')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Không thể sao chép ID')
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      title={id}
      aria-label={label}
      className={cn(
        'group h-6 gap-1 px-1.5 font-mono text-xs text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      <span>{displayText}</span>
      {copied ? (
        <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="size-3 opacity-60 transition-opacity group-hover:opacity-100" />
      )}
    </Button>
  )
}
