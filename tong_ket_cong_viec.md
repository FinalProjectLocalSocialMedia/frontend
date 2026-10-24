# CÔNG VIỆC PHA 2 ADMIN-MOD

### 1. Những phần việc đã thực hiện

#### 1.1. Kiểu dữ liệu, Hằng số & Nhãn tiếng Việt ([`src/features/admin-moderation/lib/`](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/src/features/admin-moderation/lib/))
- **`types.ts`**: Toàn bộ interface/type bám sát [db_schema.sql](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/backend/db_schema.sql) (UUID, ISO timestamp, `Role` = `'ADMIN' | 'MODERATOR' | 'NORMAL_USER'`, `StaffRole`, `StaffRef`, `SanctionRecord`, `LockInfo`, `ReportListItem`, `AuditLog`, `AppNotification`,...).
- **`constants.ts`**: `ADMIN_BASE = '/admin'`, `ADMIN_SESSION_KEY`, `PAGE_SIZE_OPTIONS = [10, 20, 50, 100]`, `DEFAULT_PAGE_SIZE = 10`, `TEXT_MAX_LENGTH = 255`, `REPORT_REASONS`.
- **`labels.ts`**: Map nhãn tiếng Việt cho toàn bộ trạng thái, vai trò, loại báo cáo, loại chế tài, hành động audit (`initialsOf` cho avatar fallback).
- **`nav.ts`**: Danh mục menu `ADMIN_NAV` phân nhóm kiểm duyệt & quản trị, kèm hàm `resolveAdminRedirect(from, role)` điều hướng an toàn sau đăng nhập.
- **`use-url-table-state.ts`**: Đồng bộ trạng thái bảng (`page`, `pageSize`, `sort`, query params) lên URL search params để hỗ trợ deep-link.
- **`use-page-title.ts`**: Đồng bộ tiêu đề tab trình duyệt dạng `<Tên trang> · nearby. Admin` (hỗ trợ cờ `enabled`).

#### 1.2. Xác thực & Phân quyền ([`src/features/admin-moderation/auth/`](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/src/features/admin-moderation/auth/))
- **`permissions.ts`**: Danh sách quyền chi tiết, bảng ánh xạ `ROLE_PERMISSIONS` (Admin sở hữu toàn quyền, Moderator sở hữu quyền kiểm duyệt báo cáo và tài khoản vi phạm), `defaultRouteForRole` (Admin → `dashboard`, Moderator → `reports`).
- **`auth-events.ts`**: Bộ phát sự kiện `unauthorized` dùng chung.
- **`session-storage.ts`**: Lưu trữ và khôi phục thông tin phiên staff an toàn qua `sessionStorage`.
- **`auth-context.tsx`**: `AuthProvider` khôi phục phiên tức thì, revalidate qua `authService.me()`, tự động đăng xuất và toast cảnh báo khi gặp lỗi 401, xóa cache `queryClient`.
- **`guards.tsx`**: `RequireAuth` (chuyển hướng về `/admin/login?from=...`), `RequirePermission` (chuyển hướng `/admin/403`), `Can` (ẩn/hiện UI theo quyền), `AdminIndexRedirect` (tự chuyển hướng về trang chủ theo vai trò).

#### 1.3. Mock Server & Service Layer ([`src/features/admin-moderation/api/`](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/src/features/admin-moderation/api/))
- **`http-client.ts`**: `adminHttp` với `withCredentials: true`, timeout 15s, gắn interceptor phát sự kiện `unauthorized`.
- **`query-client.ts`**: `createAdminQueryClient` độc lập, cache 5 phút, retry 1 lần (trừ mã 401/403/404).
- **Mock DB**: Hệ thống cơ sở dữ liệu in-memory mô phỏng server, seed dữ liệu xác định (neo mốc thời gian `2026-10-19T09:00:00Z`):
  - Tài khoản Admin: `admin@nearby.local` (mật khẩu `Passw0rd!`)
  - Tài khoản Moderator: `moderator@nearby.local` & `moderator2@nearby.local` (mật khẩu `Passw0rd!`)
  - Tài khoản Khoá: `locked@nearby.local` (trả về lỗi `ACCOUNT_LOCKED`)
  - Người dùng thường: `user@nearby.local` (trả về lỗi `NOT_STAFF`)
  - Cơ chế cookie giả lập trong sessionStorage (`nearby-admin-mock-cookie`), giữ phiên sau khi refresh trình duyệt.
