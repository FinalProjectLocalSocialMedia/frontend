# Đề xuất cấu trúc frontend (feature-based) + hướng dẫn refactor cho agent

> Phạm vi: thư mục `frontend/`. Stack: React 19, Vite, TypeScript, Tailwind v4, shadcn (Base UI), TanStack Query, React Router.
> Mục tiêu: **một quy ước chung**, đơn giản, không over-engineering. Không đổi hành vi, chỉ di chuyển/đổi tên file và sửa import.

---

## 1. Đánh giá hiện trạng

### Điểm tốt
- `features/post`, `features/admin`, `features/moderation`, `features/admin-moderation` đã theo hướng feature.
- `components/ui` (shadcn) tách riêng, `@/` alias đã có.

### Vấn đề cần xử lý
| # | Vấn đề | Ví dụ thực tế |
|---|--------|---------------|
| 1 | Code chat/auth nằm rải rác ở nhiều thư mục kỹ thuật | `components/chat-page.tsx`, `components/chat/*`, `lib/chat-api.ts`, `lib/use-chat-socket.ts`, `lib/mock-chat.ts`, `types/chat.ts`, `lib/auth-context.tsx`, `pages/auth.tsx`, `types/auth.ts` |
| 2 | `lib/` là "thùng rác": lẫn code dùng chung với code của 1 feature | `lib/api.ts` (axios + refresh cookie cho auth/chat), `lib/posts-context.tsx`, `lib/mock-nearby.ts`, `lib/nav.ts` |
| 3 | `lib/api.ts` có **2 client** (axios `apiClient` + `fetch` `api`) cạnh `lib/http-client.ts` → 3 cách gọi HTTP. AGENTS.md quy định mọi HTTP qua `lib/http-client.ts` | `features/post/api/http-client.ts` dùng `createHttpClient`, auth/chat dùng `apiClient` |
| 4 | Còn component/page "mồ côi" ở root | `components/post-card.tsx`, `components/profile-page.tsx`, `pages/home.tsx`, `pages/explore.tsx`, `components/explore/map-view.tsx` |
| 5 | Trùng file và sai quy ước đặt tên trong `features/post` | `HomeFeed.tsx` vs `home-feed.tsx`, `UserAvatar.tsx` vs `user-avatar.tsx`, `PostActions.tsx` vs `post-actions.tsx`, `Comment.tsx`, `Post.ts`, `Location.ts` |
| 6 | Feature đặt tên file API không thống nhất | post: `post-api.ts`; admin: `*.http.ts/*.mock.ts/*.service.ts/*.queries.ts` |
| 7 | `App.tsx` import lẫn `@/…` và `./features/…`, provider và route khai báo chung 1 file | `App.tsx` |
| 8 | Có 2 nơi chứa auth: `lib/auth-context.tsx` (app người dùng) và `features/admin-moderation/auth/*` (admin) | Giữ nguyên, xem mục 6 |

---

## 2. Cấu trúc đề xuất

```
src/
├─ app/                       # "Vỏ" ứng dụng: chỉ wiring, KHÔNG chứa nghiệp vụ
│  ├─ providers.tsx           # ThemeProvider, QueryClientProvider, AuthProvider, PostsProvider, Toaster
│  ├─ query-client.ts         # QueryClient dùng chung của app người dùng
│  └─ router.tsx              # Toàn bộ <Routes> (lazy admin ở đây)
├─ components/
│  ├─ ui/                     # shadcn – KHÔNG sửa tay
│  ├─ layout/                 # app-layout, sidebar, bottom-nav, mobile-header, theme-toggle, theme-provider, nav.ts
│  └─ shared/                 # Component nhiều feature dùng chung (user-avatar, empty-state…) – tạo khi thật sự cần
├─ hooks/                     # Hook dùng chung (use-media-query, use-mobile…)
├─ lib/                       # Tiện ích thuần, KHÔNG biết feature nào
│  ├─ utils.ts                # cn()
│  ├─ http-client.ts          # createHttpClient, ApiError (+ test)
│  └─ api-client.ts           # (đổi tên từ api.ts) axios instance + refresh-cookie interceptor dùng cho auth & chat
├─ types/                     # Chỉ type thật sự toàn cục (vd: api.ts – Page<T>, ApiResponse). Có thể không cần
├─ config/
│  └─ env.ts                  # Đọc import.meta.env một chỗ (API_BASE_URL, WS_URL…)
├─ features/
│  ├─ auth/
│  ├─ chat/
│  ├─ post/
│  ├─ explore/                # (giai đoạn 2) map-view, explore-page, mock-nearby
│  ├─ profile/                # (giai đoạn 2) profile-page
│  ├─ admin/                  # giữ nguyên
│  ├─ moderation/             # giữ nguyên
│  └─ admin-moderation/       # giữ nguyên (shell + auth + http cho khu admin)
├─ routes/                    # (giữ) admin-routes.tsx – lazy chunk của admin
├─ App.tsx                    # <Providers><AppRouter/></Providers>
├─ main.tsx
└─ index.css
```

