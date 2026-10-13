import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function ComingSoonPage({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-6" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">This section is coming soon.</p>
      <Button render={<Link to="/" />} nativeButton={false} className="mt-6">
        Back to home
      </Button>
    </div>
  )
}
