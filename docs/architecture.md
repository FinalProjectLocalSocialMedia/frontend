# Kiến trúc frontend

## 1. Tổng quan luồng render

```
main.tsx
 └─ <StrictMode><BrowserRouter>
     └─ App.tsx
         └─ <ThemeProvider>          (theme-provider.tsx — class "dark" trên <html>)
             └─ <PostsProvider>      (lib/posts-context.tsx — store bài viết)
                 ├─ <Routes>
                 │   └─ <Route element={<AppLayout/>}>  → các trang con qua <Outlet/>
                 └─ <Toaster/>       (sonner)
```

`AppLayout` (`components/layout/app-layout.tsx`) là khung chung cho **mọi** trang:

- Desktop (`lg` ≥ 1024px): `Sidebar` (rail bên trái) + nội dung.
- Mobile: `MobileHeader` (logo + chuông + đổi theme) + nội dung + `BottomNav`.
- Sở hữu `CreatePostDialog` (dialog "Create Post" dùng chung). Trang nào cũng mở được qua hook `useCreatePost()` hoặc nút trong Sidebar/BottomNav.
- Tự cuộn lên đầu khi đổi route; ẩn `MobileHeader` ở `/messages` (chat có header riêng).
- Chỉ có **một** `<main>` trong toàn app (nằm trong `AppLayout`).

## 2. Routing & điều hướng

- Route khai báo trong `src/App.tsx`.
- Menu (Sidebar + BottomNav) lấy từ **một** nguồn: `src/lib/nav.ts` (`navItems`, `bottomNavLeft`, `bottomNavRight`). Thêm trang vào menu = sửa file này.
- Dùng `NavLink` nên link hiện tại có `aria-current="page"` (test dựa vào đó).
- Chưa có route chi tiết (`/post/:id`, `/u/:handle`).
- `BrowserRouter` cần **SPA fallback** khi deploy (xem roadmap).

## 3. State

| State | Ở đâu | Lưu trữ | Ghi chú |
|---|---|---|---|
| Bài viết, bài đã lưu, bài đã thích | `PostsProvider` (`lib/posts-context.tsx`) | **In-memory** (mất khi reload) | API: `posts`, `savedIds`, `likedIds`, `addPost`, `removePost`, `toggleSaved`, `toggleLiked`. `currentUserHandle = '@minhnguyen'` |
| Hội thoại + tin nhắn | `ChatPage` (`useState(loadChatState)`) | `localStorage` key `nearby-chat-demo-v1` | Đọc bằng lazy initializer, ghi bằng `useEffect`. Nút "Reset demo data" xoá key |
| Theme | `ThemeProvider` | `localStorage` key `nearby-theme` (`light\|dark\|system`) | Script nội tuyến trong `index.html` áp class `dark` trước khi vẽ để tránh nháy |
| Bộ lọc Explore (bán kính, heatmap, zoom, mục đang chọn) | `useState` cục bộ trong `pages/explore.tsx` | Không lưu | |
| Tab/dialog của Profile | `useState` cục bộ trong `profile-page.tsx` | Không lưu | Hồ sơ chỉnh sửa chỉ sống trong component |

Quy ước: state dùng ở nhiều trang → context trong `lib/`; state của một màn hình → `useState` tại màn hình đó. Chưa dùng thư viện state/data-fetching; khi nối backend nên cân nhắc TanStack Query (xem roadmap).

## 4. Mô hình dữ liệu (mock)

`lib/mock-nearby.ts`
```ts
type NearbyPost = {
  id: string; name: string; handle: string; initials: string; color: string
  time: string        // chuỗi hiển thị ("8 min ago"), CHƯA phải ISO timestamp
  location: string    // tên địa điểm dạng chuỗi, CHƯA có lat/lng
  text: string; topic: string
  likes: string; comments: string   // đang là string
}
```
Ngoài ra: `currentLocation` (Cầu Giấy, có `latitude`/`longitude`), `hotspots`, `trending`, `activitySpots`, `radiusOptions`, `radiusScale`, `radiusPostLimit`.

`lib/mock-chat.ts`: `ChatUser`, `ChatMessage` (`kind: text|image|video|audio`, `replyTo`, `reactions`), `Conversation` (`kind: direct|group`, `muted`, `blocked`, `unread`), cùng `ChatState`, `loadChatState/saveChatState/resetChatState`.

