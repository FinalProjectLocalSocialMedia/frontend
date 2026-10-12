export type ApiClientOptions = { baseUrl?: string; fetcher?: typeof fetch }

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? ''
  const fetcher = options.fetcher ?? fetch
  return {
    async request<T>(path: string, init?: RequestInit): Promise<T> {
      const response = await fetcher(`${baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
      if (!response.ok) throw new Error(`API request failed: ${response.status}`)
      return response.json() as Promise<T>
    },
  }
}

export const api = createApiClient()