### Cấu trúc bên trong 1 feature (chuẩn chung của team)

```
features/<tên>/
├─ api/          # gọi HTTP + TanStack Query hooks
│  ├─ <tên>-api.ts       # hàm gọi server (dùng http client của lib)
│  └─ <tên>-queries.ts   # queryKeys + useXxxQuery / useXxxMutation
├─ components/   # UI riêng của feature
├─ hooks/        # hook riêng (vd use-chat-socket)
├─ pages/        # component được gắn vào route (<tên>-page.tsx)
├─ types/        # type của feature
└─ (tuỳ chọn, chỉ tạo khi cần)  context/ · mocks/ · lib/ (helper thuần của feature)
```

Đã chốt: **không** thêm `store/`, `services/`, `utils/` riêng, **không** dùng barrel `index.ts` ở mọi nơi (tránh vòng lặp import) – trừ khi một feature cần public API gọn.

---

## 3. Quy ước (đưa vào `AGENTS.md` sau khi refactor)

1. **Code của 1 tính năng → `src/features/<tên>/`**. Code dùng bởi ≥ 2 feature mới được đưa lên `components/shared`, `hooks`, `lib`.
2. **Hướng phụ thuộc:** `app → features → components/hooks/lib/types/config`. `components`, `hooks`, `lib` **không** import từ `features` (ngoại lệ: `components/layout` được dùng `useAuth` từ `features/auth`).
3. **Feature không import ngang feature khác**, trừ qua type/hook công khai (`features/auth` là ngoại lệ vì ai cũng cần `useAuth`). Giữ nguyên luật: app người dùng không import `features/{admin,moderation,admin-moderation}`.
4. **Đặt tên file: `kebab-case`** cho mọi file (`chat-window.tsx`, `post-types.ts`). Component export tên PascalCase. Không `PascalCase.tsx`.
5. **Pages** (`pages/*-page.tsx`) chỉ ghép component + gọi hook; logic gọi API nằm ở `api/`, logic tái dùng nằm ở `hooks/`.
6. **Server state dùng TanStack Query**: queryKey khai báo tập trung trong `<tên>-queries.ts` dạng `['chat', 'conversations']`; component không gọi `apiClient`/`fetch`/`axios` trực tiếp.
7. **Mock data** để trong `features/<tên>/mocks/` (hoặc `*.mock.ts` cạnh api), không để trong `lib/`.
8. **Env** chỉ đọc qua `config/env.ts`.
9. Test đặt cạnh file được test (`*.test.ts(x)`).
10. Import dùng alias `@/…` (không dùng `./features/...` ở root, tránh `../../..`; trong cùng feature được dùng đường dẫn tương đối ngắn).

---

## 4. Bảng di chuyển (mapping)

### 4.1 Feature `auth`

| Hiện tại | Đích |
|---|---|
| `src/lib/auth-context.tsx` | `src/features/auth/context/auth-context.tsx` (chỉ giữ Provider + `useAuth`) |
| *(logic gọi `apiClient.post('/user/auth/...')` bên trong auth-context)* | **tách** ra `src/features/auth/api/auth-api.ts` (`login`, `register`, `logout`, `fetchMe`…) |
| `src/pages/auth.tsx` | `src/features/auth/pages/auth-page.tsx` (export `AuthPage`; nếu quá dài tách `components/login-form.tsx`, `components/register-form.tsx`) |
| `src/types/auth.ts` | `src/features/auth/types/auth.ts` |

