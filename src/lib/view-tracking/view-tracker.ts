import type {
  ObservedPostMeta,
  ViewEventPayload,
  ViewSender,
  ViewSession,
  ViewTrackerOptions,
} from './types'
import {
  DWELL_MS,
  FLUSH_INTERVAL_MS,
  MAX_BATCH_SIZE,
  MAX_DURATION_S,
  MAX_RETRY,
  VISIBILITY_RATIO_THRESHOLD,
  VISIBILITY_THRESHOLDS,
} from './view-tracking-config'

/**
 * Phần tử nằm trong hàng đợi chờ gửi lên Backend.
 * Lưu kèm số lần đã thử lại (`retries`) để xử lý cơ chế retry khi lỗi mạng/5xx.
 */
interface QueuedViewEvent {
  payload: ViewEventPayload
  retries: number
}

/**
 * Trích xuất mã lỗi HTTP (status code) từ đối tượng lỗi (ví dụ: AxiosError hoặc custom error).
 * Trả về `undefined` nếu là lỗi mất mạng hoặc không có response từ server.
 */
function getHttpStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null) {
    if ('status' in error && typeof (error as { status?: unknown }).status === 'number') {
      return (error as { status: number }).status
    }
    if ('response' in error) {
      const response = (error as { response?: unknown }).response
      if (
        typeof response === 'object' &&
        response !== null &&
        'status' in response &&
        typeof (response as { status?: unknown }).status === 'number'
      ) {
        return (response as { status: number }).status
      }
    }
  }
  return undefined
}

/**
 * Kiểm tra xem lỗi khi gửi batch có nên thử lại (retry) ở chu kỳ tiếp theo hay không:
 * - Lỗi mạng (không có HTTP status), lỗi Server (>= 500), 401 (chờ refresh token), 429 (rate limit) -> CHO PHÉP retry.
 * - Các lỗi 4xx khác (400 Bad Request, 404, 422...) -> KHÔNG retry, bỏ luôn batch để tránh kẹt hàng đợi.
 */
function isRetryableError(error: unknown): boolean {
  const status = getHttpStatus(error)
  if (status === undefined) {
    // Lỗi mạng / fetch thất bại
    return true
  }
  if (status >= 500 || status === 401 || status === 429) {
    return true
  }
  // Các lỗi 4xx khác -> bỏ batch
  return false
}

/**
 * Tính thời gian dừng (dwell time) của phiên xem bài viết theo đơn vị GIÂY (số nguyên):
 * - Làm tròn lên (`Math.ceil`) từ mili-giây sang giây.
 * - Giới hạn trong khoảng `[1, MAX_DURATION_S]` (luôn >= 1 giây và không vượt quá trần chống treo tab, mặc định 600s).
 */
function computeDurationSeconds(startedAt: number, endedAt: number): number {
  const elapsedSeconds = Math.ceil((endedAt - startedAt) / 1000)
  return Math.min(MAX_DURATION_S, Math.max(1, elapsedSeconds))
}

/**
 * Kiểm tra một phần tử bài viết có đang hiển thị đạt ngưỡng "nhìn thấy" (>= 50%) hay không:
 * 1. Bài viết bình thường: diện tích hiển thị >= 50% diện tích của chính bài đó (`intersectionRatio >= 0.5`).
 * 2. Bài viết rất dài (cao hơn cả màn hình): có thể không bao giờ đạt 50% diện tích bài, nên sẽ tính là
 *    nhìn thấy nếu phần hiển thị của bài chiếm >= 50% chiều cao khung nhìn (`rootBounds.height * 0.5`).
 */
function isEntryVisible(entry: IntersectionObserverEntry): boolean {
  if (entry.intersectionRatio >= VISIBILITY_RATIO_THRESHOLD) {
    return true
  }
  if (
    entry.rootBounds &&
    entry.rootBounds.height > 0 &&
    entry.intersectionRect.height >= entry.rootBounds.height * VISIBILITY_RATIO_THRESHOLD
  ) {
    return true
  }
  return false
}

