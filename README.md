# nearby. — Frontend

Giao diện web của mạng xã hội **location-based**: xem bài viết quanh vị trí hiện tại, khám phá xu hướng/hotspot theo khu vực, nhắn tin và quản lý hồ sơ.

> **Trạng thái:** prototype vẫn dùng mock data cho nhiều khu vực; luồng bài viết có API tìm kiếm/tạo bài và upload media trực tiếp lên Cloudinary. Chưa có auth hoàn chỉnh, bản đồ là hình minh hoạ. Xem [docs/roadmap.md](docs/roadmap.md) để biết cái gì đã có và cái gì còn thiếu.

## Công nghệ

| Mục | Dùng |
|---|---|
| Build | Vite 6, TypeScript (strict) |
| UI | React 19, Tailwind CSS v4 (plugin `@tailwindcss/vite`, không có `tailwind.config`) |
| Component | shadcn/ui, style `base-nova` trên **Base UI** (`@base-ui/react`) — xem [docs/ui-guidelines.md](docs/ui-guidelines.md) |
| Routing | React Router (`react-router-dom`, `BrowserRouter`) |
| Icon / Toast | `lucide-react` / `sonner` |
| Test | Vitest + jsdom + Testing Library |
| Format | Prettier (`.prettierrc`), **chưa có ESLint** |

## Chạy dự án

```bash
npm install
npm run dev        # http://localhost:5173
```

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | `tsc -b` rồi `vite build` (build phải sạch lỗi type) |
| `npm test` | Chạy toàn bộ test (Vitest, 19 test) |
| `npm run format` | Prettier cho `src` (bỏ qua `src/components/ui`) |

Biến môi trường cần cho upload media:

- `VITE_API_BASE_URL` — base URL của backend; API ký upload tại `/api/v1/post/signature`.
- `VITE_CLOUDINARY_CLOUD_NAME` và `VITE_CLOUDINARY_API_KEY` — cấu hình upload có chữ ký trực tiếp lên Cloudinary.

Backend cấp `timestamp`, `folder` và `signature`; frontend không cần upload preset. URL media dùng `f_auto,q_auto` để tối ưu định dạng/chất lượng khi phân phối, không làm giảm dung lượng asset gốc được lưu trên Cloudinary.

## Các trang

| Route | Trang | File |
|---|---|---|
| `/` | Home feed | `src/pages/home.tsx` |
| `/explore` | Bản đồ, hotspot, trending, lọc theo bán kính | `src/pages/explore.tsx` |
| `/messages` | Chat (danh sách + khung chat + panel chi tiết) | `src/components/chat-page.tsx` |
| `/profile` | Hồ sơ cá nhân, tab Posts / Liked / Saved | `src/components/profile-page.tsx` |
| `/notifications` | Placeholder "Coming soon" | `src/pages/coming-soon.tsx` |
| `*` | 404 | `src/pages/not-found.tsx` |

Mọi trang đều nằm trong `AppLayout` (Sidebar trên desktop, header + bottom nav trên mobile).

## Cấu trúc thư mục

```
src/
├─ App.tsx                 # Providers + khai báo route (chỉ nên chứa routing)
├─ main.tsx                # BrowserRouter + StrictMode
├─ index.css               # Tailwind, design tokens (light/dark), --bottom-nav-h
├─ pages/                  # Trang nhỏ, render trong <Outlet/> của AppLayout
├─ components/
│  ├─ layout/              # AppLayout, Sidebar, BottomNav, MobileHeader, CreatePostDialog, ThemeToggle
│  ├─ chat/                # Các phần của trang chat (list, window, details, dialogs)
│  ├─ explore/             # MapView (bản đồ giả)
│  ├─ ui/                  # shadcn/ui — do CLI sinh, KHÔNG sửa tay
│  ├─ post-card.tsx        # Thẻ bài viết dùng chung (Home, Explore, Saved)
│  ├─ chat-page.tsx        # Container của trang chat
│  ├─ profile-page.tsx
│  └─ theme-provider.tsx
├─ hooks/                  # use-media-query (useIsDesktop)
├─ lib/
│  ├─ nav.ts               # Cấu hình menu điều hướng (nguồn duy nhất)
│  ├─ posts-context.tsx    # Store bài viết/like/save (in-memory)
│  ├─ mock-nearby.ts       # Mock: bài viết, hotspot, trending, bán kính
│  ├─ mock-chat.ts         # Mock + lưu localStorage cho chat
│  ├─ api.ts               # HTTP client mỏng (chưa dùng)
│  └─ utils.ts             # re-export `cn` từ package "cn"
├─ test-setup.ts           # Setup Vitest (matchMedia stub, setViewport)
└─ *.test.tsx              # Test hành vi
```

Alias import: `@/` → `src/`.

## Tài liệu

- [AGENTS.md](AGENTS.md) — quy tắc làm việc cho AI agent trong IDE (và là checklist ngắn cho người)
- [docs/architecture.md](docs/architecture.md) — kiến trúc, layout, state, responsive, theme, test
- [docs/ui-guidelines.md](docs/ui-guidelines.md) — cách dùng shadcn/ui, token màu, mẫu code
- [docs/roadmap.md](docs/roadmap.md) — lỗi/thiếu sót đã biết, việc tiếp theo, gợi ý tích hợp backend