### 4.2 Feature `chat`

| Hiện tại | Đích |
|---|---|
| `src/components/chat-page.tsx` | `src/features/chat/pages/chat-page.tsx` |
| `src/components/chat/avatar.tsx` | `src/features/chat/components/chat-avatar.tsx` (đổi tên cho khỏi nhầm với `ui/avatar`) |
| `src/components/chat/{chat-window,conversation-list,create-group-dialog,details-panel,new-chat-dialog,report-dialog}.tsx` | `src/features/chat/components/` (giữ tên) |
| `src/lib/chat-api.ts` | `src/features/chat/api/chat-api.ts` |
| `src/lib/use-chat-socket.ts` | `src/features/chat/hooks/use-chat-socket.ts` |
| `src/lib/mock-chat.ts` | `src/features/chat/mocks/mock-chat.ts` |
| `src/types/chat.ts` | `src/features/chat/types/chat.ts` |
| *(type `ChatMessage`, `Conversation` đang export từ `mock-chat.ts`)* | chuyển sang `features/chat/types/chat.ts`; mock chỉ import lại |

### 4.3 Dùng chung

| Hiện tại | Đích | Ghi chú |
|---|---|---|
| `src/lib/api.ts` | `src/lib/api-client.ts` (giữ `apiClient`) | **Xoá** `createApiClient`/`api` (fetch) nếu không còn nơi dùng (kiểm tra bằng grep) |
| `src/lib/nav.ts` | `src/components/layout/nav.ts` | chỉ layout dùng |
| `src/components/theme-provider.tsx` | `src/components/layout/theme-provider.tsx` | cập nhật import trong `sonner.tsx` (ngoại lệ đã ghi trong AGENTS.md) |
| `src/components/layout/create-post-*.tsx` | `src/features/post/components/` (`create-post-context.tsx`, `create-post-dialog.tsx`) | nghiệp vụ đăng bài; AppLayout import từ feature post |
| `src/lib/posts-context.tsx` | `src/features/post/context/posts-context.tsx` | mock state của post; sẽ bị thay bằng TanStack Query dần |
| `src/lib/mock-nearby.ts` | `src/features/post/mocks/mock-nearby.ts` | (giai đoạn 2 có thể chuyển sang `features/explore`) |

### 4.4 Feature `post` (dọn dẹp)

- Xoá file trùng **sau khi kiểm tra không còn ai import**: giữ bản kebab-case, xoá `HomeFeed.tsx`, `UserAvatar.tsx`, `PostActions.tsx`; đổi `Comment.tsx` → `comment.tsx`, `types/Comment.ts` → `comment.ts`, `Post.ts` → `post.ts`, `Location.ts` → `location.ts`.
- `components/post-card.tsx` (root) và `features/post/components/post-card.tsx`: xác định bản nào đang được dùng; hợp nhất vào `features/post/components/`.
- `api/http-client.ts` của post chỉ là 1 instance → giữ, hoặc chuyển thành `lib/http-client` instance dùng chung (`config/env.ts` cấp baseURL).
- Đổi `post-api.ts`/`comment-api.ts`/`post-upload-api.ts` giữ nguyên tên; thêm `post-queries.ts` nếu đang có query hook nằm rải trong component/page.

### 4.5 Giai đoạn 2 (sau khi 4.1–4.4 xong, tuỳ chọn)

| Hiện tại | Đích |
|---|---|
| `src/components/profile-page.tsx` | `src/features/profile/pages/profile-page.tsx` |
| `src/pages/explore.tsx`, `src/components/explore/map-view.tsx` | `src/features/explore/pages/explore-page.tsx`, `.../components/map-view.tsx` |
| `src/pages/home.tsx` | xoá nếu đã thay hoàn toàn bởi `features/post/pages/home-feed.tsx` |
| `src/pages/coming-soon.tsx`, `src/pages/not-found.tsx` | `src/components/shared/coming-soon.tsx`, `src/components/shared/not-found.tsx` (rồi xoá `src/pages/`) |