/**
 * `ViewTracker`: Engine thuần TypeScript quản lý toàn bộ vòng đời thu thập hành vi xem bài viết (Post View Tracking).
 *
 * Nguyên lý hoạt động:
 * - Dùng chung 1 `IntersectionObserver` duy nhất để theo dõi mọi thẻ bài viết (`PostCard`) trên màn hình.
 * - Kết hợp cả Passive View (hiển thị >= 50% liên tục trong 2 giây) và Active View (bấm Like/Save/Share/Xem thêm/Chi tiết/Lightbox)
 *   vào chung một mô hình phiên xem (`ViewSession`) để đo thời gian đọc thực tế (`duration`).
 * - Chỉ khi bài viết rời khỏi vùng nhìn thấy (hoặc unmount / ẩn tab), phiên xem mới kết thúc và đẩy vào hàng đợi (`queue`).
 * - Gom nhóm (batching) gửi định kỳ mỗi 5 giây hoặc gửi khẩn cấp (`keepalive`) khi người dùng chuyển/đóng tab.
 */
export class ViewTracker {
  /** Hàm gửi batch định kỳ (thường qua Axios `apiClient`) */
  private readonly send: ViewSender
  /** Hàm gửi batch khi ẩn/đóng tab (qua `fetch` với cờ `keepalive: true`) */
  private readonly sendKeepalive: ViewSender
  /** Callback lấy ID người dùng hiện tại (nếu truyền từ ngoài vào) */
  private readonly getUserIdOption?: () => string | null
  /** ID người dùng hiện tại được cập nhật qua `setUserId` từ React Provider */
  private currentUserId: string | null = null
  /** Hàm lấy mốc thời gian hiện tại (ms), cho phép inject trong unit test để dùng fake timers */
  private readonly now: () => number

  /** Instance IntersectionObserver dùng chung cho tất cả bài viết */
  private observer: IntersectionObserver | null = null
  /** Ánh xạ từ phần tử DOM (`Element`) sang thông tin bài viết (`{ postId, authorId }`) */
  private readonly elementMeta = new Map<Element, ObservedPostMeta>()
  /** Lưu `authorId` theo `postId` để kiểm tra bài viết của chính mình khi gọi `trackActive(postId)` */
  private readonly postAuthors = new Map<string, string>()
  /** Tập hợp các phần tử DOM đang hiển thị (>= 50%) của từng `postId` */
  private readonly visibleElementsByPost = new Map<string, Set<Element>>()
  /** Tập các `postId` hiện đang nằm trong vùng nhìn thấy (>= 50% viewport) */
  private readonly visiblePosts = new Set<string>()
  /** Các phiên xem đang mở (đang đếm giờ chờ đủ 2s hoặc đã qualified và đang đo tổng dwell time) */
  private readonly sessions = new Map<string, ViewSession>()
  /** Session lock: Tập các `postId` ĐÃ được công nhận lượt xem trong phiên đăng nhập này (chống đếm trùng) */
  private readonly seen = new Set<string>()
  /** Hàng đợi chứa các sự kiện xem đã kết thúc phiên, chờ gửi lên server theo đợt (batch) */
  private queue: QueuedViewEvent[] = []
  /** ID của timer gửi batch định kỳ mỗi `FLUSH_INTERVAL_MS` (5 giây) */
  private flushTimerId: ReturnType<typeof setTimeout> | null = null
  /** Cờ đánh dấu tracker đã bị huỷ (`destroy`) */
  private destroyed = false

  /**
   * Listener bắt sự kiện khi người dùng chuyển tab hoặc thu nhỏ trình duyệt (`visibilitychange`).
   * - Khi tab bị ẩn (`hidden`): chốt các phiên đã hợp lệ và gửi ngay bằng `keepalive`.
   * - Khi quay lại tab (`visible`): khởi động lại phiên đo cho các bài đang hiển thị mà chưa được tính view.
   */
  private readonly handleVisibilityChange = (): void => {
    if (typeof document === 'undefined') return
    if (document.visibilityState === 'hidden') {
      this.handlePageHidden()
    } else if (document.visibilityState === 'visible') {
      this.handlePageVisible()
    }
  }

  /**
   * Listener bắt sự kiện đóng tab / tải lại trang / rời trang (`pagehide`).
   */
  private readonly handlePageHide = (): void => {
    this.handlePageHidden()
  }

  /**
   * Khởi tạo `ViewTracker` và đăng ký các sự kiện vòng đời trang (`visibilitychange`, `pagehide`).
   */
  constructor(options: ViewTrackerOptions) {
    this.send = options.send
    this.sendKeepalive = options.sendKeepalive
    this.getUserIdOption = options.getUserId
    this.now = options.now ?? (() => Date.now())
    this.attachLifecycleListeners()
  }

