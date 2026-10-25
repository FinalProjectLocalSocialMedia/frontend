# Kiến Trúc Frontend & Hướng Dẫn Phát Triển Cho AI Agent (Nearby Frontend Architecture)

> **Tài liệu chuẩn dành cho AI Agent và lập trình viên.**
> Mọi thành viên và AI Agent khi triển khai tính năng, refactor hoặc sửa lỗi trên repository `frontend/` **bắt buộc tuân thủ tài liệu này**.

---

## 1. Tổng quan Dự Án & Technology Stack

Ứng dụng web frontend của mạng xã hội chia sẻ và tương tác nội dung theo vị trí địa lý (**nearby.**):
- **Core:** React 19, TypeScript (strict mode), Vite 6.
- **Styling & Design System:** Tailwind CSS v4 (`@tailwindcss/vite`), Base UI (`@base-ui/react`), shadcn/ui (style `base-nova`), Lucide Icons.
- **Routing:** React Router v7 (`react-router-dom`, `BrowserRouter`, `Routes`, `Route`, `Outlet`).
- **Server State & Data Fetching:** TanStack React Query v5.
- **Form & Validation:** React Hook Form, Zod.
- **HTTP & Realtime:** Axios (`apiClient` với HttpOnly cookie auth interceptor), STOMP Client qua WebSockets (`@stomp/stompjs` + `sockjs-client`).
- **Notification & Toasts:** Sonner (`toast`).
- **Quality Assurance:** Vitest, Testing Library, ESLint flat config.

---

## 2. Cấu Trúc Thư Mục Chuẩn (Feature-Driven Architecture)

Dự án tổ chức mã nguồn theo mô hình **Feature-Driven Architecture**. Toàn bộ logic nghiệp vụ được module hóa trong `src/features/<feature-name>/`, các thành phần dùng chung nằm ở tầng root tương ứng.

```text
frontend/src/
├── app/                              # Wiring ứng dụng, KHÔNG chứa nghiệp vụ
│   ├── providers.tsx                 # Toàn bộ Provider bọc toàn app (Theme, Query, Auth, Toaster)
│   ├── query-client.ts               # QueryClient cấu hình mặc định cho app
│   └── router.tsx                    # Định nghĩa toàn bộ cây Routes (bao gồm lazy admin routes)
│
├── components/
│   ├── ui/                           # shadcn / Base UI primitives (CẤM sửa tay)
│   ├── layout/                       # AppLayout, Sidebar, BottomNav, MobileHeader, ThemeToggle, nav.ts
│   └── shared/                       # Component UI dùng chung ≥ 2 feature (empty-state, confirm-dialog...)
│
├── hooks/                            # Hooks tiện ích toàn cục (use-media-query, use-mobile...)
├── lib/                              # Tiện ích thuần, KHÔNG phụ thuộc feature nào
│   ├── utils.ts                      # cn() helper
│   ├── http-client.ts                # Generic fetch client bọc base URL (dùng cho service độc lập)
│   └── api-client.ts                 # Axios instance chính + Cookie Refresh Interceptor (Auth & Chat)
│
├── config/
│   └── env.ts                        # Nơi DUY NHẤT đọc import.meta.env (API_BASE_URL, CLOUDINARY...)
│
├── features/                         # Module hóa theo từng tính năng nghiệp vụ
│   ├── auth/                         # Xác thực người dùng thường & quản trị viên
│   ├── chat/                         # Nhắn tin 1-1, nhóm, WebSocket STOMP thời gian thực
│   ├── post/                         # Bài viết, Newsfeed theo vị trí, bình luận, tương tác, upload media
│   ├── explore/                      # Bản đồ, lọc bán kính, xu hướng địa phương
│   ├── profile/                      # Hồ sơ cá nhân, bài viết đã lưu, đã thích
│   ├── admin/                        # Nghiệp vụ quản trị viên
│   ├── moderation/                   # Nghiệp vụ kiểm duyệt viên
│   └── admin-moderation/             # Vỏ giao diện và trang đăng nhập khu vực Admin/Moderation
│
├── routes/
│   └── admin-routes.tsx              # Lazy-loaded router chunk cho khu vực /admin/*
│
├── App.tsx                           # <Providers><AppRouter /></Providers>
├── main.tsx                          # Entry point: BrowserRouter + StrictMode
└── index.css                         # Tailwind imports, Design Tokens (light/dark)
```