### 4.6 `App.tsx`

- Tạo `app/providers.tsx` (ThemeProvider → QueryClientProvider → AuthProvider → PostsProvider → children + `<Toaster/>`).
- Tạo `app/router.tsx` chứa toàn bộ `<Routes>`; import page qua `@/features/<tên>/pages/...`.
- `App.tsx` còn: `<Providers><AppRouter /></Providers>`.
- Nếu `QueryClientProvider` hiện được đặt ở `main.tsx` thì giữ nguyên chỗ đó hoặc chuyển vào `providers.tsx` — chỉ một nơi.

---

## 5. Hướng dẫn cho AI agent thực hiện refactor

> **Nguyên tắc vàng:** *chỉ di chuyển & sửa import, không đổi logic/UI.* Mỗi bước nhỏ phải xanh (`tsc` + test) trước khi sang bước sau. Làm trên branch riêng, **mỗi bước 1 commit**.

### Quy trình chung cho mỗi bước
1. Dùng `git mv` (giữ lịch sử) thay vì copy/xoá.
2. Sửa **mọi** import trỏ tới file cũ (`grep -rn "<đường dẫn cũ>" src`). Bao gồm cả test (`src/layout.test.tsx`, `src/shadcn-ui.test.tsx`, `*.test.ts(x)`), `vi.mock('@/lib/...')`, và `import()` động.
3. Chạy lần lượt và sửa đến khi sạch:
   ```bash
   npx tsc -b
   npm run lint
   npm test
   npm run build
   ```
4. `npm run format` rồi commit: `refactor(<feature>): <mô tả>`.
5. Cuối mỗi bước: `grep` đảm bảo không còn import tới đường dẫn cũ.

### Thứ tự thực hiện

**Bước 0 – Chuẩn bị**
- Tạo branch `refactor/feature-structure`. Chạy 4 lệnh kiểm tra để có baseline (ghi lại lỗi có sẵn nếu có, đừng sửa lẫn vào).
- Thêm `src/config/env.ts` (xuất `API_BASE_URL`, `AUTH_API_BASE_URL`… từ `import.meta.env`); **chưa** bắt buộc thay hết chỗ dùng.

**Bước 1 – Feature `auth`**
1. Tạo `features/auth/{api,components,context,pages,types}`.
2. `git mv` theo bảng 4.1.
3. Tách các lời gọi `apiClient.*` trong `auth-context.tsx` sang `features/auth/api/auth-api.ts`; context chỉ gọi hàm trong `auth-api.ts`. Giữ nguyên chữ ký `useAuth()` và hành vi.
4. Cập nhật import ở: `App.tsx`, `components/layout/sidebar.tsx`, `components/layout/mobile-header.tsx`, `components/profile-page.tsx`, `chat-page.tsx`, test liên quan. Đổi `pages/auth.tsx` thành `AuthPage` trong `auth-page.tsx` (route `login`/`register` giữ nguyên prop `initialMode`).

**Bước 1b – Hợp nhất auth admin vào `features/auth`** (làm SAU khi Bước 1 và Bước 2 xong, đã chạy ổn)

**Quyết định đã chốt**
- Mọi vai trò (USER, MODERATOR, ADMIN) dùng **cùng API** `/user/auth/{login,register,refresh,logout,me}` và **cookie HttpOnly** (`accessToken`, `refreshToken`); gateway đọc JWT từ cookie. **Không** dùng `sessionStorage`, không gắn header `Authorization`, frontend không bao giờ đọc token.
- Mọi request dùng **axios `apiClient`** chung (`lib/api-client.ts`, `withCredentials: true`, interceptor refresh khi 401). Bỏ `adminHttp` riêng.
- **Giữ 2 trang đăng nhập riêng** (`/login` cho người dùng, `/admin/login` cho nhân viên – giao diện khác nhau) nhưng **dùng chung** hook/api/logic; chỉ phần giao diện (layout, form wrapper) khác nhau.
- Chừa chỗ mở rộng **đăng nhập Google** sau này mà không phải đập lại cấu trúc.