  private attachLifecycleListeners(): void {
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.removeEventListener('pagehide', this.handlePageHide)
      window.addEventListener('pagehide', this.handlePageHide)
    }
  }

  /**
   * Kích hoạt lại `ViewTracker` nếu bị `destroy()` trước đó bởi chu kỳ double-effect của React `<StrictMode>`.
   */
  activate(): void {
    if (!this.destroyed) return
    this.destroyed = false
    this.attachLifecycleListeners()
  }

  /**
   * Lấy `userId` hiện hành (ưu tiên hàm `getUserId` truyền qua options, nếu không có thì lấy `currentUserId`).
   */
  private resolveUserId(): string | null {
    if (this.getUserIdOption) {
      return this.getUserIdOption()
    }
    return this.currentUserId
  }

  /**
   * Cập nhật `userId` khi trạng thái đăng nhập thay đổi.
   * - Nếu người dùng đăng xuất hoặc đổi sang tài khoản khác, tự động gọi `reset()` để chốt và xoá dữ liệu phiên cũ.
   * - Nếu lúc đầu trang tải xong mà `useMeQuery` chưa kịp trả về (`currentUserId === null`), sau đó mới có `userId`,
   *   hàm này sẽ tự động kích hoạt phiên đo cho các bài viết đã nằm sẵn trên màn hình (`visiblePosts`).
   */
  setUserId(userId: string | null): void {
    const previousUserId = this.currentUserId
    if (previousUserId !== null && previousUserId !== userId) {
      this.reset()
    }
    this.currentUserId = userId

    if (userId !== null && previousUserId !== userId) {
      // Nếu có bài của chính mình từng được đăng ký lúc chưa biết userId thì dọn phiên (nếu có)
      for (const postId of this.visiblePosts) {
        const authorId = this.postAuthors.get(postId)
        if (this.isOwnPost(authorId)) {
          this.handlePostLeaveVisible(postId)
        } else if (!this.seen.has(postId) && !this.sessions.has(postId)) {
          this.handlePostEnterVisible(postId, authorId)
        }
      }
    }
  }

  /**
   * Khởi tạo lười (lazy-init) đối tượng `IntersectionObserver` dùng chung với các mốc ngưỡng `[0, 0.25, 0.5, 0.75, 1]`.
   */
  private ensureObserver(): IntersectionObserver | null {
    if (this.destroyed) return null
    if (this.observer) return this.observer
    if (typeof IntersectionObserver === 'undefined') return null

    this.observer = new IntersectionObserver(
      (entries) => {
        this.handleIntersections(entries)
      },
      { threshold: VISIBILITY_THRESHOLDS },
    )
    return this.observer
  }

  /**
   * Kiểm tra bài viết có phải do chính người dùng hiện tại đăng hay không (`authorId === currentUserId`).
   * Quy tắc nghiệp vụ: Không tính lượt xem cho bài viết của chính mình.
   */
  private isOwnPost(authorId: string | undefined): boolean {
    const currentUserId = this.resolveUserId()
    if (!currentUserId) return false
    return Boolean(authorId && authorId === currentUserId)
  }

  /**
   * Kiểm tra một bài viết có đủ điều kiện để theo dõi lượt xem không:
   * - Tracker chưa bị destroy.
   * - Người dùng đã đăng nhập với vai trò USER (`currentUserId !== null`).
   * - Không phải bài viết của chính người dùng đó.
   */
  private canTrackPost(postId: string, authorId?: string): boolean {
    if (this.destroyed) return false
    const currentUserId = this.resolveUserId()
    if (!currentUserId) return false
    const resolvedAuthor = authorId ?? this.postAuthors.get(postId)
    if (this.isOwnPost(resolvedAuthor)) return false
    return true
  }

  /**
   * Đăng ký theo dõi một phần tử DOM của bài viết (`PostCard`).
   * Trả về hàm cleanup `() => void` để React tự động gỡ theo dõi khi component unmount.
   */
  observe(el: Element, post: ObservedPostMeta): () => void {
    if (this.destroyed) {
      return () => {}
    }

    this.postAuthors.set(post.postId, post.authorId)

    // Nếu là bài của chính tác giả thì bỏ qua, không đưa vào IntersectionObserver
    if (this.isOwnPost(post.authorId)) {
      return () => {}
    }

    this.elementMeta.set(el, post)
    const observer = this.ensureObserver()
    observer?.observe(el)

    return () => {
      this.unobserveElement(el)
    }
  }

  /**
   * Gỡ theo dõi một phần tử DOM khi `PostCard` unmount (ví dụ: chuyển trang).
   * Nếu bài viết đó đang mở phiên xem, hành động này sẽ kích hoạt `handlePostLeaveVisible` để chốt thời gian xem.
   */
  private unobserveElement(el: Element): void {
    const meta = this.elementMeta.get(el)
    if (!meta) return

    this.elementMeta.delete(el)
    this.observer?.unobserve(el)

    const { postId } = meta
    const visibleEls = this.visibleElementsByPost.get(postId)
    if (visibleEls) {
      visibleEls.delete(el)
      if (visibleEls.size === 0) {
        this.visibleElementsByPost.delete(postId)
      }
    }

    const stillHasVisibleElement = (this.visibleElementsByPost.get(postId)?.size ?? 0) > 0
    if (!stillHasVisibleElement) {
      this.visiblePosts.delete(postId)
      this.handlePostLeaveVisible(postId)
    }
  }

  /**
   * Callback xử lý danh sách sự kiện giao cắt từ `IntersectionObserver` mỗi khi người dùng cuộn trang.
   * Phân loại bài viết nào vừa bước vào vùng nhìn thấy (>= 50%) và bài viết nào vừa rời khỏi vùng nhìn thấy (< 50%).
   */
  private handleIntersections(entries: IntersectionObserverEntry[]): void {
    if (this.destroyed) return

    for (const entry of entries) {
      const meta = this.elementMeta.get(entry.target)
      if (!meta) continue

      const { postId, authorId } = meta
      this.postAuthors.set(postId, authorId)

      const visible = isEntryVisible(entry)
      if (visible) {
        let set = this.visibleElementsByPost.get(postId)
        if (!set) {
          set = new Set<Element>()
          this.visibleElementsByPost.set(postId, set)
        }
        set.add(entry.target)

        if (!this.visiblePosts.has(postId)) {
          this.visiblePosts.add(postId)
          this.handlePostEnterVisible(postId, authorId)
        }
      } else {
        const set = this.visibleElementsByPost.get(postId)
        if (set) {
          set.delete(entry.target)
          if (set.size === 0) {
            this.visibleElementsByPost.delete(postId)
          }
        }
        const stillVisible = (this.visibleElementsByPost.get(postId)?.size ?? 0) > 0
        if (!stillVisible && this.visiblePosts.has(postId)) {
          this.visiblePosts.delete(postId)
          this.handlePostLeaveVisible(postId)
        }
      }
    }
  }

  /**
   * Xử lý khi bài viết bắt đầu hiển thị >= 50% trong viewport:
   * - Nếu bài đã từng được xem (`seen.has(postId)`) hoặc đang có phiên mở thì bỏ qua.
   * - Ngược lại, mở phiên xem mới (`qualified: false`, ghi lại `startedAt`) và đặt hẹn giờ `DWELL_MS` (2000ms).
   * - Khi giữ liên tục đủ 2000ms trong viewport, timer nổ -> đánh dấu `qualified = true` và khóa vào `seen`.
   */
  private handlePostEnterVisible(postId: string, authorId?: string): void {
    if (!this.canTrackPost(postId, authorId)) return
    if (this.seen.has(postId)) return
    if (this.sessions.has(postId)) return

    const startedAt = this.now()
    const dwellTimerId = setTimeout(() => {
      const session = this.sessions.get(postId)
      if (!session) return
      session.qualified = true
      session.dwellTimerId = null
      this.seen.add(postId)
    }, DWELL_MS)

    this.sessions.set(postId, {
      startedAt,
      qualified: false,
      dwellTimerId,
    })
  }

  /**
   * Xử lý khi bài viết rời khỏi ngưỡng 50% viewport (hoặc card bị unmount):
   * - Nếu chưa đủ 2 giây (`!session.qualified`): huỷ timer, xoá session -> coi như lướt nhanh (fast-scroll), không tính view.
   * - Nếu đã hợp lệ (`session.qualified`): kết thúc phiên xem, tính tổng thời gian dừng (`duration`) và đẩy vào hàng đợi gửi.
   */
  private handlePostLeaveVisible(postId: string): void {
    const session = this.sessions.get(postId)
    if (!session) return

    if (session.dwellTimerId !== null) {
      clearTimeout(session.dwellTimerId)
      session.dwellTimerId = null
    }

    this.sessions.delete(postId)

    if (session.qualified) {
      this.finalizeSession(postId, session.startedAt, this.now())
    }
  }

  /**
   * Ghi nhận hành động tương tác chủ động của người dùng (Active View: bấm Mở chi tiết, Bình luận,
   * "Xem thêm", mở Lightbox, vuốt Carousel, Thích, Lưu, Chia sẻ):
   * - Công nhận lượt xem NGAY LẬP TỨC mà không cần chờ đủ 2000ms.
   * - Trường hợp 1: Bài viết đang hiển thị >= 50% và đang trong phiên chờ -> huỷ timer 2s, chuyển trạng thái
   *   sang `qualified = true`, giữ nguyên mốc `startedAt` lúc bắt đầu hiển thị để tiếp tục đo thời gian đọc cho tới khi rời bài.
   * - Trường hợp 2: Bài viết đang hiển thị < 50% (chưa có phiên đo) -> khóa `seen` và đẩy ngay 1 sự kiện với `duration = 1` giây vào hàng đợi.
   */
  trackActive(postId: string, authorId?: string): void {
    if (authorId) {
      this.postAuthors.set(postId, authorId)
    }
    if (!this.canTrackPost(postId, authorId)) return
    if (this.seen.has(postId)) return

    const existingSession = this.sessions.get(postId)
    if (existingSession) {
      if (existingSession.dwellTimerId !== null) {
        clearTimeout(existingSession.dwellTimerId)
        existingSession.dwellTimerId = null
      }
      existingSession.qualified = true
      this.seen.add(postId)
      return
    }

    this.seen.add(postId)
    const currentNow = this.now()
    this.enqueue({
      postId,
      viewAt: new Date(currentNow).toISOString(),
      duration: 1,
    })
  }

  /**
   * Hoàn tất (chốt) một phiên xem đã hợp lệ:
   * Tính `duration` (giây) từ `startedAt` đến `endedAt`, định dạng `viewAt` thành chuỗi ISO8601 cố định và đưa vào hàng đợi.
   */
  private finalizeSession(postId: string, startedAt: number, endedAt: number): void {
    const duration = computeDurationSeconds(startedAt, endedAt)
    const viewAt = new Date(startedAt).toISOString()
    this.enqueue({
      postId,
      viewAt,
      duration,
    })
  }

  /**
   * Đưa một sự kiện lượt xem đã hoàn tất vào hàng đợi chờ gửi và kích hoạt bộ hẹn giờ gửi định kỳ.
   */
  private enqueue(payload: ViewEventPayload): void {
    this.queue.push({ payload, retries: 0 })
    this.scheduleFlushIfNeeded()
  }

  /**
   * Lên lịch gửi batch sau `FLUSH_INTERVAL_MS` (5000ms) nếu hàng đợi đang có phần tử và chưa có timer nào đang chạy.
   * Khi hàng đợi rỗng, không có timer nào chạy ngầm gây tốn tài nguyên.
   */
  private scheduleFlushIfNeeded(): void {
    if (this.destroyed) return
    if (this.queue.length === 0) return
    if (this.flushTimerId !== null) return

    this.flushTimerId = setTimeout(() => {
      this.flushTimerId = null
      void this.flush()
    }, FLUSH_INTERVAL_MS)
  }

  /**
   * Huỷ timer gửi batch định kỳ hiện tại (nếu có).
   */
  private clearFlushTimer(): void {
    if (this.flushTimerId !== null) {
      clearTimeout(this.flushTimerId)
      this.flushTimerId = null
    }
  }

  /**
   * Xử lý khi tab trình duyệt bị ẩn hoặc người dùng đóng trang:
   * - Mọi phiên chưa đủ điều kiện (`!qualified`) sẽ bị huỷ.
   * - Mọi phiên đã đủ điều kiện (`qualified`) được chốt thời gian ngay lập tức.
   * - Gọi `flush({ keepalive: true })` để trình duyệt gửi nốt batch ngay cả khi tab đang đóng.
   */
  private handlePageHidden(): void {
    if (this.destroyed) return
    const currentNow = this.now()

    for (const [postId, session] of this.sessions.entries()) {
      if (session.dwellTimerId !== null) {
        clearTimeout(session.dwellTimerId)
        session.dwellTimerId = null
      }
      if (session.qualified) {
        this.finalizeSession(postId, session.startedAt, currentNow)
      }
    }
    this.sessions.clear()

    void this.flush({ keepalive: true })
  }

  /**
   * Xử lý khi người dùng mở lại tab:
   * Do `IntersectionObserver` không tự bắn lại callback cho các bài viết vốn đã đứng yên trên màn hình,
   * hàm này sẽ chủ động mở lại phiên đếm thời gian mới (`startedAt = now`) cho các bài đang hiển thị mà chưa được xem (`!seen`).
   */
  private handlePageVisible(): void {
    if (this.destroyed) return
    for (const postId of this.visiblePosts) {
      if (!this.seen.has(postId) && !this.sessions.has(postId)) {
        this.handlePostEnterVisible(postId, this.postAuthors.get(postId))
      }
    }
  }

  /**
   * Gửi một đợt (batch) tối đa `MAX_BATCH_SIZE` (50) sự kiện từ hàng đợi lên Backend:
   * - Nếu `opts.keepalive === true`, dùng `sendKeepalive` (`fetch` keepalive). Ngược lại dùng `send` (`apiClient`).
   * - Nếu gửi thất bại do lỗi mạng hoặc lỗi server (5xx): trả các sự kiện còn lượt retry (`<= MAX_RETRY`)
   *   về lại ĐẦU hàng đợi với nguyên vẹn `viewAt` và `duration` ban đầu để đảm bảo tính Idempotent ở Backend.
   * - Nếu sau khi gửi mà trong hàng đợi vẫn còn sự kiện, tự động lên lịch đợt flush tiếp theo.
   */
  async flush(opts?: { keepalive?: boolean }): Promise<void> {
    this.clearFlushTimer()
    if (this.queue.length === 0) return

    const keepalive = Boolean(opts?.keepalive)
    const sender = keepalive ? this.sendKeepalive : this.send

    const batch = this.queue.splice(0, MAX_BATCH_SIZE)
    const payloads = batch.map((item) => item.payload)

    try {
      await sender(payloads)
    } catch (error) {
      if (isRetryableError(error)) {
        const retryableItems: QueuedViewEvent[] = []
        for (const item of batch) {
          const nextRetries = item.retries + 1
          if (nextRetries <= MAX_RETRY) {
            retryableItems.push({
              payload: item.payload,
              retries: nextRetries,
            })
          }
        }
        if (retryableItems.length > 0) {
          this.queue.unshift(...retryableItems)
        }
      }
    } finally {
      if (this.queue.length > 0 && !this.destroyed) {
        this.scheduleFlushIfNeeded()
      }
    }
  }

  /**
   * Đặt lại trạng thái của `ViewTracker` khi người dùng đăng xuất hoặc chuyển đổi tài khoản:
   * - Chốt toàn bộ các phiên đã hợp lệ và gửi nốt batch còn tồn đọng của tài khoản cũ.
   * - Xoá sạch `seen` (session lock), `queue` và các timers để tài khoản mới bắt đầu đếm lại từ đầu.
   */
  reset(): void {
    const currentNow = this.now()
    for (const [postId, session] of this.sessions.entries()) {
      if (session.dwellTimerId !== null) {
        clearTimeout(session.dwellTimerId)
        session.dwellTimerId = null
      }
      if (session.qualified) {
        this.finalizeSession(postId, session.startedAt, currentNow)
      }
    }
    this.sessions.clear()

    if (this.queue.length > 0) {
      const pendingBatch = this.queue.splice(0, MAX_BATCH_SIZE).map((item) => item.payload)
      try {
        void Promise.resolve(this.send(pendingBatch)).catch(() => {})
      } catch {
        // Bỏ qua lỗi khi flush lúc reset
      }
    }

    this.clearFlushTimer()
    this.queue = []
    this.seen.clear()
  }

  /**
   * Dọn dẹp hoàn toàn `ViewTracker` khi Provider unmount:
   * Huỷ toàn bộ timers, ngắt kết nối `IntersectionObserver` và gỡ các event listeners trên `document`/`window`.
   */
  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true

    for (const session of this.sessions.values()) {
      if (session.dwellTimerId !== null) {
        clearTimeout(session.dwellTimerId)
      }
    }
    this.sessions.clear()
    this.clearFlushTimer()
    this.queue = []
    this.seen.clear()
    this.visiblePosts.clear()
    this.visibleElementsByPost.clear()
    this.elementMeta.clear()
    this.postAuthors.clear()

    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }

    if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    }
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('pagehide', this.handlePageHide)
    }
  }
}