- **Services & Queries**: `auth`, `notifications` (đếm chưa đọc, danh sách thông báo, đánh dấu đã đọc), `audit`, `shell` (đếm báo cáo `PENDING`).

#### 1.4. Bộ Component giao diện Quản trị ([`src/features/admin-moderation/components/`](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/src/features/admin-moderation/components/))
- **`DateTime`**: Hiển thị thẻ `<time>` tiếng Việt (`date-fns/locale/vi`), hỗ trợ dạng tương đối/tuyệt đối.
- **`CopyId`**: Rút gọn UUID, sao chép vào bộ nhớ tạm kèm icon phản hồi và toast.
- **`EmptyState`** & **`ErrorState`**: Trạng thái rỗng và khối cảnh báo lỗi kèm nút Thử lại.
- **`PageHeader`**: Tiêu đề trang chuẩn chứa duy nhất 1 thẻ `<h1>` và đồng bộ `document.title`.
- **`StatCard`**: Thẻ thống kê chỉ số và xu hướng.
- **`StaffCell`**: Hiển thị avatar chữ cái đầu, email và vai trò nhân viên.
- **`StatusBadge`**: Huy hiệu trạng thái với màu design token và nhãn tiếng Việt cho user, report, post, role, sanction.
- **`ConfirmDialog`**: Hộp thoại xác nhận bất đồng bộ kèm `Spinner`.
- **`ReasonDialog`**: Hộp thoại nhập lý do/ghi chú (RHF + zod + `useWatch` đếm ký tự $\le 255$, form reset sạch khi mở lại).
- **`DataTable`**: Bảng dữ liệu tự xây dựng (không dùng thư viện ngoài để tương thích tối đa với React Compiler), hỗ trợ click sắp xếp tiêu đề (`aria-sort`), dòng skeleton loading, phân trang và chọn số bản ghi mỗi trang.
- **`AdminThemeToggle`**: Chuyển đổi theme cục bộ bằng `useTheme` từ `@/components/theme-provider`, tuân thủ quy tắc phụ thuộc 5.2.
- **`NotificationBell`**: Chuông thông báo hiển thị số lượng chưa đọc, Popover 5 thông báo mới nhất, nút đánh dấu tất cả đã đọc.
- **`UserMenu`**: Dropdown menu nhân viên đang đăng nhập, hiển thị email, vai trò và nút Đăng xuất.
- **`AdminSidebar`**: Sidebar icon-collapsible, tự động lọc menu theo quyền, huy hiệu số lượng báo cáo `PENDING`, tự đóng sheet trên mobile khi chuyển trang.
- **`AdminHeader`**: Thanh trên cùng chứa `SidebarTrigger`, `Breadcrumb` tự động phân tích đường dẫn và các tiện ích góc phải.
- **`AdminLayout`**: Layout chính bao bọc `SidebarProvider`, `AdminSidebar`, `AdminHeader` và `<main>` (`SidebarInset`).
- **`ComingSoon`**: Trang placeholder cho các pha tiếp theo (Pha 3 đến 10).