> Lưu ý: người dùng "tôi" trong chat là `id: 'me'` (`@minhanh`), còn ở bài viết/profile là `@minhnguyen`. Hai danh tính chưa thống nhất.

## 5. Sidebar

`components/layout/sidebar.tsx` — chỉ hiện từ `lg` trở lên.

```
<div class="sticky top-0 h-dvh w-[72px] ...">      ← giữ chỗ cố định trong flow (nội dung KHÔNG bị đẩy)
  <aside class="absolute inset-y-0 left-0 w-[72px]
                 hover:w-64 has-[:focus-visible]:w-64 has-[[aria-expanded=true]]:w-64 ...">
    ← mở rộng thành 256px và PHỦ LÊN nội dung (kiểu Instagram)
```

- Nhãn chữ ẩn bằng `opacity-0` và hiện khi `group-hover/sidebar`, focus bàn phím, hoặc khi có menu con đang mở (`aria-expanded=true`, ví dụ menu chọn theme).
- Badge số của Notifications thu gọn thành chấm đỏ khi rail đang đóng.

## 6. Responsive & chiều cao

- Breakpoint điều khiển layout: `lg` = 1024px. Trong JS dùng `useIsDesktop()` (`hooks/use-media-query.ts`) — chỉ khi **bắt buộc** (ví dụ chọn `Sheet` vs panel). Ưu tiên class Tailwind.
- Biến CSS `--bottom-nav-h` (`index.css`): `4rem + safe-area` trên mobile, `0px` từ `lg`. `AppLayout` thêm `pb-[var(--bottom-nav-h)]`; trang full-height dùng `h-[calc(100dvh-var(--bottom-nav-h))]`.
- `index.html` có `viewport-fit=cover` để `env(safe-area-inset-*)` hoạt động trên iOS.

## 7. Trang Chat

Container `chat-page.tsx` giữ state; các phần trong `components/chat/`.

- **Desktop:** `ConversationList` (330px) **luôn hiện** bên trái, `ChatWindow` bên phải, `DetailsPanel` là cột 280px bên phải cùng.
- **Mobile:** một khung mỗi lần, quyết định bằng `mobileChatOpen` + class `hidden`/`flex` (cả hai khung luôn được mount). Nút mũi tên trong `ChatWindow` quay về danh sách.
- `DetailsPanel` render là **cột** trên desktop và **`Sheet`** trên mobile (`asSheet={!isDesktop}`). Khi mở dialog Report từ Sheet, Sheet được đóng trước.
- `ChatWindow` được `key={active.id}` để reset ô nhập/tìm kiếm/reply khi đổi hội thoại.
- Danh sách sắp xếp theo tin mới nhất; hội thoại mới tạo (chưa có tin) nằm đầu.
- Phím Enter gửi tin, có chặn khi đang gõ IME tiếng Việt (`isComposing`).

## 8. Theme & token màu

- Token (`--background`, `--card`, `--primary`, `--muted`, …) khai báo trong `src/index.css`: khối `:root, .force-light` (sáng) và `.dark` (tối), ánh xạ sang Tailwind bằng `@theme inline`.
- Dark mode bật bằng class `dark` trên `<html>`; variant `dark:` định nghĩa bằng `@custom-variant dark (&:is(.dark *))`.
- `.force-light` ép một vùng dùng token sáng kể cả khi app đang tối (dùng cho `MapView`).
- Đổi giao diện toàn app = sửa token, không sửa từng component.

## 9. Test

- Công cụ: Vitest + jsdom + Testing Library (+ `user-event`). Cấu hình trong `vite.config.ts` (`test`), setup ở `src/test-setup.ts` (stub `matchMedia`, `scrollTo`, `scrollIntoView`, dọn `localStorage`; export `setViewport(desktop)`).
- `src/layout.test.tsx` — layout, điều hướng, Create Post, chat cơ bản.
- `src/shadcn-ui.test.tsx` — Select, Toggle, DropdownMenu, Tabs, Sheet, toast, theme, xoá đúng bài.
- Render qua `<MemoryRouter><App/></MemoryRouter>` trong `StrictMode`.
- **Giới hạn:** jsdom không tính CSS/layout, nên hover, kích thước và responsive thực tế phải kiểm bằng mắt trên trình duyệt.
