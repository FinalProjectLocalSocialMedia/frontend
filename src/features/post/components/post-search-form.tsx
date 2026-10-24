import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function PostSearchForm() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentQuery = new URLSearchParams(location.search).get('q') ?? ''
  const [query, setQuery] = useState(currentQuery)

  useEffect(() => {
    setQuery(currentQuery)
  }, [currentQuery])

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        const value = query.trim()
        if (value) navigate(`/search?q=${encodeURIComponent(value)}`)
      }}
      className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
    >
      <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <Input
        type="search"
        aria-label="Search posts"
        placeholder="Search posts..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="h-7 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
      />
    </form>
  )
}