---

## 3. Cấu Trúc Bên Trong Một Feature

Mỗi feature trong `src/features/<tên>/` phải tuân theo cấu trúc module đồng nhất:

```text
features/<tên-feature>/
├── api/
│   ├── <tên>-api.ts                  # Các hàm gọi API (REST endpoints qua apiClient / postHttp)
│   └── <tên>-queries.ts              # TanStack Query keys và custom hooks (useXxxQuery, useXxxMutation)
├── components/                       # Các component UI nội bộ thuộc riêng feature này
├── hooks/                            # Custom hooks riêng của feature (vd: use-chat-socket.ts)
├── pages/                            # Component gắn trực tiếp vào router (vd: <tên>-page.tsx)
├── types/                            # TypeScript interfaces, types, enums của feature
├── context/                          # (Tuỳ chọn) React Context nếu feature cần state riêng
└── mocks/                            # (Tuỳ chọn) Mock data, fixtures phục vụ test/demo
```

> **Quy tắc:** Không tạo thư mục rỗng. Không dùng file `index.ts` (barrel export) bừa bãi để tránh circular dependency.

---

## 4. Các Nguyên Tắc & Ràng Buộc Bắt Buộc (Agent Rules)

### 4.1 Quy tắc phụ thuộc một chiều (Dependency Hierarchy)
```text
app/ -> features/ -> components/layout -> components/shared -> hooks -> lib -> config
```
1. **App layer (`src/app/`):** Có thể import từ `features/`, `components/`, `lib/`.
2. **Feature layer (`src/features/<A>/`):**
   - **KHÔNG** import ngang sang `src/features/<B>/`, ngoại trừ `src/features/auth` (vì toàn bộ app đều cần `useAuth` và type `AuthUser`).
   - App người dùng bình thường **TUYỆT ĐỐI KHÔNG** import từ `src/features/{admin,moderation,admin-moderation}`.
3. **Core layers (`components/shared`, `hooks/`, `lib/`):**
   - **TUYỆT ĐỐI KHÔNG** import từ bất kỳ `src/features/*` nào.

### 4.2 Quy ước đặt tên file và Component
- **File name:** Bắt buộc dùng `kebab-case` cho mọi file:
  - Component: `chat-window.tsx`, `post-card.tsx`, `login-form.tsx`.
  - Module/API: `chat-api.ts`, `auth-queries.ts`, `use-chat-socket.ts`.
  - Type: `chat.ts`, `post.ts`, `auth.ts`.
- **Component name:** Xuất (export) theo chuẩn `PascalCase`:
  ```tsx
  export function ChatWindow() { ... }
  export function AuthPage() { ... }
  ```

### 4.3 Quản lý Server State với TanStack Query
- Mọi lời gọi API lấy dữ liệu (GET) phải được bọc trong TanStack Query `useQuery`.
- Mọi hành động thay đổi dữ liệu (POST, PUT, PATCH, DELETE) dùng `useMutation`.
- Các query key phải khai báo tập trung dạng hằng số trong `<tên>-queries.ts`:
  ```ts
  export const chatKeys = {
    all: ['chat'] as const,
    conversations: () => [...chatKeys.all, 'conversations'] as const,
    messages: (id: string) => [...chatKeys.all, 'messages', id] as const,
  }
  ```
- **Không bao giờ gọi trực tiếp `axios`/`fetch` trong thân React Component.**

