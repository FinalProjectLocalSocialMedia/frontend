# Roadmap, lỗi đã biết & gợi ý tích hợp backend

Cập nhật lần cuối khi tài liệu này được tạo. Khi sửa xong một mục, hãy xoá hoặc đánh dấu ở đây.

## A. Lỗi / thiếu sót đã biết

### Dữ liệu & backend
- [ ] Toàn bộ dữ liệu là mock; `src/lib/api.ts` **chưa được import ở đâu**. Chưa có auth.
- [ ] Bài viết (`PostsProvider`) chỉ nằm trong bộ nhớ, mất khi reload. Chat thì lưu `localStorage` (chỉ để demo).
- [ ] Hai danh tính "tôi" khác nhau: chat `@minhanh` (`mock-chat.ts`) và bài viết/profile `@minhnguyen` (`posts-context.tsx`, `mock-nearby.ts`).
- [ ] `NearbyPost.time` là chuỗi ("8 min ago"), `likes`/`comments` là `string`, `location` chỉ là tên — thiếu lat/lng và timestamp ISO.
- [ ] Badge Notifications đang cứng `count: 3` trong `lib/nav.ts`.

### Explore / bản đồ (điểm yếu lớn nhất của một app location-based)
- [ ] `MapView` là hình minh hoạ CSS: marker đặt theo `x%, y%`, không có tile bản đồ, không có Geolocation API.
- [ ] Bán kính chỉ là `posts.slice(0, radiusPostLimit[radius])`, không lọc theo khoảng cách.
- [ ] Bộ lọc trending là hack: `selectedTrend.tag === '#TrafficJam'` hiện tất cả bài (`pages/explore.tsx`); chọn tag khác có thể ra danh sách trống mà không có empty state. Chọn hotspot chỉ đổi tiêu đề, không lọc/căn bản đồ.
- [ ] Zoom chỉ scale vòng tròn bán kính.

### Chức năng chưa nối
- [ ] Profile: nút "Change avatar" mở file picker nhưng chưa xử lý file; `isOwnProfile` luôn `true` vì chưa có route hồ sơ người khác (`/u/:handle`); bấm một người trong Followers/Following đưa về `/profile`; Block/Report chỉ hiện toast.
- [ ] Chat: nút đính kèm và emoji chưa làm gì; reaction mới chỉ hiển thị, chưa tương tác; ảnh/video chỉ là nhãn placeholder.
- [ ] Create Post: chỉ có text (tối đa 280), chưa chọn vị trí/ảnh; chưa có Comments.
- [ ] `/notifications` là trang "Coming soon".

### Hạ tầng & chất lượng
- [ ] Deploy SPA: `BrowserRouter` cần rewrite mọi đường dẫn về `index.html` (ví dụ `vercel.json` với `rewrites`), nếu không refresh ở `/explore` sẽ 404. Hiện chưa có file cấu hình (repo có `.vercel` trong `.gitignore`).
- [ ] Chưa có ESLint, CI, hay pre-commit hook.
- [ ] Bundle ~626 kB (Vite cảnh báo chunk lớn) → lazy-load theo route (`React.lazy` + `Suspense`).
- [ ] UI chuỗi lẫn Anh/Việt, chưa có i18n; `<html lang="vi">` nhưng đa số nhãn là tiếng Anh.
- [ ] Chưa audit accessibility (đã có `aria-label`, `aria-current`, `aria-pressed` ở các điểm chính).
- [ ] Dark mode chưa kiểm tra trực quan hết các trang (bản đồ cố ý giữ sáng).

## B. Thứ tự đề xuất

1. **Bản đồ thật** (Leaflet hoặc MapLibre) + `navigator.geolocation`; lọc bài theo khoảng cách thật.
2. **Mô hình dữ liệu có toạ độ** (xem mục C) và thay mock bằng service gọi `lib/api.ts`.
3. **Auth + danh tính thống nhất**, route `/u/:handle`, `/post/:id`.
4. **Data fetching** (TanStack Query hoặc tương đương) thay cho `PostsProvider` in-memory: cache, optimistic update cho like/save, phân trang cursor cho feed.
5. SPA rewrite khi deploy, ESLint + CI, lazy-load route.
6. Notifications, Comments, đính kèm ảnh/video trong chat.
7. i18n (vi/en) và audit a11y.

## C. Gợi ý hợp đồng dữ liệu với backend

> **Đây là đề xuất để chốt với backend, không phải API có sẵn.** Giả định hiện tại: backend dùng PostgreSQL + PostGIS (có thể kèm H3 để gom theo ô). Hãy sửa lại cho khớp hợp đồng thật.

```ts
type Post = {
  id: string
  author: { id: string; name: string; handle: string; avatarUrl?: string }
  text: string
  topics: string[]
  location: { name: string; lat: number; lng: number; h3Cell?: string }
  distanceM?: number            // server tính theo vị trí người xem
  createdAt: string             // ISO 8601; UI tự format "8 min ago"
  likeCount: number
  commentCount: number
  likedByMe: boolean
  savedByMe: boolean
}

// Gợi ý endpoint (tham khảo)
GET  /feed/local?lat=&lng=&radiusM=&cursor=      → { items: Post[], nextCursor?: string }
GET  /trending?lat=&lng=&radiusM=&window=        → { tags: { tag, count }[], hotspots: … }
POST /posts                                      → body { text, location }
POST /posts/:id/like   |  DELETE /posts/:id/like
POST /posts/:id/save   |  DELETE /posts/:id/save
```

Điểm nối trong code khi tích hợp: thay `nearbyPosts` trong `PostsProvider`; thay `radiusPostLimit`/`slice` trong `pages/explore.tsx`; thay `currentLocation` bằng vị trí từ Geolocation; thay `loadChatState` bằng service chat (REST/WebSocket).
