# nearby. — Frontend

Giao diện web của mạng xã hội **location-based**: xem bài viết quanh vị trí hiện tại, khám phá xu hướng/hotspot theo khu vực, nhắn tin và quản lý hồ sơ.

> **Trạng thái:** prototype giao diện chạy hoàn toàn bằng **mock data** (chưa gọi backend, chưa có auth, bản đồ là hình minh hoạ). Xem [docs/roadmap.md](docs/roadmap.md) để biết cái gì đã có và cái gì còn thiếu.

## Công nghệ

| Mục | Dùng |
|---|---|
| Build | Vite 6, TypeScript (strict) |
| UI | React 19, Tailwind CSS v4 (plugin `@tailwindcss/vite`, không có `tailwind.config`) |
| Component | shadcn/ui, style `base-nova` trên **Base UI** (`@base-ui/react`) — xem [docs/ui-guidelines.md](docs/ui-guidelines.md) |
| Routing | React Router (`react-router-dom`, `BrowserRouter`) |
| Icon / Toast | `lucide-react` / `sonner` |
| Test | Vitest + jsdom + Testing Library |
| Lint / Format | ESLint (flat config) + React Compiler rules + Prettier (`.prettierrc`) |

## Chạy dự án

```bash
npm install
npm run dev        # http://localhost:5173
```

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Dev server |
| `npm run lint` | Chạy ESLint kiểm tra code và luật React Compiler |
| `npm run build` | `tsc -b` rồi `vite build` (build phải sạch lỗi type) |
| `npm test` | Chạy toàn bộ test (Vitest) |
| `npm run format` | Prettier cho `src` (bỏ qua `src/components/ui`) |

Biến môi trường (tuỳ chọn): `VITE_API_BASE_URL` — base URL cho `src/lib/http-client.ts`.

## Các trang

| Route | Trang | File |
|---|---|---|
| `/` | Home feed | `src/pages/home.tsx` |
| `/explore` | Bản đồ, hotspot, trending, lọc theo bán kính | `src/pages/explore.tsx` |
| `/messages` | Chat (danh sách + khung chat + panel chi tiết) | `src/components/chat-page.tsx` |
| `/profile` | Hồ sơ cá nhân, tab Posts / Liked / Saved | `src/components/profile-page.tsx` |
| `/notifications` | Placeholder "Coming soon" | `src/pages/coming-soon.tsx` |
| `/admin/*` | Khu vực Quản trị & Kiểm duyệt (Admin Console) | `src/routes/admin-routes.tsx` |
| `*` | 404 | `src/pages/not-found.tsx` |

Mọi trang người dùng đều nằm trong `AppLayout` (Sidebar trên desktop, header + bottom nav trên mobile). Khu vực `/admin/*` có layout và router riêng (`AdminLayout`, tải lười).

### Tài khoản thử nghiệm khu vực Quản trị (`VITE_USE_MOCK=true`):
- **Admin**: `admin@nearby.local` (Mật khẩu: `Passw0rd!`)
- **Moderator**: `moderator@nearby.local` hoặc `moderator2@nearby.local` (Mật khẩu: `Passw0rd!`)
- **Tài khoản bị khoá**: `locked@nearby.local` (Báo lỗi `ACCOUNT_LOCKED`)
- **Người dùng thường**: `user@nearby.local` (Báo lỗi `NOT_STAFF`)

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
│  ├─ http-client.ts       # Axios client dùng chung, ApiError, chuẩn hoá lỗi
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