**Hình dạng response từ backend** (`AuthController`): body của `register` (201), `login`, `refresh`, `me` là **chính user**, không có wrapper `{accessToken, user}` (token chỉ nằm trong `Set-Cookie`). Kiểu `UserResponse` là interface với 2 dạng, phân biệt bằng `role`:

```ts
// features/auth/types/auth.ts
export type Role = 'USER' | 'MODERATOR' | 'ADMIN'   // role của NormalUserResponse = "USER" (đã xác nhận)

export interface NormalUser {
  id: string; email: string; phoneNumber?: string; fullName: string
  avatarUrl?: string; role: 'USER'; bio?: string
  dateOfBirth?: string; gender?: string; status: UserStatus
  createdAt: string; updatedAt: string
}
export interface StaffUser {            // không có fullName: hiển thị email
  id: string; email: string; role: 'ADMIN' | 'MODERATOR'
  status: UserStatus; grantedAt?: string | null; createdAt: string; updatedAt: string
}
export type AuthUser = NormalUser | StaffUser   // discriminated union theo `role`
export const isStaff = (u: AuthUser | null): u is StaffUser => !!u && u.role !== 'USER'
```
> Agent: đọc `NormalUserResponse.java`, `StaffUserResponse.java`, enum `UserStatus`, `Gender` để khớp tên field/giá trị enum; **không đoán**. Hiện `types/auth.ts` có field `currentH3Index`, `locationUpdatedAt` không có trong DTO – kiểm tra chỗ dùng trước khi xoá. Xoá `AuthResponse` (token trong body) vì không còn dùng.

**Cấu trúc đích của `features/auth`**
```
features/auth/
├─ api/
│  ├─ auth-api.ts           # login, register, refresh, logout, me  (apiClient) – trả AuthUser
│  ├─ auth-queries.ts       # authKeys, useMeQuery, useLoginMutation, useRegisterMutation, useLogoutMutation
│  └─ (sau này) oauth-api.ts  # Google
├─ components/
│  ├─ login-form.tsx        # form + validation + gọi useLoginMutation; KHÔNG chứa layout/style trang
│  ├─ register-form.tsx
│  ├─ social-login-buttons.tsx  # (sau này) nút Google, hiện chỉ render null / ẩn bằng flag
│  └─ guards.tsx            # RequireAuth, RequireRole/RequirePermission, Can
├─ context/auth-context.tsx # AuthProvider + useAuth: { user, role, isAuthenticated, isLoading, login, register, logout, hasPermission }
├─ hooks/use-permission.ts
├─ lib/{permissions.ts, auth-events.ts}
├─ pages/auth-page.tsx      # trang /login, /register (giao diện người dùng)
└─ types/auth.ts
```
`features/admin-moderation/pages/staff-login-page.tsx` (đổi tên từ `login-page.tsx`, **đặt tại admin-moderation**, route `/admin/login`) chỉ chứa giao diện nhân viên và import `LoginForm`, `useAuth` từ `@/features/auth`; không tự gọi API/mutation.

