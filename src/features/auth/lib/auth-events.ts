/**
 * Bus sự kiện tối giản cho các sự kiện xác thực toàn cục.
 * `unauthorized` được phát khi http client gặp 401 hoặc refresh token thất bại;
 * AuthProvider lắng nghe để đăng xuất và xóa cache.
 */
type AuthEvent = 'unauthorized'
type Listener = () => void

const listeners: Record<AuthEvent, Set<Listener>> = { unauthorized: new Set() }

export const authEvents = {
  emit(event: AuthEvent) {
    for (const listener of [...listeners[event]]) {
      listener()
    }
  },
  on(event: AuthEvent, listener: Listener) {
    listeners[event].add(listener)
    return () => {
      listeners[event].delete(listener)
    }
  },
}
