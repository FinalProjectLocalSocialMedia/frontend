/**
 * Bus sự kiện tối giản cho các sự kiện xác thực toàn cục.
 * `unauthorized` được phát khi http client gặp 401 (hoặc mock mô phỏng 401);
 * AuthProvider lắng nghe để đăng xuất và hiện toast.
 */
type AuthEvent = 'unauthorized'
type Listener = () => void

const listeners: Record<AuthEvent, Set<Listener>> = { unauthorized: new Set() }

export const authEvents = {
  emit(event: AuthEvent) {
    // Sao chép trước khi duyệt để listener có thể tự huỷ đăng ký an toàn.
    for (const listener of [...listeners[event]]) listener()
  },
  on(event: AuthEvent, listener: Listener) {
    listeners[event].add(listener)
    return () => {
      listeners[event].delete(listener)
    }
  },
}