**Thiết kế chi tiết**
1. **Nguồn sự thật của user:** `useMeQuery` (TanStack Query, key `['auth','me']`, `retry: false`, `staleTime` dài) gọi `GET /user/auth/me`. `AuthProvider` đọc từ query này; `isLoading` = trạng thái khởi tạo; 401 ⇒ `user = null`. Login/register thành công ⇒ `queryClient.setQueryData(authKeys.me, user)`; logout ⇒ gọi API, `queryClient.clear()`, rồi `navigate` về trang đăng nhập đúng ngữ cảnh.
2. **Login form dùng chung, tuỳ biến theo ngữ cảnh:** `LoginForm` nhận props `{ onSuccess(user), allowedRoles?, submitLabel?, className? }`.
   - `/login`: truyền `allowedRoles={['USER']}`. **ADMIN/MODERATOR bắt buộc đăng nhập ở `/admin/login`**: nếu response là staff ⇒ gọi `logout()` ngay (xoá cookie vừa được set) và hiện lỗi "Tài khoản quản trị vui lòng đăng nhập tại trang quản trị" (kèm link tới `/admin/login`). Thành công ⇒ đi tới `from` hoặc `/`. Áp dụng tương tự cho `register` (chỉ tạo USER) và Google login sau này (chỉ USER).
   - `/admin/login`: truyền `allowedRoles={['ADMIN','MODERATOR']}`; nếu user là `USER` ⇒ gọi `logout()` ngay và hiện lỗi "Tài khoản không có quyền truy cập khu vực quản trị". Thành công ⇒ `from` thuộc `/admin` hoặc `defaultRouteForRole(role)`.
   - Kiểm tra role chỉ để UX; RBAC thật vẫn ở server. Nên bổ sung ở **backend** (ngoài phạm vi FE): login endpoint nhận ngữ cảnh (vd `/auth/login` vs `/auth/staff/login`) để không set cookie sai cổng — ghi lại như đề xuất cho team backend.
   - Khi user staff đã đăng nhập mà mở khu người dùng (ví dụ cookie còn từ `/admin`): `AuthProvider` vẫn có `user` staff ⇒ `Sidebar/MobileHeader` hiển thị theo `isStaff` (ẩn tên/ảnh cá nhân, hiện nút "Vào trang quản trị") thay vì coi như user thường; các route chỉ dành cho USER (profile, chat…) dùng `RequireAuth allowedRoles={['USER']}` ⇒ staff bị chuyển tới `/admin`.
   - Hai trang chỉ khác layout/branding; **không** nhân đôi `useLoginMutation`, schema validation, xử lý `ApiError` → `setError` của react-hook-form.
3. **Phân quyền:** chuyển `permissions.ts`, `guards.tsx`, `usePermission`, `auth-events.ts` từ `admin-moderation/auth` sang `features/auth` (xem cấu trúc). `permissionsForRole(user.role)` nhận `Role` mới (có thể mở rộng cho `USER`). `RequireAuth` nhận prop `loginPath` (mặc định `/login`; khu admin truyền `/admin/login`) để redirect đúng trang kèm `?from=`; `AdminIndexRedirect` giữ ở `admin-moderation`.
4. **Unauthorized toàn cục:** interceptor `apiClient` khi refresh thất bại ⇒ `authEvents.emit('unauthorized')`; `AuthProvider` lắng nghe ⇒ `setQueryData(me, null)`, `queryClient.clear()`, toast "Phiên đăng nhập đã hết hạn". Giữ logic queue refresh hiện có, **không** gọi refresh cho `/user/auth/{login,register,refresh}` (đã có) và nên thêm `/user/auth/me` vào danh sách bỏ qua refresh khi khởi tạo để tránh vòng lặp/nhấp nháy (hoặc chấp nhận 1 lần refresh – kiểm tra hành vi thực tế).
5. **Provider duy nhất:** một `AuthProvider` ở `app/providers.tsx`, đặt trong `QueryClientProvider`. `routes/admin-routes.tsx` bỏ `AuthProvider` riêng. Dùng chung `QueryClient` của app (xoá `createAdminQueryClient` nếu không còn lý do tách; cấu hình mặc định khác biệt, nếu có, chuyển thành option trên từng query).
6. **Dọn khu admin:** xoá `admin-moderation/auth/{auth-context.tsx,session-storage.ts}`, `api/{auth.http.ts,auth.service.ts,auth.mock.ts,http-client.ts}`, `mock/session.ts`, biến `AUTH_API_BASE_URL`/`VITE_AUTH_API_BASE_URL`. Các `*.http.ts` của `admin`/`moderation`/`admin-moderation` (stats, users, audit, notifications, shell, reports, accounts) đổi sang `apiClient` (hoặc `createHttpClient` bọc cùng cấu hình `withCredentials`). `.env`: chỉ còn `VITE_API_BASE_URL` trỏ gateway. Nếu vẫn cần `USE_MOCK`, mock auth đặt ở `features/auth/mocks/` (mock `me/login/logout` theo role).
7. **Chuẩn bị cho Google login (chưa làm, chỉ để chừa chỗ):**
   - Quy ước backend: `GET /user/auth/oauth/google` (redirect) hoặc `POST /user/auth/oauth/google` nhận `idToken`/`code`; xong **vẫn set cookie như login thường** và trả `UserResponse`. Frontend không phải đổi cơ chế phiên.
   - Thêm `SocialLoginButtons` (render theo flag `import.meta.env.VITE_ENABLE_GOOGLE_LOGIN`) vào `AuthPage` (không đặt ở trang staff). `api/oauth-api.ts` và `useGoogleLoginMutation` sẽ thêm vào `auth-queries.ts`, cuối cùng cũng `setQueryData(me, user)` như login thường.
   - Khi có OAuth redirect: thêm route callback `/auth/callback` trong `features/auth/pages/` (gọi `me`, sau đó điều hướng). Không thêm gì khác bây giờ — **không** cài thư viện Google khi chưa thảo luận.