#### 1.5. Các Trang & Định tuyến ([`src/features/admin-moderation/pages/`](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/src/features/admin-moderation/pages/))
- **`login-page.tsx`**: Trang đăng nhập quản trị (thẻ `<h1>` duy nhất, RHF + zod, bắt lỗi chi tiết `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `NOT_STAFF`, lỗi kết nối mạng, redirect tự động nếu đã có phiên).
- **`forbidden-page.tsx`**: Trang 403 khi tài khoản không đủ quyền truy cập.
- **`admin-not-found-page.tsx`**: Trang 404 cho các route không tồn tại trong khu vực `/admin/*`.
- **`src/routes/admin-routes.tsx`**: Root route cho khu vực quản trị, phân luồng bảo vệ và lazy loading.
- **`src/App.tsx`**: Khai báo route lazy `path="admin/*"` tách biệt hoàn toàn khỏi `AppLayout` người dùng.

#### 1.6. Cập nhật tài liệu & Kế hoạch
- Bổ sung CSS variables `--color-sidebar*` và tokens `--sidebar*` trong [src/index.css](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/src/index.css).
- Cập nhật tài liệu hướng dẫn và tài khoản thử nghiệm trong [README.md](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/README.md).
- Chuẩn hoá các tham chiếu kiểu `'USER'` thành `'NORMAL_USER'` và đánh dấu hoàn thành Pha 2 trong [admin-moderator-plan.md](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/docs/admin-moderator-plan.md).

---

### 2. Kết quả kiểm thử & xác minh

- **TypeScript** (`npx tsc -b`): **Thành công 100%**, không có bất kỳ lỗi type nào.
- **Lint** (`npm run lint`): **Thành công 100%**, 0 lỗi, 0 cảnh báo, tuân thủ nghiêm ngặt quy tắc phụ thuộc 5.2 và React Compiler rules.
- **Vitest** (`npm test`): **27/27 test đã có đều passed** (không viết thêm test mới theo ghi chú trong `notes.txt`).
- **Production Build** (`npm run build`): **Thành công**, tách code-splitting hoàn toàn thành 2 bundle riêng biệt:
  - `dist/assets/index-CrwPUT6_.js` (User bundle: 670.65 kB / gzip: 216.75 kB)
  - `dist/assets/admin-routes-71vXgiOn.js` (Admin bundle: 566.70 kB / gzip: 178.01 kB — ứng dụng người dùng không phải tải chunk này).


  Viewed shell.service.ts:1-13
Viewed shell.http.ts:1-15
Viewed shell.mock.ts:1-13
Viewed shell.queries.ts:1-15

Mô hình 4 file (`.service.ts`, `.http.ts`, `.mock.ts`, `.queries.ts`) được thiết kế theo kiến trúc **Ports and Adapters (Clean Architecture)** và quy ước kiến trúc tại mục **5.4** & **9** của [admin-moderator-plan.md](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/docs/admin-moderator-plan.md).

---

### 1. Tại sao cần tách 4 file?

1. **Phân tách trách nhiệm (Separation of Concerns):**
   - **UI Component** không bao giờ quan tâm dữ liệu đến từ đâu, không tự ý gọi `axios` hay gọi DB mock. Component chỉ gọi custom hook.
   - Khi backend hoàn thiện API thật, chỉ cần đổi cờ `VITE_USE_MOCK=false` (hoặc sửa URL trong `.http.ts`), **toàn bộ UI và Logic Component không phải sửa một dòng nào**.
2. **Tuân thủ quy tắc ESLint & Clean Code:**
   - Quy ước kiến trúc quy định: *chỉ duy nhất các file `*.http.ts` được phép import `adminHttp`/`axios`*.
3. **Quản lý Cache & Lifecycle tập trung:**
   - TanStack Query (`*.queries.ts`) quản lý polling, cache, invalidation và hủy request (`AbortSignal`) riêng biệt, không để lộn xộn trong logic gọi mạng.

---

### 2. Nhiệm vụ của từng file

| Tên file | Tầng vai trò | Nhiệm vụ chính |
|---|---|---|
| `*.service.ts` | **Port / Contract & Switch** | - Khai báo `interface` (hợp đồng dữ liệu) chuẩn mà module cung cấp.<br>- Đọc cờ `USE_MOCK` để quyết định export bản Mock hay bản HTTP thật. |
| `*.http.ts` | **Real Adapter (HTTP API)** | - Hiện thực `interface` bằng cách gọi API backend thật qua [adminHttp](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/src/features/admin-moderation/api/http-client.ts) (Axios).<br>- Định nghĩa endpoint, method, query params và format DTO từ server. |
| `*.mock.ts` | **Mock Adapter (In-memory Server)** | - Hiện thực `interface` bằng cách thao tác trên cơ sở dữ liệu in-memory [mockDb](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/src/features/admin-moderation/api/mock/db.ts).<br>- Giả lập độ trễ mạng (`mockDelay`), kiểm tra phiên/quyền (`requirePermission`), ném lỗi HTTP chuẩn (`ApiError`). |
| `*.queries.ts` | **React Query / Hook Layer** | - Định nghĩa `queryKey` dùng cho cache và invalidate.<br>- Bọc hàm service vào các React hook (`useQuery`, `useMutation`).<br>- Cấu hình polling định kỳ (`refetchInterval`), caching, `enabled`. |

---

### 3. Ví dụ thực tế với module `shell`

Mục tiêu của module `shell` là cung cấp số lượng báo cáo chờ xử lý (`PENDING`) để hiển thị huy hiệu (badge) trên Sidebar admin.

#### Bước 1: [shell.service.ts](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/src/features/admin-moderation/api/shell.service.ts) — Định nghĩa hợp đồng
```ts
// 1. Định nghĩa khuôn mẫu (hàm trả về Promise<number>)
export interface ShellService {
  pendingReportCount(o?: RequestOptions): Promise<number>
}

// 2. Chuyển đổi giữa mock và API thật dựa vào biến môi trường
export const shellService: ShellService = USE_MOCK ? mockShellService : httpShellService
```

#### Bước 2: [shell.http.ts](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/src/features/admin-moderation/api/shell.http.ts) — Triển khai gọi Backend thật
```ts
export const httpShellService: ShellService = {
  pendingReportCount: (o) =>
    adminHttp
      .get<Paginated<ReportListItem>>('/reports', {
        params: { status: 'PENDING', pageSize: 1 },
        signal: o?.signal,
      })
      .then((r) => r.data.total), // Lấy trường total từ response của backend
}
```

#### Bước 3: [shell.mock.ts](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/src/features/admin-moderation/api/shell.mock.ts) — Triển khai giả lập Server
```ts
export const mockShellService: ShellService = {
  async pendingReportCount(o) {
    await mockDelay(o?.signal)           // Giả lập độ trễ mạng ngẫu nhiên 200-500ms
    requirePermission('reports.read')    // Kiểm tra nhân viên hiện tại có quyền xem báo cáo không
    return mockDb.reports.filter((r) => r.status === 'PENDING').length // Đếm trực tiếp trong mockDb
  },
}
```

#### Bước 4: [shell.queries.ts](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/src/features/admin-moderation/api/shell.queries.ts) — Đóng gói vào React Hook
```ts
export const shellKeys = {
  pendingReportCount: ['admin', 'shell', 'pending-report-count'] as const,
}

export const usePendingReportCount = (enabled = true) =>
  useQuery({
    queryKey: shellKeys.pendingReportCount,
    queryFn: ({ signal }) => shellService.pendingReportCount({ signal }),
    refetchInterval: 30_000, // Tự động kéo dữ liệu mới mỗi 30 giây
    enabled,
  })
```

#### Bước 5: Cách UI Component sử dụng ([admin-sidebar.tsx](file:///d:/hoc%20tap%20ptit/graduation%20sem/code/frontend/src/features/admin-moderation/components/admin-sidebar.tsx))
Trong giao diện Sidebar, component chỉ cần gọi 1 dòng hook duy nhất:
```tsx
const { data: pendingReportCount = 0 } = usePendingReportCount(!!user)
// tại sao lại dùng !!user 
/* 
 Để ép 1 kiểu dữ liệu về kiểu boolean chuẩn:
 - user có thể là null/undefined => !user = true => !!user = false
 - user có thể là UserEntity => !user = false => !!user = true
*/


// Hiển thị badge nếu có báo cáo
{item.badge === 'pendingReports' && pendingReportCount > 0 && (
  <SidebarMenuBadge>{pendingReportCount}</SidebarMenuBadge>
)}
```
Component hoàn toàn trong sáng: không có logic gọi mạng, không `axios`, không `try/catch` lộn xộn, tự động re-render và tự động cache theo cơ chế của TanStack Query.