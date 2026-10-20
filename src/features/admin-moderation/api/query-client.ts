import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/lib/http-client'

/**
 * Cấu hình TanStack Query cho khu vực admin.
 * - Không retry lỗi 4xx (đã rõ nguyên nhân: 401/403/404/409/422), retry tối đa 2 lần với lỗi mạng/5xx.
 * - Không tự refetch khi focus cửa sổ; thông báo dùng `refetchInterval` riêng.
 */
export function createAdminQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status >= 400 && error.status < 500) return false
          return failureCount < 2
        },
      },
      mutations: { retry: false },
    },
  })
}