8. **Import:** cập nhật mọi nơi dùng `useAuth`/`usePermission`/`Can` (`admin-header`, `user-menu`, `admin-sidebar`, `lib/nav.ts`, routes, `sidebar`, `mobile-header`, `profile-page`, `chat-page`…) sang `@/features/auth/...`. Luật mục 3 được nới: các feature admin/moderation được import `@/features/auth`.
9. **Kiểm tra thủ công:**
   - DevTools → Application: `accessToken`/`refreshToken` là HttpOnly; `sessionStorage`/`localStorage` không còn token/session.
   - User thường vào `/admin` ⇒ về `/admin/login` (chưa đăng nhập) hoặc `/admin/403` (đã đăng nhập).
   - Moderator ⇒ `/admin/reports`; admin ⇒ `/admin/dashboard`; đăng nhập `USER` ở `/admin/login` bị từ chối và đã logout.
   - Reload trang giữ phiên (nhờ `me`); hết hạn access ⇒ refresh tự động; refresh hỏng ⇒ về trang login tương ứng kèm `from`; logout xoá cookie + cache; tab thứ hai không bị kẹt.
   - Admin đăng nhập ở `/login` hoạt động theo quyết định ở mục 2.
10. **Test:** cập nhật test auth hiện có; thêm test cho `permissionsForRole`, guard (`RequireAuth` redirect đúng `loginPath`), `LoginForm` (`allowedRoles`), và mapping `ApiError` → lỗi field.

> Lưu ý backend (không thuộc refactor FE, chỉ để team biết): `SameSite=Lax` + cookie `Path=/` ổn nếu FE và gateway cùng site; khác origin khi dev cần CORS `allowCredentials=true` + origin cụ thể (đã có `X-Requested-With`). Production nên bật `app.security.cookie-secure=true`. Cân nhắc cookie `refreshToken` giới hạn `Path=/user/auth` để giảm bề mặt gửi token. `AuthController.refresh/logout` còn nhận token từ body (tiện cho client không phải trình duyệt) — FE không dùng.


**Bước 2 – Shared API client**
1. `git mv src/lib/api.ts src/lib/api-client.ts`.
2. `grep -rn "createApiClient\|from '@/lib/api'"`; nếu `api`/`createApiClient` (fetch) không ai dùng → xoá. Cập nhật import `@/lib/api` → `@/lib/api-client`.
3. Không đổi interceptor refresh token.

**Bước 3 – Feature `chat`**
1. Tạo `features/chat/{api,components,hooks,mocks,pages,types}`.
2. `git mv` theo bảng 4.2 (đổi `avatar.tsx` → `chat-avatar.tsx`, cập nhật các import tới nó).
3. Chuyển type `ChatMessage`, `Conversation`… từ `mock-chat.ts` sang `types/chat.ts` (re-export tạm trong mock nếu cần để diff nhỏ), sau đó sửa import cho trỏ về `types`.
4. Nếu `chat-page.tsx` đang gọi `chatApi` + state thủ công, **không** viết lại ở bước này; chỉ ghi chú TODO "chuyển sang `chat-queries.ts`" (làm ở PR riêng).
5. Cập nhật `App.tsx`/`router`: `import { ChatPage } from '@/features/chat/pages/chat-page'`.
6. Cập nhật mọi test chat (`layout.test.tsx`…) và `vi.mock` path.