### 4.4 Quy tắc Giao diện & Design Tokens
- **Design Tokens:** Bắt buộc dùng tokens định nghĩa trong `src/index.css`: `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`... Không dùng màu cứng (hardcoded colors) như `bg-white`, `text-black`, `bg-[#123456]`.
- **shadcn & Base UI:**
  - Không tự ý sửa tay file trong `src/components/ui/*`.
  - Base UI dùng thuộc tính `render={...}` thay cho `asChild` của Radix UI.
  - Các phần tử tương tác không có text (icon-only button) **bắt buộc** phải có `aria-label`.

---

## 5. Kiến Trúc Xác Thực (Authentication & Security)

### 5.1 Cơ chế HttpOnly Cookie
- Hệ thống sử dụng **HttpOnly Cookies** (`accessToken`, `refreshToken`) được set trực tiếp bởi API Gateway và Backend.
- **Frontend KHÔNG bao giờ lưu JWT vào `localStorage` hay `sessionStorage`** (chống XSS).
- Request tự động đính kèm cookie thông qua Axios Client:
  ```ts
  // src/lib/api-client.ts
  export const apiClient = axios.create({
    baseURL: env.API_BASE_URL,
    withCredentials: true,
  })
  ```

### 5.2 Mô hình Người dùng (Discriminated Union)
Toàn bộ hệ thống dùng chung một kiểu dữ liệu người dùng tại `src/features/auth/types/auth.ts`:

```ts
export type Role = 'USER' | 'MODERATOR' | 'ADMIN'

export interface NormalUser {
  id: string
  email: string
  fullName: string
  phoneNumber?: string
  avatarUrl?: string
  bio?: string
  gender?: string
  dateOfBirth?: string
  role: 'USER'
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface StaffUser {
  id: string
  email: string
  role: 'ADMIN' | 'MODERATOR'
  status: UserStatus
  grantedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type AuthUser = NormalUser | StaffUser
export const isStaff = (u: AuthUser | null): u is StaffUser => !!u && u.role !== 'USER'
```

### 5.3 Hai Trang Đăng Nhập Riêng Biệt
- **/login:** Trang đăng nhập người dùng thường.
  - Sử dụng `<LoginForm allowedRoles={['USER']} />`.
  - Nếu tài khoản staff đăng nhập tại đây, hệ thống lập tức logout (hủy cookie) và hiển thị thông báo hướng dẫn sang trang quản trị.
- **/admin/login:** Trang đăng nhập dành riêng cho Staff (`ADMIN` và `MODERATOR`).
  - Nằm tại `src/features/admin-moderation/pages/staff-login-page.tsx`.
  - Sử dụng `<LoginForm allowedRoles={['ADMIN', 'MODERATOR']} />`.
  - Nếu tài khoản `USER` thường đăng nhập tại đây sẽ bị từ chối truy cập.

### 5.4 Tự động Refresh Token & Xử lý 401
- `src/lib/api-client.ts` cài đặt response interceptor:
  1. Khi gặp lỗi 401 trên các API nghiệp vụ, interceptor tự động gọi `/user/auth/refresh` một lần.
  2. Các request đang chờ được xếp vào hàng đợi (`refreshSubscribers`) và thử lại sau khi refresh thành công.
  3. Nếu refresh thất bại: phát sự kiện `authEvents.emit('unauthorized')`.
  4. `AuthProvider` bắt sự kiện `unauthorized`, xóa cache query `['auth', 'me']`, đưa `user` về `null` và hiển thị thông báo phiên hết hạn.

---

## 6. Kiến Trúc Các Feature Cốt Lõi

### 6.1 Feature `post` (Bài viết & Tương tác)
- Quản lý Newsfeed theo vị trí địa lý (H3 geospatial coordinates).
- Tải feed dạng phân trang con trỏ (`PostCursorPage`, cursor-based pagination).
- **Tạo bài viết & Upload Media:**
  1. Frontend gọi `requestPostUploadSignature()` tới `/api/v1/post/signature` để lấy chữ ký bảo mật từ backend.
  2. Upload trực tiếp file ảnh/video từ trình duyệt lên Cloudinary qua HTTPS POST có chữ ký.
  3. Nhận `secure_url` từ Cloudinary và gửi payload bài viết tới `/api/v1/post/posts`.