**Bước 4 – Dọn feature `post` & dùng chung**
1. Với từng cặp file trùng ở mục 4.4: `grep` nơi import → chuyển hết về bản kebab-case → xoá bản còn lại.
2. Đổi tên file PascalCase còn lại sang kebab-case (`git mv` hai bước nếu Windows không phân biệt hoa/thường: `git mv Post.ts tmp.ts && git mv tmp.ts post.ts`).
3. Chuyển `create-post-*`, `posts-context`, `mock-nearby` theo bảng 4.3.
4. `git mv src/lib/nav.ts src/components/layout/nav.ts`, `theme-provider.tsx` vào `components/layout/`; sửa import (kể cả `components/ui/sonner.tsx` – đây là ngoại lệ đã được phép sửa).

**Bước 5 – `app/` và `App.tsx`**
- Tạo `app/providers.tsx`, `app/router.tsx` như mục 4.6. Kết quả render/route phải y hệt trước.

**Bước 6 – (Tuỳ chọn) Giai đoạn 2** theo bảng 4.5 – chỉ làm khi 0–5 đã merge.

**Bước 7 – Cập nhật tài liệu**
- Sửa `AGENTS.md`: quy tắc 5 ("Trang mới → `src/features/<tên>/pages/`", route khai báo trong `app/router.tsx`, nav trong `components/layout/nav.ts`), quy tắc 8 (HTTP qua `lib/http-client.ts`; ngoại lệ `lib/api-client.ts` cho cookie-refresh), thêm mục 3 của tài liệu này.
- Cập nhật `README.md`, `frontend-project-structure.md`, `docs/architecture.md` cho khớp cấu trúc mới.

### Điều agent KHÔNG được làm
- Không sửa `src/components/ui/*` (ngoại lệ `sonner.tsx` đã ghi).
- Không đổi logic, UI, tên route, queryKey, props công khai; không nâng/thêm thư viện.
- Không động vào `features/admin`, `features/moderation`, `features/admin-moderation` ngoài việc sửa import bị ảnh hưởng.
- Không tạo barrel `index.ts` hàng loạt, không tạo thư mục rỗng "cho đẹp".
- Không gộp nhiều bước vào 1 commit; không bỏ qua test fail bằng cách xoá test.

### Tiêu chí hoàn thành (Definition of Done)
- [ ] `npx tsc -b`, `npm run lint`, `npm test`, `npm run build` đều sạch/pass.
- [ ] `src/pages/`, `src/types/` (chat/auth), `lib/chat-api.ts`, `lib/use-chat-socket.ts`, `lib/mock-chat.ts`, `lib/auth-context.tsx`, `components/chat*` không còn tồn tại.
- [ ] Không còn file trùng/PascalCase trong `features/post`.
- [ ] `grep -rn "@/lib/\(auth-context\|chat-api\|use-chat-socket\|mock-chat\|api'\)" src` → không có kết quả.
- [ ] Chạy thủ công: đăng nhập/đăng ký, đăng xuất, mở `/messages` (gửi tin, tạo nhóm, báo cáo), `/`, `/search`, `/posts/:id`, `/profile`, `/admin/*` đều hoạt động như cũ.
- [ ] `AGENTS.md` và README phản ánh cấu trúc mới.

---

## 6. Lưu ý / quyết định cần team xác nhận

1. **Auth: HỢP NHẤT** (đã chốt vì backend dùng chung 1 API login/logout cho user, admin, moderator). Xoá `features/admin-moderation/auth/*` và `api/auth.*`, dùng chung `features/auth`. Xem **Bước 1b** bên dưới.
2. **`posts-context` (mock)**: giữ tạm trong `features/post/context`, lên kế hoạch thay bằng TanStack Query khi API post sẵn sàng.
3. **`components/shared`** chỉ tạo khi có component thật sự dùng ≥ 2 feature (ví dụ `user-avatar` của post và `chat-avatar` có thể gộp sau).
4. Nếu muốn ràng buộc luật import bằng tooling: thêm `eslint-plugin-boundaries` hoặc `no-restricted-imports` (cấm `components|lib|hooks` import `@/features/*`) – nên làm sau khi refactor xong.