### 6.2 Feature `chat` (Nhắn tin Thời gian thực)
- **REST API:** Quản lý hội thoại và tải lịch sử tin nhắn qua `chatApi` (`/api/v1/chat/*`).
- **WebSocket STOMP:**
  - Kết nối qua `useChatSocket`: Handshake tại `/ws`, xác thực qua cookie hoặc token.
  - Subscribe:
    - Tin nhắn hội thoại: `/topic/conversation.{conversationId}`
    - Trạng thái đang gõ: `/topic/conversation.{conversationId}.typing`
    - Thông báo cá nhân: `/user/queue/notifications`
  - Publish:
    - Gửi tin nhắn: `/app/chat.send`
    - Gửi trạng thái gõ: `/app/chat.typing`
- **UI Responsiveness:**
  - Desktop: 3 cột cố định (`ConversationList` 330px, `ChatWindow`, `DetailsPanel` 280px).
  - Mobile: Chuyển đổi giữa danh sách và khung chat bằng state `mobileChatOpen` kết hợp CSS `hidden lg:flex` (luôn giữ mount component để duy trì trạng thái).

### 6.3 Feature `admin-moderation`
- Module độc lập, tải lười (lazy load) qua `routes/admin-routes.tsx` để tối ưu bundle size cho người dùng thường.
- Cung cấp:
  - Thống kê bài viết và hashtag (`/api/v1/admin/stats/*`).
  - Quản lý người dùng, khóa/mở tài khoản (`/api/v1/admin/users/*`).
  - Hàng đợi duyệt nội dung vi phạm (`/api/v1/moderation/reports/*`).

---

## 7. Giao Diện & Bố Cục (Layout & Responsive Guidelines)

### 7.1 Cấu trúc Layout Duy Nhất
- Toàn bộ app người dùng render bên trong `AppLayout` (`src/components/layout/app-layout.tsx`).
- **Chỉ có DUY NHẤT một thẻ `<main>` trong toàn bộ DOM tree.** Các page chỉ render nội dung bên trong `<Outlet />`.
- Chiều cao trên thiết bị di động:
  - Thanh BottomNav chiếm chiều cao biến `--bottom-nav-h` (`4rem + safe-area`).
  - Các trang tràn màn hình (như Chat) bắt buộc dùng: `h-[calc(100dvh-var(--bottom-nav-h))] lg:h-dvh`.
  - **TUYỆT ĐỐI KHÔNG dùng `min-h-screen` hay `100vh`** vì sẽ gây tràn thanh cuộn trên Safari/Chrome mobile.

### 7.2 Sidebar (Desktop)
- Rail cố định chiếm không gian trong DOM: `w-[72px]`.
- Khi hover hoặc mở menu con, panel tự mở rộng thành `w-64` (256px) theo kiểu **overlay phủ lên nội dung**, không bao giờ làm co kéo hay giật nội dung chính.

---

## 8. Quy Trình Kiểm Thử & Tiêu Chuẩn Hoàn Thành (Definition of Done)

Mọi thay đổi code của AI Agent trước khi hoàn tất bắt buộc phải vượt qua 4 bước kiểm tra nghiêm ngặt:

```bash
# 1. Kiểm tra toàn bộ kiểu dữ liệu (Strict TypeScript)
npx tsc -b

# 2. Kiểm tra chất lượng mã nguồn & luật React Compiler
npm run lint

# 3. Chạy toàn bộ bộ test tự động (Vitest)
npm test

# 4. Kiểm tra đóng gói production bundle
npm run build
```

> **Nguyên tắc kiểm thử:** Nếu sửa đổi logic tính năng, agent phải chủ động cập nhật hoặc viết thêm unit/integration test tương ứng trong `src/*.test.tsx`. Tuyệt đối không xóa test hoặc bỏ qua lỗi test.
