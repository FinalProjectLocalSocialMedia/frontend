# Kế hoạch triển khai giao diện Moderator & Admin (bản 4)

> Dành cho **người** (chốt quyết định, chuẩn bị) và **AI agent** (code theo từng pha). Đọc kèm [AGENTS.md](../AGENTS.md), [architecture.md](architecture.md), [ui-guidelines.md](ui-guidelines.md).
>
> **Bản 4 thay đổi so với bản 3:**
> 1. **Báo cáo không có mức ưu tiên (priority)** (D14 đã chốt): bỏ cột, bộ lọc, sắp xếp, huy hiệu ưu tiên và thông báo "nâng ưu tiên". Hàng đợi sắp xếp theo thời gian.
> 2. **Schema đã chốt** trong **`db_schema.sql` bản 2** (kèm theo, đã nạp và kiểm thử trên PostgreSQL 16): thêm bảng **`account_sanctions`** (S3), `posts.content` là **TEXT** không giới hạn 255 ký tự (S10), và hiện thực các giả định S1–S12 còn lại.
> 3. Mọi quyết định khác giữ mặc định.
>
> **Phạm vi:** frontend, chạy bằng **mock** có hình dạng giống backend. Mọi truy cập dữ liệu đi qua lớp `service` để đổi sang API thật mà không sửa UI.

---

## 0. Cách dùng tài liệu

1. Người: đọc **mục 1** (quyết định) và **mục 2** (schema đã chốt — khớp `db_schema.sql` bản 2; đặt file này vào repo, ví dụ `docs/db_schema.sql`, để agent đối chiếu), chạy lệnh ở **mục 3**, commit.
2. Agent: làm **từng pha** ở mục 8, mỗi pha một PR. Không làm vượt pha.
3. Sau mỗi pha: `npx tsc -b && npm test && npm run build` (và `npm run lint` từ Pha 1), rồi cập nhật bảng "Trạng thái" cuối file.

---

## 1. Quyết định cần chốt (kèm mặc định)

Agent **dùng mặc định** nếu chưa có trả lời. Đổi quyết định thì sửa ngay bảng này.

| # | Câu hỏi | Mặc định | Ghi chú |
|---|---|---|---|
| D1 | Admin chung app hay tách app? | **Chung một app Vite**, prefix `/admin/*` (hằng số `ADMIN_BASE`), `React.lazy` | Tách app riêng an toàn hơn khi deploy nhưng tốn công |
| D2 | Quan hệ quyền | **Admin ⊇ Moderator** | |
| D3 | Thư viện bản đồ | **`@vis.gl/react-google-maps`** (nếu bạn định dùng `@react-google-maps/api` hãy báo; thiết kế giữ nguyên) | Heatmap: D16 |
| D4 | Data fetching | **TanStack Query** | |
| D5 | Form | **react-hook-form + zod** + `Field` của shadcn | Lưu ý React Compiler: dùng `useWatch`, không dùng `watch()` (D18) |
| D6 | Ngôn ngữ UI admin | **Tiếng Việt** | |
| D7 | Đơn vị báo cáo | 1 báo cáo = 1 người báo cáo × 1 đối tượng. **Xử lý một báo cáo xử lý luôn mọi báo cáo `PENDING` cùng `(target_type, target_id)`**, cảm ơn **tất cả** người báo cáo | |
| D8 | Khoá tài khoản | **Chỉ một kiểu khoá:** không thời hạn, kéo dài **đến khi được mở lại**. **Moderator và Admin đều khoá và mở khoá được.** Lý do khi khoá là bắt buộc; mở khoá có ghi chú tuỳ chọn. Mọi thao tác ghi audit | Lưu bằng bảng `account_sanctions` (S3). Cột `moderators.permission_level` còn trong DB (mặc định `LOCK`) nhưng **không dùng** (S11) |
| D9 | Ai tạo tài khoản moderator | **Chỉ Admin** (tạo `users` + dòng `moderators` với `granted_admin_id`, `granted_at`). Vai trò **không đổi** sau khi tạo (đơn giản hoá) | |
| D10 | Trạng thái báo cáo | `PENDING` "Chờ xử lý" · `RESOLVED` "Đã xử lý" (có vi phạm, đã áp dụng hành động) · `REJECTED` "Đã bác bỏ" (không vi phạm) | "Đã xử lý (Resolved)" trong yêu cầu = `RESOLVED` |
| D11 | Thông báo cho người dùng sau xử lý | Ghi vào `notifications`: `REPORT_RESULT` (cảm ơn người báo cáo), `WARNING` (cảnh báo), `ACCOUNT_LOCKED` (khoá) — đã có trong CHECK của `notifications` (S4) | UI phía người dùng: tuỳ chọn ở Pha 10 |
| D12 | Danh mục (topics) | **Loại khỏi phạm vi** — không có trang quản lý topics | `locations.location_type` chỉ là ô chọn/nhập ở trang Địa điểm |
| D13 | Tên hiển thị người dùng | Schema không có username/handle: người dùng thường dùng `normal_users.full_name`; moderator/admin hiển thị **email** | App người dùng đang dùng `@handle` (mock) — ngoài phạm vi |
| D14 | Mức ưu tiên báo cáo | **Không có.** Báo cáo không có và không hiển thị priority. Hàng đợi sắp xếp theo thời gian `reported_at`: **Cũ nhất trước** (mặc định cho `PENDING`, xử lý theo thứ tự đến) hoặc Mới nhất | Đã chốt (S2) |
| D15 | Xoá người dùng | Xoá **mềm** (`users.deleted_at`, S7); UI xử lý lỗi `409` | |
| D16 | Bản đồ nhiệt | `HeatmapLayer` gốc của Google **đã bị gỡ (Maps JS API v3.65, 05/2026)** → dùng **deck.gl** phủ lên Google Map qua `GoogleMapsOverlay` (`HeatmapLayer` + `H3HexagonLayer`) | Cần Map ID; xem 7.5 |
| D17 | HTTP client | **axios** — một instance dùng chung tạo bởi `createHttpClient` (`src/lib/http-client.ts`), thay file `src/lib/api.ts` (fetch, chưa được dùng) | Chuẩn hoá lỗi, huỷ request bằng `AbortSignal` (5.4) |
| D18 | React Compiler | **Bật cho toàn app** (không chỉ admin) ở Pha 1, kèm ESLint `eslint-plugin-react-hooks`. Dự án đang dùng Vite 6 + `@vitejs/plugin-react` 4.x → cấu hình qua `babel.plugins` | Quy ước viết code ở mục 9 |

---

## 2. Schema đã chốt (`db_schema.sql` bản 2)

File **`db_schema.sql` (bản 2, kèm theo)** hiện thực toàn bộ S1–S12 và bảng mới `account_sanctions`. File đã được nạp vào **PostgreSQL 16** và kiểm thử **47 kịch bản hành vi** (CHECK, UNIQUE, trigger, FK). *Chưa kiểm thử các cột `geography` và GIST index vì môi trường thử không có PostGIS.* Nếu DB thật của bạn khác file này, sửa mục 6 trước Pha 2.

| ID | Quyết định | Hiện thực trong SQL | Ảnh hưởng tới mục 6 / UI |
|---|---|---|---|
| S1 | `handled_at`, `resolution_note`, người xử lý là NULL khi `PENDING`; người xử lý là **moderator hoặc admin** | `reports.handle_moderator_id` **hoặc** `handle_admin_id` (FK `admins (user_id)`); KO CHECK tối đa một người xử lý (nếu 2 người xử lý thì hiện cả 2), và `PENDING` ⇒ chưa có `handled_*`, `RESOLVED/REJECTED` ⇒ có `handled_at`  | `handledAt?`, `handledBy?: StaffRef` (suy ra từ cột nào khác NULL) |
| S2 | **Không có priority**; lý do là một cột | `reports.reason varchar(255)`; không có cột priority/reason_code | Không có kiểu/trường/cột/bộ lọc ưu tiên; `reason: string` |
| S3 | Lưu lịch sử cảnh báo & khoá; **khoá không thời hạn** | Bảng **`account_sanctions`** (bên dưới) + trigger đồng bộ `users.status` | `SanctionRecord`, `LockInfo`, `stats.warnings` |
| S4 | Staff nhận được thông báo; thêm loại thông báo | `notifications.recipient → users (id)`; CHECK thêm `WARNING`, `ACCOUNT_LOCKED`, `REPORT_CREATED` (không có `REPORT_ESCALATED`) | `NotificationType`, `AppNotification` |
| S5 | Bình luận biết bài viết + có trạng thái | `comments.post_id NOT NULL`, `parent_comment_id` NULL, `status` (`ACTIVE`/`REMOVED`) | `CommentTarget.postId`, `status` |
| S6 | Trạng thái bài viết chuẩn; bài chia sẻ tường minh | `posts.status` CHECK (`ACTIVE`/`REMOVED`); `shared_post_id` NULL (CHECK không trỏ về chính nó) | `PostStatus`; `isShare = sharedPostId != null` |
| S7 | Xoá mềm người dùng | `users.deleted_at` | `deletedAt?` |
| S8 | Ràng buộc duy nhất | `users.email` (không phân biệt hoa thường) và `users.phone_number` duy nhất **trên tài khoản chưa xoá**; `system_configs.config_key` UNIQUE; chỉ **một báo cáo `PENDING`** cho mỗi `(reporter, target_type, target_id)` | Lỗi `409/422` theo trường |
| S9 | Địa điểm | Không thêm `is_active`; xoá địa điểm còn bài viết bị FK chặn | Dialog xử lý `409` |
| S10 | Nội dung bài viết dài | **`posts.content` kiểu `TEXT`** (không giới hạn 255); `comments.content` vẫn `varchar(255)` | UI cắt gọn + "Xem thêm" |
| S11 | `permission_level` | Giữ cột + CHECK (`WARN`,`LOCK`), thêm `DEFAULT 'LOCK'`; **không dùng** trong UI/phân quyền | Không có `permissionLevel` trong DTO |
| S12 | Không đổi | `system_configs` vẫn key–value chuỗi ≤ 255; `location_type` tự do; `audit_logs` như cũ | Registry khoá cấu hình ở FE (7.7) |

### Bảng `account_sanctions` (S3)

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid → `users (id)` | Người bị xử lý |
| `type` | `'WARN'` \| `'LOCK'` | Cảnh báo hoặc khoá |
| `reason` | varchar(255) | WARN: nội dung cảnh báo gửi cho người dùng · LOCK: lý do khoá |
| `report_id` | uuid → `reports (id)`, NULL | Báo cáo dẫn tới xử lý (nếu có) |
| `issued_by`, `issued_at` | uuid → `users (id)`, timestamptz | Moderator/admin thực hiện, thời điểm |
| `lifted_at`, `lifted_by`, `lift_note` | timestamptz, uuid → `users (id)`, varchar(255) | Chỉ cho LOCK. **`lifted_at IS NULL` = đang bị khoá** |

- Khoá **không có hạn**. Mỗi người dùng có **tối đa một khoá đang hiệu lực** (unique index một phần).
- WARN không được có `lifted_*`; đã mở khoá thì phải có cả `lifted_at` và `lifted_by`.
- Trigger `sync_user_lock_status`: thêm LOCK → `users.status = 'LOCKED'`; điền `lifted_at` → `'ACTIVE'`. **Không `UPDATE users.status` trực tiếp** khi khoá/mở khoá — chỉ ghi `account_sanctions`.
- Dùng cho UI: `stats.warnings` = số bản ghi WARN · `lock` = bản ghi LOCK chưa `lifted_at` · "Lịch sử kiểm duyệt" = toàn bộ bản ghi.

### Quy ước dữ liệu cần nhớ
- **Người xử lý báo cáo:** ghi `handle_moderator_id` (moderator) hoặc `handle_admin_id` (admin) — đúng một cột; DTO gộp thành `handledBy`.
- **Xoá mềm:** danh sách mặc định lọc `users.deleted_at IS NULL`; email/SĐT của tài khoản đã xoá có thể được dùng lại.
- **Bài viết dài:** `posts.content` có thể rất dài → bảng chỉ hiện đoạn đầu, chi tiết cuộn/"Xem thêm".
- **Thông báo staff:** mỗi báo cáo mới tạo một dòng `REPORT_CREATED` cho **từng** moderator/admin (`reference_target_id` = id báo cáo).

---

## 3. Việc cần làm TRƯỚC khi agent bắt đầu

### 3.1. shadcn components cần `add`

Đang có: `avatar badge button dialog dropdown-menu input select separator sheet sonner tabs textarea toggle`.

(các phần code add components bên dưới đã được chạy)
```bash
# Khung admin & điều hướng
npx shadcn@latest add sidebar breadcrumb collapsible tooltip scroll-area popover skeleton

# Hiển thị dữ liệu, trạng thái
npx shadcn@latest add table card pagination alert alert-dialog empty spinner progress chart

# Form & nhập liệu
npx shadcn@latest add label field checkbox switch radio-group combobox calendar input-group toggle-group slider
```


- `sidebar` kéo thêm phụ thuộc (sheet, tooltip, skeleton, hook `use-mobile`…); chỉ ghi đè file trùng nếu bạn chưa tuỳ biến.
- `chart` cài `recharts`. Date picker = `calendar` + `popover`. "Data Table" là mẫu ghép `table` + `@tanstack/react-table`, **không** `add`.
- Không sửa tay `src/components/ui/*`. Thiếu component thì dừng và báo, đừng tự viết.

### 3.2. Thư viện npm (cần bạn đồng ý — AGENTS.md cấm tự thêm)

(các phần code npm i đã được chạy)
```bash
# Runtime
npm i axios
npm i "@tanstack/react-query" "@tanstack/react-table" "react-hook-form" "zod" "@hookform/resolvers" "date-fns"
npm i "@vis.gl/react-google-maps" "h3-js"
npm i "@deck.gl/core" "@deck.gl/layers" "@deck.gl/aggregation-layers" "@deck.gl/geo-layers" "@deck.gl/google-maps"

# Dev
npm i -D "@types/google.maps" "babel-plugin-react-compiler"
npm i -D "eslint" "typescript-eslint" "eslint-plugin-react-hooks"
```

| Gói | Dùng cho |
|---|---|
| `axios` | HTTP client duy nhất (D17) |
| `@tanstack/react-query`, `@tanstack/react-table` | Fetch/cache/mutation; bảng sắp xếp-lọc-phân trang kiểu server |
| `react-hook-form`, `zod`, `@hookform/resolvers`, `date-fns` | Form + validate; format ngày (locale `vi`) |
| `@vis.gl/react-google-maps` | Google Map trong React (`APIProvider`, `Map`, `AdvancedMarker`, `useMap`) |
| `@deck.gl/*` | Heatmap & ô H3 phủ lên Google Map — **bắt buộc** vì `HeatmapLayer` gốc của Google đã bị gỡ |
| `h3-js` | `cellToParent`, tâm/đa giác ô, xem trước `h3Index` từ toạ độ |
| `babel-plugin-react-compiler` | React Compiler (D18) |
| `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks` | Lint + luật của compiler (`react-hooks/*`, kể cả `incompatible-library`) + chặn import sai hướng (5.2) |

*(Tuỳ chọn, test lớp HTTP)*: `axios` cho phép truyền `adapter` tuỳ biến nên có thể test không cần thêm gói; nếu muốn tiện hơn dùng `axios-mock-adapter` (cần đồng ý).

### 3.3. Google Maps — thiết lập (phần này tôi sẽ thiết lập sau)
1. Tạo API key (bật **Maps JavaScript API**), **giới hạn theo HTTP referrer**, bật billing.
2. Tạo **Map ID** (bắt buộc cho `AdvancedMarker`; vector map nếu muốn xoay/nghiêng).
3. `.env.example`:
   ```
   VITE_USE_MOCK=true
   VITE_API_BASE_URL=http://localhost:8080
   VITE_GOOGLE_MAPS_API_KEY=
   VITE_GOOGLE_MAPS_MAP_ID=
   ```
4. Không commit key thật.

### 3.4. React Compiler (đã bật)

Dự án đang dùng **Vite 6.4 + `@vitejs/plugin-react` 4.7 + React 19**, nên dùng cấu hình `babel.plugins` (compiler phải đứng **đầu** danh sách plugin Babel; React 19 không cần gói runtime):

```ts
// vite.config.ts
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react({ babel: { plugins: [['babel-plugin-react-compiler', {}]] } }), tailwindcss()],
  // … giữ nguyên alias và cấu hình test
})
```
- Vitest dùng chung plugin → **test chạy trên code đã qua compiler** (tốt: bắt lỗi sớm).
- Nếu sau này nâng lên **Vite 8 / `@vitejs/plugin-react` 6**: tuỳ chọn `babel` bị bỏ; dùng `reactCompilerPreset` của plugin kèm `@rolldown/plugin-babel`.
- Nếu một component gây lỗi: sửa theo Rules of React; chỉ khi bất khả kháng mới thêm `'use no memo'` (kèm comment lý do). Có thể tạm chuyển `compilationMode: 'annotation'` để bật dần từng nơi.

### 3.5. Việc nhỏ khác
- (Tuỳ chọn) `vercel.json` rewrite SPA — `/admin/*` cần fallback `index.html`.

---

## 4. Vai trò & quyền

Vai trò **không có cột riêng**: suy ra từ bảng con của `users` — có dòng trong `admins` → `ADMIN`; trong `moderators` → `MODERATOR`; trong `normal_users` → `USER`. API `/admin/auth/me` trả `role`. Quyền là chuỗi `domain.action`; UI chỉ **phản chiếu** (ẩn/khoá), **backend mới cưỡng chế**.

| Quyền | Moderator | Admin | Dùng cho |
|---|:-:|:-:|---|
| `reports.read` · `reports.resolve` | ✅ | ✅ | Xem và xử lý báo cáo (nội dung & người dùng) |
| `content.remove` | ✅ | ✅ | Hành động "Xoá nội dung" |
| `users.warn` | ✅ | ✅ | Gửi cảnh báo |
| `users.lock` · `users.unlock` | ✅ | ✅ | Khoá / mở khoá (không thời hạn) |
| `accounts.read.flagged` | ✅ | ✅ | Danh sách tài khoản vi phạm |
| `notifications.read` | ✅ | ✅ | Thông báo quản trị |
| `users.read` · `users.create` · `users.update` · `users.delete` | ❌ | ✅ | CRUD người dùng (gồm tạo moderator, D9) |
| `users.pii.read` | ❌ | ✅ | Xem email, số điện thoại, ngày sinh (moderator chỉ thấy tên hiển thị) |
| `content.analytics` · `locations.manage` · `heatmap.view` · `settings.manage` · `audit.read` | ❌ | ✅ | Thống kê, địa điểm, bản đồ nhiệt, cấu hình, nhật ký audit |

Ràng buộc nghiệp vụ UI phải chặn và giải thích: không tự khoá/xoá chính mình; không xoá admin cuối cùng; moderator **không** tác động lên tài khoản `MODERATOR`/`ADMIN`; tài khoản đã `LOCKED` thì ẩn "Khoá", hiện "Mở khoá"; tài khoản `LOCKED` không đăng nhập được.

---

## 5. Kiến trúc & cấu trúc thư mục

### 5.1. Ba thư mục feature

```
src/
├─ lib/
│  └─ http-client.ts              # axios: createHttpClient, ApiError, isApiError (thay src/lib/api.ts)
├─ routes/
│  └─ admin-routes.tsx            # COMPOSITION ROOT: ghép layout + pages của 3 feature, lazy-load từ App.tsx
├─ components/map/                # Dùng chung với app người dùng: GoogleMapsProvider, LocationPicker, …
└─ features/
   ├─ admin-moderation/           # DÙNG CHUNG cho admin & moderation
   │  ├─ api/                     # http-client.ts (axios instance của admin), query-client.ts,
   │  │                           # mock/ (db, seed, latency), auth/notifications/audit service + queries
   │  ├─ components/              # AdminLayout, AdminSidebar, AdminHeader, NotificationBell, UserMenu,
   │  │                           # DataTable, PageHeader, StatusBadge, ConfirmDialog, ReasonDialog,
   │  │                           # EmptyState, ErrorState, StatCard, StaffCell, CopyId, DateTime,
   │  │                           # WarnDialog, LockDialog, UnlockDialog
   │  ├─ pages/                   # LoginPage, ForbiddenPage, AdminNotFoundPage, NotificationsPage
   │  ├─ auth/                    # AuthProvider, permissions.ts, guards.tsx (RequireAuth, RequirePermission, <Can>)
   │  └─ lib/                     # types.ts, labels.ts (tiếng Việt), constants.ts (ADMIN_BASE, REPORT_REASONS, POST_PREVIEW_CHARS…)
   ├─ moderation/                 # Việc của người kiểm duyệt (admin cũng dùng lại)
   │  ├─ api/                     # reports.service/.http/.mock/.queries · accounts.*
   │  ├─ components/              # reports/ (ReportFilters, ReportTable, ContentPreview, UserTargetCard,
   │  │                           #   ActionPanel, ResolveConfirmDialog, ReportTimeline) · accounts/ (FlaggedAccountsTable)
   │  └─ pages/                   # ReportsPage, ContentReportDetailPage, UserReportDetailPage, FlaggedAccountsPage
   └─ admin/                      # Việc riêng của admin
      ├─ api/                     # users · content-stats · locations · heatmap · settings · audit-logs
      ├─ components/              # users/ · content/ · locations/ · heatmap/ (HeatmapOverlay, CellPanel, Legend) · settings/ · audit/
      └─ pages/                   # DashboardPage, UsersPage, UserDetailPage, ContentOverviewPage,
                                  # LocationsPage, HeatmapPage, SettingsPage, AuditLogPage
```

Trong mỗi thư mục `api/ components/ pages/` chia module bằng **thư mục con hoặc tiền tố tên file** (ví dụ `components/users/…`, `api/users.service.ts`). Không thêm thư mục con cấp ngang ngoài `api / components / pages` (trừ `auth/`, `lib/` của `admin-moderation`).

### 5.2. Quy tắc phụ thuộc (bắt buộc; **kiểm bằng ESLint** `no-restricted-imports` từ Pha 1)

```
admin  ──►  moderation  ──►  admin-moderation
  └──────────────────────────────►┘
```
- `admin-moderation` **không** import từ `moderation` hay `admin`; `moderation` **không** import từ `admin`.
- `admin` được dùng lại thành phần của `moderation` và `admin-moderation`.
- App người dùng **không được** import gì từ `src/features/admin`, `src/features/moderation` hoặc `src/features/admin-moderation`; 
- các feature chỉ dùng được `components/ui`, `components/theme-provider`, `lib/utils`, `lib/http-client`, `components/map`.
- Chỉ `src/routes/admin-routes.tsx` biết cả ba feature (tránh vòng).

### 5.3. Route

```
/admin/login                       Đăng nhập (công khai)                                  [admin-moderation]
/admin                             → moderator: /admin/reports ; admin: /admin/dashboard
/admin/reports                     Danh sách báo cáo (tab Nội dung | Người dùng)          [moderation]   reports.read
/admin/reports/content/:id         Chi tiết + xử lý báo cáo nội dung                       [moderation]   reports.read
/admin/reports/users/:id           Chi tiết + xử lý báo cáo người dùng                     [moderation]   reports.read
/admin/accounts                    Tài khoản vi phạm                                       [moderation]   accounts.read.flagged
/admin/notifications               Thông báo                                               [admin-moderation] notifications.read
/admin/dashboard                   Tổng quan                                               [admin]        content.analytics
/admin/content                     Thống kê nội dung, trending, tóm tắt báo cáo           [admin]        content.analytics
/admin/users  · /admin/users/:id   Quản lý người dùng                                      [admin]        users.read
/admin/locations                   Địa điểm                                                [admin]        locations.manage
/admin/heatmap                     Bản đồ nhiệt                                            [admin]        heatmap.view
/admin/settings                    Cấu hình hệ thống                                       [admin]        settings.manage
/admin/audit-log                   Nhật ký audit                                           [admin]        audit.read
/admin/403   /admin/*              Không đủ quyền / 404 trong admin
```
- Bộ lọc/phân trang/sắp xếp nằm trên **URL search params**.
- `App.tsx`: `<Route path="/admin/*" element={<Suspense><AdminRoutes/></Suspense>}/>` với `React.lazy(() => import('@/routes/admin-routes'))`. Admin **không** dùng `AppLayout` của người dùng.
- Guard: `RequireAuth` (→ `/admin/login?from=…`), `RequirePermission` (→ `/admin/403`), `<Can permission>` cho nút/menu.

### 5.4. Lớp dữ liệu (mock-first) & HTTP bằng axios

```ts
// features/moderation/api/reports.service.ts
export interface ReportsService {
  list(p: ReportListParams, o?: RequestOptions): Promise<Paginated<ReportListItem>>
  get(id: Uuid, o?: RequestOptions): Promise<ReportDetail>
  resolve(id: Uuid, input: ResolveReportInput, o?: RequestOptions): Promise<ResolveReportResult>
}
type RequestOptions = { signal?: AbortSignal }
export const reportsService: ReportsService =
  import.meta.env.VITE_USE_MOCK === 'false' ? httpReportsService : mockReportsService
```

- Mỗi module trong `api/`: `<module>.service.ts` (interface + chọn mock/http), `<module>.http.ts` (axios), `<module>.mock.ts`, `<module>.queries.ts` (hook TanStack Query, khoá `['admin', <module>, …]`). `queryFn` truyền `signal` xuống service để **huỷ request cũ** (debounce heatmap, đổi bộ lọc).
- Mock **mô phỏng logic phía server**: lọc/sắp xếp/phân trang, gộp báo cáo cùng đối tượng (D7), đổi `posts.status`/`comments.status`, khoá/mở khoá, ghi `audit_logs`, tạo `notifications`, kiểm tra quyền/xung đột (`403`/`409`/`422`), độ trễ 200–500 ms. Mock db có **hình dạng bảng của schema** + hàm `toDto()` sang kiểu mục 6.
- Seed **xác định** (PRNG có seed; không `Math.random()`/`Date.now()`), có `resetMockDb()` cho test.
- JSON **camelCase**; **không bao giờ** trả `users.password`.
- Mọi màn hình xử lý đủ **loading** (`skeleton`) · **empty** (`empty`) · **error** (`alert` + thử lại) · **thành công** (`sonner`).

**Quy ước HTTP (axios).**

```ts
// src/lib/http-client.ts  (thay src/lib/api.ts)
export class ApiError extends Error {
  status: number                       // 0 = lỗi mạng/timeout
  code?: string                        // mã lỗi nghiệp vụ từ backend (nếu có)
  fieldErrors?: Record<string, string> // lỗi 422 theo trường → đổ vào react-hook-form (setError)
}
export function createHttpClient(opts: {
  baseURL: string; withCredentials?: boolean; timeout?: number
  getToken?: () => string | undefined      // nếu dùng Bearer (lưu trong bộ nhớ, KHÔNG localStorage)
  onUnauthorized?: () => void
}): AxiosInstance

// features/admin-moderation/api/http-client.ts
export const adminHttp = createHttpClient({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/admin`,
  withCredentials: true,               // cookie HttpOnly (ưu tiên)
  timeout: 15_000,
  onUnauthorized: () => authEvents.emit('unauthorized'),
})

// reports.http.ts
list: (params, o) => adminHttp.get('/reports', { params, signal: o?.signal }).then(r => r.data)
```
- **Interceptor phản hồi:** chuẩn hoá mọi lỗi thành `ApiError` (HTTP status; `data.code`/`data.message`/`data.errors` — **hình dạng lỗi chốt với backend**); lỗi mạng/timeout → `status 0`; request bị huỷ (`axios.isCancel`) thì **ném lại nguyên trạng**, không hiện toast.
- **`401`** → gọi `onUnauthorized` (AuthProvider đăng xuất + toast "Phiên đăng nhập hết hạn"), **trừ** endpoint đăng nhập (tránh vòng lặp).
- Mảng trong query string serialize dạng lặp khoá (`paramsSerializer: { indexes: null }`) — chốt với backend.
- Không log body request/response (có PII). Component **không** import `axios` trực tiếp; chỉ `*.http.ts` và `lib/http-client.ts`.
- Chế độ mock (`VITE_USE_MOCK=true`) không đi qua axios.

### 5.5. Xác thực (mock)
- `AuthProvider`: `{ user: { id, email, role }, permissions, login, logout }`; phiên lưu `sessionStorage` key `nearby-admin-session` (try/catch). Lắng nghe sự kiện `unauthorized` từ http client.
- Đăng nhập bằng **email + mật khẩu**. Lỗi: sai thông tin · tài khoản `LOCKED` · không phải staff · lỗi mạng. Thành công → `from` hoặc trang mặc định theo vai trò. Đăng xuất ở `UserMenu` → `/admin/login`.
- Tài khoản mock: `moderator@…`, `admin@…`, `locked@…` (mật khẩu chỉ nằm trong comment seed).
- **Bảo mật:** guard chỉ để UX; production dùng cookie `HttpOnly` + CSRF; RBAC và ghi `audit_logs` (kể cả `ip_address`) ở server; không đặt bí mật trong bundle.

### 5.6. Khung giao diện
- `Sidebar` shadcn (thu gọn icon; mobile là Sheet). Nhóm **Kiểm duyệt**: Báo cáo [badge số `PENDING`], Tài khoản vi phạm. Nhóm **Quản trị**: Tổng quan, Người dùng, Nội dung, **Địa điểm**, Bản đồ nhiệt, Cấu hình, Nhật ký. Mục thiếu quyền → **không render**.
- Header: `Breadcrumb`, chuông thông báo (popover 5 mục mới nhất), `ThemeToggle` (tái dùng), menu người dùng. Nhãn "Admin console". Desktop-first, dùng được ở tablet. Light/dark bằng token.

---

## 6. Kiểu dữ liệu (bám `db_schema.sql` + giả định mục 2)

Đặt trong `features/admin-moderation/lib/types.ts` (dùng chung) và `*.types.ts` của từng feature. Chú thích `// table.column` chỉ nguồn; `(Sn)` trỏ tới giả định ở mục 2.

```ts
export type Uuid = string
export type IsoDateTime = string                       // timestamptz → ISO 8601

// ===== Enum bám CHECK constraint =====
export type UserStatus = 'ACTIVE' | 'LOCKED'                                   // users.status
export type Role = 'ADMIN' | 'MODERATOR' | 'NORMAL_USER'                              // suy ra từ admins / moderators / normal_users
export type ReportTargetType = 'POST' | 'COMMENT' | 'USER'                    // reports.target_type
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED'                 // reports.status
export type NotificationType =                                                  // notifications.notification_type
  | 'LIKE' | 'COMMENT' | 'FOLLOW' | 'CHAT' | 'REPORT_RESULT'
  | 'WARNING' | 'ACCOUNT_LOCKED'                                                // thông báo cho người dùng (S4)
  | 'REPORT_CREATED'                                                            // thông báo cho staff khi có báo cáo mới (S4)
export type InteractionType = 'VIEW' | 'LIKE' | 'COMMENT' | 'SHARE' | 'SAVE'   // interaction_types.name (seed)
export type PostStatus = 'ACTIVE' | 'REMOVED'                                   // posts.status (S6)

// ===== Địa lý =====
// DB: geography(Point,4326), WKT là POINT(lng lat). DTO luôn trả tên trường rõ ràng để khỏi nhầm thứ tự.
export type GeoPoint = { latitude: number; longitude: number }

// ===== Tham chiếu nhẹ =====
export type UserRef = { id: Uuid; displayName: string; avatarUrl?: string }           // normal_users.full_name / avatar_url
export type StaffRef = { id: Uuid; email: string; role: Exclude<Role, 'NORMAL_USER'> }       // admin/moderator không có tên → email
export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number }

// ===== Người dùng (users + bảng con) =====
export type AdminUserListItem = {
  id: Uuid                          // users.id
  role: Role
  status: UserStatus                // users.status
  email?: string                    // users.email — chỉ khi có quyền users.pii.read
  phoneNumber?: string              // users.phone_number — như trên
  createdAt: IsoDateTime; updatedAt: IsoDateTime
  deletedAt?: IsoDateTime           // xoá mềm (S7)
  displayName: string               // normal_users.full_name; staff: email
  avatarUrl?: string                // normal_users.avatar_url
  moderator?: { grantedAt: IsoDateTime; grantedByAdminId: Uuid }       // moderators.granted_at / granted_admin_id
  stats?: { posts: number; reportsAgainst: number; warnings: number }  // tổng hợp phía backend (S3)
}
export type SanctionType = 'WARN' | 'LOCK'                              // account_sanctions.type (S3)
export type SanctionRecord = {                                          // account_sanctions
  id: Uuid; userId: Uuid; type: SanctionType
  reason: string                    // WARN: nội dung cảnh báo · LOCK: lý do khoá (≤ 255)
  reportId?: Uuid                   // account_sanctions.report_id
  issuedBy: StaffRef; issuedAt: IsoDateTime
  liftedAt?: IsoDateTime; liftedBy?: StaffRef; liftNote?: string        // chỉ LOCK; không có liftedAt = đang bị khoá
}
export type LockInfo = { sanctionId: Uuid; reason: string; lockedAt: IsoDateTime; lockedBy: StaffRef }  // = bản ghi LOCK chưa mở; KHÔNG có hạn
export type AdminUserDetail = AdminUserListItem & {
  profile?: {                                                           // normal_users.*
    bio: string; dateOfBirth?: string; gender: number
    currentLocation?: GeoPoint; currentH3Index?: string; locationUpdatedAt?: IsoDateTime
  }
  lock?: LockInfo                   // có khi status = 'LOCKED'
  sanctions?: SanctionRecord[]      // lịch sử cảnh báo/khoá (mới nhất trước)
}
export type CreateUserInput =
  | { role: 'NORMAL_USER'; email: string; password: string; phoneNumber: string
      profile: { fullName: string; avatarUrl?: string; bio?: string; dateOfBirth: string; gender: number } }
  | { role: 'MODERATOR'; email: string; password: string; phoneNumber: string }   // S11: không có permission level
  | { role: 'ADMIN'; email: string; password: string; phoneNumber: string }
export type UpdateUserInput = Partial<{
  email: string; phoneNumber: string
  profile: { fullName: string; avatarUrl: string; bio: string; dateOfBirth: string; gender: number }
}>
export type LockUserInput = { reason: string }                           // bắt buộc; không có hạn (D8)
export type UnlockUserInput = { note?: string }
export type WarnUserInput = { message: string }                          // ≤ 255 (notifications.content)

// ===== Báo cáo (reports) =====
export type ReportListItem = {
  id: Uuid
  targetType: ReportTargetType      // reports.target_type
  targetId: string                  // reports.target_id (varchar — id của post/comment/user)
  reason: string                    // reports.reason (map nhãn bằng REPORT_REASONS; chuỗi lạ hiển thị nguyên văn; không có priority — S2)
  status: ReportStatus
  reportedAt: IsoDateTime
  handledAt?: IsoDateTime           // S1
  reporter: UserRef                 // reports.reporter_id → normal_users
  targetSummary: { text?: string; owner?: UserRef }   // preview ngắn + chủ đối tượng (backend join)
  reportCount: number               // số báo cáo cùng (targetType, targetId)
}
// S10: posts.content là TEXT (không giới hạn 255) — UI phải xử lý nội dung rất dài (cắt gọn + "Xem thêm").
export type PostTarget = {
  type: 'POST'; id: Uuid; status: PostStatus
  content: string; media?: string; createdAt: IsoDateTime
  author: UserRef & { status: UserStatus }
  location: { id: Uuid; name: string } & GeoPoint
  hashtags: string[]                // post_hashtags → hashtags.name
  counts: { views: number; likes: number; comments: number; shares: number; saves: number }
  isShare: boolean                  // S6
}
export type CommentTarget = {
  type: 'COMMENT'; id: Uuid; status: PostStatus; postId: Uuid       // S5
  content: string; media?: unknown /* comments.media jsonb */; createdAt: IsoDateTime
  author: UserRef & { status: UserStatus }
  parentCommentId?: Uuid
}
export type UserTarget = { type: 'USER'; user: AdminUserListItem; lock?: LockInfo; recentPosts?: { id: Uuid; content: string; createdAt: IsoDateTime }[] }
export type ReportTarget = PostTarget | CommentTarget | UserTarget
export type ReportDetail = ReportListItem & {
  resolutionNote?: string           // reports.resolution_note (≤ 255)
  handledBy?: StaffRef              // reports.handle_moderator_id hoặc handle_admin_id (S1)
  otherReporters: UserRef[]         // báo cáo PENDING khác cùng đối tượng
  target: ReportTarget
  history: AuditLog[]               // timeline
}

export type ModerationAction =
  | 'REMOVE_CONTENT' | 'WARN_OWNER' | 'LOCK_OWNER'   // báo cáo POST/COMMENT
  | 'WARN_USER' | 'LOCK_USER'                        // báo cáo USER
  | 'REJECT'                                         // không vi phạm → status REJECTED
export type ResolveReportInput = {
  actions: ModerationAction[]                         // ≥ 1; REJECT loại trừ các action khác
  resolutionNote?: string                             // ≤ 255 (reports.resolution_note)
  warning?: WarnUserInput                             // bắt buộc khi có WARN_*
  lock?: LockUserInput                                // bắt buộc khi có LOCK_*
}
export type ResolveReportResult = {
  reports: ReportListItem[]                           // mọi báo cáo bị ảnh hưởng (D7)
  resolvedCount: number
  notifications: { reporters: number; owner: number }
  auditLogIds: Uuid[]
}

// ===== Audit (audit_logs) =====
export type AuditAction =
  | 'REPORT_RESOLVED' | 'REPORT_REJECTED' | 'POST_REMOVED' | 'COMMENT_REMOVED'
  | 'USER_WARNED' | 'USER_LOCKED' | 'USER_UNLOCKED' | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED'
  | 'CONFIG_UPDATED' | 'LOCATION_CREATED' | 'LOCATION_UPDATED' | 'LOCATION_DELETED' | (string & {})
export type AuditLog = {
  id: Uuid
  actor: StaffRef                   // audit_logs.user_id → users (+ role)
  action: AuditAction               // audit_logs.action (varchar)
  targetType: string                // 'REPORT' | 'POST' | 'COMMENT' | 'USER' | 'SYSTEM_CONFIG' | 'INTERACTION_TYPE' | 'LOCATION'
  targetId: string                  // audit_logs.target_id (varchar)
  details: Record<string, unknown>  // audit_logs.details (jsonb): { actions, note, reportId, before, after, reason, … }
  ipAddress: string                 // audit_logs.ip_address
  occurredAt: IsoDateTime
}

// ===== Thông báo (bảng notifications — S4) =====
export type AppNotification = {
  id: Uuid; recipientId: Uuid; type: NotificationType
  content: string /* ≤255 */; referenceTargetId: string /* vd. reportId */; isRead: boolean; createdAt: IsoDateTime
}
// Thông báo của admin/moderator = AppNotification có type 'REPORT_CREATED'.

// ===== Địa điểm (locations) — topics đã loại khỏi phạm vi (D12) =====
export type AdminLocation = {
  id: Uuid; name: string; description: string; locationType: string      // locations.* (location_type tự do)
  h3Index: string                                                          // locations.h3_index — server tính từ toạ độ
  postCount?: number
} & GeoPoint
export type SaveLocationInput = { name: string; description: string; locationType: string } & GeoPoint

// ===== Cấu hình hệ thống =====
export type SystemConfig = { id: Uuid; key: string; description: string; value: string; updatedAt: IsoDateTime } // mọi value là chuỗi ≤ 255 (S12)
export type InteractionWeight = { name: InteractionType; weight: number }  // interaction_types (float4, 0–1)

// ===== Thống kê nội dung (tính từ posts, post_hashtags, post_views/likes/comments/saved_posts, interaction_types) =====
export type StatsRange = '7d' | '30d' | '90d'
export type PostStatsOverview = { totalPosts: number; newPosts: { today: number; last7d: number; last30d: number }; growthPct: number; activeAuthors: number }
export type PostsTimePoint = { date: string; count: number }
export type TrendingHashtag = { hashtagId: Uuid; name: string; postCount: number; previousPostCount: number; changePct: number }
export type TrendingPost = {
  id: Uuid; content: string; author: UserRef; locationName: string; createdAt: IsoDateTime
  counts: { views: number; likes: number; comments: number; shares: number; saves: number }
  score: number                     // Σ (interaction_types.weight × count) trong khoảng thời gian
}

// ===== Heatmap (gom theo H3; mẫu seed của locations.h3_index là độ phân giải 8) =====
export type HeatmapQuery = {
  bounds: { north: number; south: number; east: number; west: number }
  zoom: number; from: IsoDateTime; to: IsoDateTime
  locationType?: string; hashtag?: string
}
export type HeatmapCell = { h3Index: string; resolution: number; count: number; center: GeoPoint; changePct?: number }
export type HeatmapResponse = { resolution: number; cells: HeatmapCell[]; totals: { posts: number; cells: number; maxCount: number } }
export type HeatmapCellDetail = {
  h3Index: string; totalPosts: number; previousPeriodPosts: number
  topLocations: { id: Uuid; name: string; count: number }[]
  topHashtags: { name: string; count: number }[]
  topPosts: TrendingPost[]
}
```

### Ma trận hành động cho báo cáo

| Đối tượng | Hành động hiển thị | Điều kiện khả dụng | Hiệu ứng dữ liệu |
|---|---|---|---|
| `POST` / `COMMENT` | `REMOVE_CONTENT` | Nội dung chưa `REMOVED` | `posts.status` / `comments.status = 'REMOVED'` + audit `POST_REMOVED`/`COMMENT_REMOVED` |
| | `WARN_OWNER` | Chủ nội dung `ACTIVE`, chưa bị xoá | bản ghi `account_sanctions` (WARN) + `notifications` (`WARNING`) cho chủ + audit `USER_WARNED` |
| | `LOCK_OWNER` | Chủ là `USER`, chưa `LOCKED` | bản ghi `account_sanctions` (LOCK) → trigger đặt `users.status = 'LOCKED'` + `notifications` (`ACCOUNT_LOCKED`) + audit `USER_LOCKED` |
| | `REJECT` ("Không vi phạm") | Luôn | `reports.status = 'REJECTED'`; **loại trừ** các action khác; chủ nội dung **không** nhận thông báo |
| `USER` | `WARN_USER` · `LOCK_USER` · `REJECT` | Như trên | Như trên |

Quy tắc chung: chọn ≥ 1 hành động; có thể kết hợp (ví dụ `REMOVE_CONTENT` + `WARN_OWNER`); có ít nhất một hành động ≠ `REJECT` → `RESOLVED`. Mọi trường hợp: cập nhật `handled_at`, người xử lý (`handle_moderator_id` hoặc `handle_admin_id` theo vai trò), `resolution_note` cho **mọi** báo cáo `PENDING` cùng đối tượng; tạo `notifications` (`REPORT_RESULT`, "cảm ơn") cho **từng người báo cáo**; ghi `audit_logs` (`REPORT_RESOLVED`/`REPORT_REJECTED` + log từng hành động).

---

## 7. Đặc tả màn hình

### 7.1. Moderator — Quản lý báo cáo (luồng 8 bước) · `features/moderation`

| Bước nghiệp vụ | Triển khai |
|---|---|
| 1. Vào "Quản lý Báo cáo" | Mục **Báo cáo** ở sidebar → `/admin/reports` (`ReportsPage`) |
| 2. Danh sách chờ xử lý, phân trang, sắp xếp theo thời gian | `Table` + `Pagination`. Mặc định `status=PENDING`. Sắp xếp theo `reportedAt`: **Cũ nhất trước** (mặc định, xử lý theo thứ tự đến) · Mới nhất. **Không có mức ưu tiên** (D14). Cỡ trang 10/20/50. Lọc: trạng thái (`PENDING/RESOLVED/REJECTED`), lý do, tìm theo ID/nội dung |
| 3. Chọn một báo cáo | Bấm dòng/Enter → `/admin/reports/{content\|users}/:id` |
| 4. Use Case "Xem chi tiết nội dung" | `ContentPreview` (hoặc `UserTargetCard`): **người báo cáo**, **lý do**, **preview nội dung** (nội dung — có thể rất dài, cuộn/"Xem thêm" —, media, địa điểm, hashtag, số liệu tương tác; bình luận có link tới bài gốc qua `postId`) kèm **ID thực thể gốc** (`targetId`, copy được), chủ nội dung + trạng thái + số cảnh báo/báo cáo trước đó (từ `account_sanctions`), "N người khác cũng báo cáo", dòng thời gian xử lý |
| 5. Phân tích & chọn action | Panel "Xử lý" bên phải |
| 6. Hệ thống hiện các action | Checkbox theo **ma trận mục 6**; action không khả dụng bị khoá kèm giải thích ("Nội dung đã bị xoá", "Tài khoản đã bị khoá", "Không thể tác động lên moderator/admin") |
| 7. Xác nhận quyết định | "Xem lại & xác nhận" → `Dialog` tóm tắt (hành động, nội dung cảnh báo ≤255, lý do khoá, ghi chú ≤255) → "Xác nhận" |
| 8. Đã xử lý + audit + thông báo | Service `resolve` thực hiện đúng "Quy tắc chung" mục 6. UI: toast, trang chuyển **chỉ đọc** kèm tóm tắt kết quả + timeline (ai · lúc nào · quyết định gì, từ `audit_logs`) |

Tab **Nội dung | Người dùng** (`targetType`: `POST/COMMENT` vs `USER`). Xung đột (`409` — đã có người xử lý) → `Alert` "Báo cáo đã được xử lý bởi …", tải lại, chuyển chỉ đọc.

```
┌ Báo cáo ─────────────────────────────────────────────────────────┐
│ [Nội dung 12] [Người dùng 4]          Trạng thái ▾  Lý do ▾   🔍   │
│ Sắp xếp: Cũ nhất trước ▾                                          │
│ ┌────────────┬──────┬──────────────────────┬─────────┬──────────┬────┐
│ │ THỜI GIAN  │ LOẠI │ ĐỐI TƯỢNG            │ LÝ DO   │ NGƯỜI BC │ SL │
│ │ 2 giờ trước│ Bài  │ "Kẹt xe ở Cầu Giấy…" │ SPAM    │ Linh     │ 5  │
│ └────────────┴──────┴──────────────────────┴─────────┴──────────┴────┘
│                              ‹ 1 2 3 … ›   10/trang ▾             │
└──────────────────────────────────────────────────────────────────┘
┌ Báo cáo #… · Bài viết · [Chờ xử lý] ─────────────────────────────┐
│ ┌ Chi tiết ─────────────────────────┐ ┌ Xử lý ──────────────────┐ │
│ │ Người báo cáo: Linh · 2 giờ trước  │ │ ☐ Xoá bài viết          │ │
│ │ Lý do: HARASSMENT                  │ │ ☐ Gửi cảnh báo cho chủ  │ │
│ │ + 4 người khác cũng báo cáo        │ │ ☐ Khoá tài khoản chủ    │ │
│ │ ───────────────────────────────── │ │ ☐ Không vi phạm         │ │
│ │ Nội dung bị báo cáo  ID: 3333… ⧉   │ │ Ghi chú nội bộ (≤255)   │ │
│ │ [preview: nội dung, ảnh, địa điểm] │ │ [Xem lại & xác nhận]    │ │
│ │ Chủ nội dung: Nam · 2 cảnh báo     │ └─────────────────────────┘ │
│ │ Lịch sử xử lý (timeline)           │                            │
│ └────────────────────────────────────┘                            │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2. Xử lý tài khoản vi phạm · `features/moderation`
- Báo cáo `USER` dùng cùng khung 7.1 (action: `WARN_USER`, `LOCK_USER`, `REJECT`).
- `/admin/accounts` (`FlaggedAccountsPage`): tài khoản `USER` có báo cáo `PENDING` hoặc từng bị cảnh báo/khoá; hành động nhanh **Cảnh báo**, **Khoá**, **Mở khoá** (moderator và admin đều có). Moderator không có CRUD.
- Dialog đặt ở `admin-moderation/components` để admin dùng lại:
  - **`LockDialog`**: chỉ cần **lý do** (bắt buộc, ≤255). **Không có lựa chọn thời hạn.** Văn bản xác nhận nêu rõ "Tài khoản sẽ bị khoá cho đến khi được mở lại".
  - **`UnlockDialog`**: ghi chú tuỳ chọn.
  - **`WarnDialog`**: chọn mẫu → sửa → gửi (≤255).
- Tài khoản đang `LOCKED` hiển thị lý do, người khoá, thời điểm khoá (bản ghi LOCK chưa `lifted_at` trong `account_sanctions`). Khoá/mở khoá/cảnh báo **chỉ ghi qua `account_sanctions`** (trigger tự đồng bộ `users.status`); mọi thao tác ghi thêm audit.

### 7.3. Admin — Quản lý người dùng · `features/admin`
- Bảng: avatar + `displayName` · vai trò · trạng thái · email · số điện thoại · số bài · số báo cáo · ngày tạo (email/SĐT ẩn nếu thiếu `users.pii.read`). Tìm (tên/email/SĐT), lọc vai trò/trạng thái, sắp xếp, phân trang; mặc định ẩn tài khoản đã xoá mềm.
- **Tạo/Sửa** theo vai trò: `USER` (email, mật khẩu tạm, SĐT, họ tên, ngày sinh, giới tính, bio, avatar) · `MODERATOR` (email, mật khẩu tạm, SĐT; `granted_by/at` tự điền) · `ADMIN`. Trùng email/SĐT → lỗi theo trường (S8, `ApiError.fieldErrors`). Mật khẩu tạm hiển thị **một lần** (mock) / gửi lời mời (thật). Vai trò không đổi sau khi tạo (D9).
- **Chi tiết** (`Tabs`): Tổng quan (profile, vị trí hiện tại, thông tin khoá nếu có) · Bài viết · Báo cáo (đối với người này/do người này gửi) · Lịch sử kiểm duyệt (cảnh báo, khoá, mở khoá — từ `account_sanctions`, kèm audit).
- **Khoá / Mở khoá** như 7.2. **Xoá**: `AlertDialog` gõ lại email/tên; chặn xoá chính mình/admin cuối; xử lý `409`.

### 7.4. Admin — Quản lý nội dung (`/admin/content`)
- KPI: **tổng số bài**, bài mới (hôm nay/7 ngày), **tăng trưởng %** so với kỳ trước, tác giả hoạt động.
- Biểu đồ vùng **số bài theo ngày** (`ToggleGroup` 7/30/90 ngày).
- **Chủ đề trending = hashtag** (từ `post_hashtags`): cột top 10 + bảng (hashtag, số bài, thay đổi so kỳ trước ▲▼).
- **Bài viết trending**: điểm `score = Σ weight × count` theo `interaction_types` (VIEW 0.05, LIKE 0.15, COMMENT 0.3, SHARE 0.4, SAVE 0.1 — **lấy từ API, không hard-code**); bấm xem chi tiết (Sheet). Nội dung bài viết là `TEXT` có thể rất dài (S10): bảng chỉ hiện đoạn đầu (`POST_PREVIEW_CHARS`), Sheet hiện đầy đủ.
- **Báo cáo nội dung**: thẻ tóm tắt số `PENDING` + liên kết `/admin/reports?type=content` (tái dùng 7.1).

### 7.5. Admin — Địa điểm · `features/admin`
*(Danh mục/topics đã loại khỏi phạm vi, D12.)*
- `/admin/locations` (`LocationsPage`): bảng (tên, mô tả, loại, vĩ độ, kinh độ, `h3Index` chỉ đọc, số bài). Lọc theo `locationType`, tìm theo tên, phân trang.
- Dialog Thêm/Sửa có **`LocationPicker`** (Google Map): bấm bản đồ hoặc **kéo `AdvancedMarker`** để đặt toạ độ; ô `lat/lng` đồng bộ hai chiều; validate −90…90 / −180…180; **mô tả bắt buộc** (≤255); `locationType` là ô chọn/nhập kèm **gợi ý từ giá trị đã có** (`GET /admin/locations/types`). `h3Index` do server sinh (FE chỉ xem trước bằng `h3-js`).
- Xoá: xử lý `409` khi địa điểm còn bài viết (S9) — hiển thị số bài đang dùng và gợi ý hướng xử lý (ẩn địa điểm nếu backend có hỗ trợ). Mọi thay đổi ghi audit (`LOCATION_*`).

### 7.6. Admin — Bản đồ nhiệt (`/admin/heatmap`) · Google Maps + deck.gl
- Nền `Map` của `@vis.gl/react-google-maps` (cần `mapId`), mặc định căn Hà Nội. **Không dùng** `google.maps.visualization.HeatmapLayer` (đã bị gỡ). `HeatmapOverlay` tạo `GoogleMapsOverlay` (`@deck.gl/google-maps`) **trong `useEffect`** qua `useMap()` và cập nhật `setProps({ layers })` khi dữ liệu đổi; **dọn dẹp** (`setMap(null)`, `finalize()`) khi unmount. Không đọc `ref.current` trong lúc render (React Compiler, mục 9).
- Hai chế độ: **Mật độ** = `HeatmapLayer` (`getPosition = center`, `getWeight = count`) · **Ô lục giác H3** = `H3HexagonLayer` (`getHexagon = h3Index`, màu theo `count`).
- Dữ liệu: server gom theo `locations.h3_index` (join `posts.location_id`) rồi **`cellToParent`** theo độ phân giải ứng với zoom; FE **chỉ nhận ô đã gom** (không điểm thô). Gợi ý ánh xạ (chốt với backend; chỉ số gốc trong seed có vẻ là res 8):

  | Zoom | ≤ 9 | 10–11 | 12–13 | ≥ 14 |
  |---|---|---|---|---|
  | Độ phân giải H3 | 5 | 6 | 7 | 8 |

- Bộ lọc: khoảng thời gian (preset + `Calendar`), `locationType`, hashtag. Kéo/zoom → gọi lại theo `bounds + zoom` (**debounce ~300 ms**, huỷ request cũ bằng `AbortSignal`).
- **Tương tác:** hover ô → tooltip số bài; **click ô** → `CellPanel` (tổng bài, so với kỳ trước, top địa điểm, top hashtag, bài nổi bật) + "Phóng to vào ô"; chú giải thang màu; "Về Hà Nội"; bảng "Top khu vực".
- Dark mode: dùng Map ID có style tối/sáng hoặc cố định sáng. deck.gl + Maps nặng → **lazy-load trang này**.

### 7.7. Admin — Cấu hình hệ thống (`/admin/settings`)
`system_configs` là **key–value chuỗi ≤ 255 ký tự** (S12) → FE có **registry khoá** (`CONFIG_REGISTRY`) mô tả kiểu, giới hạn, nhóm; khoá lạ vẫn hiện ở nhóm "Khác" dưới dạng chuỗi.

```ts
type ConfigDefinition = { key: string; group: 'general'|'feed'|'content'; label: string
  type: 'string'|'number'|'boolean'|'csv'|'enum'; min?: number; max?: number; options?: string[]; default?: string }
```
`Tabs` theo nhóm; form riêng từng nhóm (RHF + zod, ép kiểu từ/đến chuỗi); "Lưu", "Hoàn tác", cảnh báo thay đổi chưa lưu (`beforeunload` + chặn đổi tab; `useBlocker` **không** dùng được với `BrowserRouter`). Mỗi lần lưu ghi audit `CONFIG_UPDATED` (`before/after`, `target_type = 'SYSTEM_CONFIG'`).

| Nhóm | Khoá ví dụ (chốt với backend) |
|---|---|
| general | `system.maintenance_mode` (boolean), `system.maintenance_message` |
| feed | `feed.default_radius_km`, `feed.max_radius_km`, `feed.radius_options` (csv), `trending.window_hours`, `feed.weight.interest`, `.distance`, `.recency`, `.trending`, `.social` |
| content | `post.max_length` (giới hạn nghiệp vụ do admin đặt; DB không giới hạn — S10), `post.max_media`, `post.rate_limit_per_hour` |

Tab riêng **"Trọng số tương tác"** sửa `interaction_types.weight` (0–1, `name` chỉ đọc), cũng ghi audit. Danh sách lý do báo cáo là hằng số FE (`REPORT_REASONS`) vì không vừa 255 ký tự.

### 7.8. Thông báo (Moderator & Admin)
- Chuông ở header + `/admin/notifications` (`admin-moderation/pages`): tab Tất cả/Chưa đọc, lọc loại, "Đánh dấu đã đọc", bấm → mở đúng báo cáo (`referenceTargetId`); toast khi có báo cáo mới.
- Nguồn: bảng `notifications`, loại `REPORT_CREATED` (một dòng cho mỗi moderator/admin khi có báo cáo mới; `recipient` là `users.id` — S4); polling `refetchInterval` (mock giả lập báo cáo mới ~30 s); khi backend có SSE/WebSocket chỉ thay `notifications.service`.

### 7.9. Nhật ký audit (Admin)
Bảng: thời gian · người thực hiện (vai trò) · hành động · đối tượng (`targetType`/`targetId`) · IP · chi tiết (mở rộng JSON `details`). Lọc theo người, hành động, khoảng ngày. Moderator chỉ thấy timeline trong từng báo cáo.

---

## 8. Các pha triển khai

**DoD chung:** `tsc`, `npm test`, `npm run build` (và `npm run lint` từ Pha 1) sạch · đủ loading/empty/error · token màu, light + dark · icon-only button có `aria-label` · tuân thủ **quy tắc phụ thuộc 5.2** và **quy ước React Compiler (mục 9)** · không sửa `components/ui` · không import `src/features` từ app người dùng.

### Pha 0 — Chuẩn bị (người)
Chốt D1–D18 · áp dụng `db_schema.sql` bản 2 lên DB (hoặc đối chiếu nếu bạn tự sửa) và đặt file vào repo · chạy mục 3.1–3.3 · commit.

### Pha 1 — Hạ tầng dùng chung: axios, React Compiler, ESLint (S–M)
- **Làm:**
  1. **axios:** `src/lib/http-client.ts` (`createHttpClient`, `ApiError`, interceptor chuẩn hoá lỗi, hỗ trợ huỷ request, `401` callback) **thay `src/lib/api.ts`** (chưa được import ở đâu); cập nhật README/AGENTS/roadmap (biến `VITE_API_BASE_URL`, quy tắc "mọi HTTP qua `lib/http-client.ts`").
  2. **React Compiler:** cấu hình `vite.config.ts` theo 3.4; chạy `npm test` + `npm run build`; thử `npx react-compiler-healthcheck@latest` để xem tỉ lệ component biên dịch được; sửa vi phạm Rules of React nếu có (ghi lại vào PR).
  3. **ESLint** (flat config): `typescript-eslint` + `eslint-plugin-react-hooks` (bật luật compiler, gồm `react-hooks/incompatible-library`) + `no-restricted-imports` theo **quy tắc phụ thuộc 5.2** (cấu hình sẵn cho `src/features/*` dù chưa có code); thêm script `npm run lint`.
- **Chấp nhận:** app người dùng chạy như cũ (test hiện có pass, 19/19 trở lên) · bundle không hỏng · `npm run lint` sạch (hoặc liệt kê rõ các cảnh báo còn tồn tại) · test `http-client`: lỗi 422 → `ApiError.fieldErrors`, lỗi mạng → `status 0`, `401` gọi `onUnauthorized`, request bị huỷ không bị coi là lỗi.
- **Test:** `http-client` bằng `adapter` tuỳ biến của axios.

### Pha 2 — Nền tảng admin · `admin-moderation` + `routes` (L)
- **Làm:** `lib/types.ts` (mục 6), `labels.ts`, `constants.ts`; `auth/` (provider, permissions theo mục 4, guards); `api/` (`http-client.ts` admin, query-client, **mock db theo schema + seed + latency**, auth/notifications/audit service); `components/` (AdminLayout, sidebar theo quyền, header, DataTable, PageHeader, badges, dialogs, Empty/Error); `pages/` (Login, 403, 404); `src/routes/admin-routes.tsx` + lazy route trong `App.tsx`.
- **shadcn:** sidebar, breadcrumb, tooltip, skeleton, table, card, empty, alert, alert-dialog, field, label, spinner, dropdown-menu, avatar.
- **Chấp nhận:** login đúng/sai/`LOCKED`/không phải staff → lỗi đúng · logout xoá phiên · moderator không thấy menu admin, vào URL admin → 403 · refresh giữ phiên · `401` từ service → đăng xuất + toast · app người dùng không tải chunk admin (kiểm tra `dist/assets`).
- **Test:** guards theo vai trò, login flow, `DataTable` đọc/ghi URL.

### Pha 3 — Báo cáo nội dung (luồng moderator) · `moderation` (L) ⭐ lõi
- **Làm:** `reports.service/http/mock/queries` (list/get/resolve, gộp D7, audit, notifications) · `ReportsPage` · `ContentReportDetailPage` + `ContentPreview`, `ActionPanel`, `ResolveConfirmDialog`, `ReportTimeline` · xử lý `409`.
- **shadcn:** table, pagination, checkbox, radio-group, textarea, field, combobox, toggle-group, popover, alert-dialog, scroll-area, calendar.
- **Chấp nhận:** đúng 8 bước 7.1 · action bị khoá có giải thích · `REJECT` loại trừ action khác · sau xác nhận mọi báo cáo `PENDING` cùng đối tượng đổi `RESOLVED/REJECTED`, có `handledAt/handledBy`, audit (ai/lúc nào/quyết định), thông báo cho **mọi người báo cáo** và chủ nội dung (không gửi khi `REJECT`) · ghi chú/cảnh báo ≤255 · bộ lọc giữ sau refresh.
- **Test:** luồng "Xoá bài + Cảnh báo" bằng `userEvent`; kiểm `mock db` sau resolve (status bài viết, audit, notifications); `409`; sắp xếp theo thời gian (mặc định cũ nhất trước) và phân trang.
- **Lưu ý compiler:** `DataTable` dùng `useReactTable` → xem mục 9.

### Pha 4 — Báo cáo người dùng & tài khoản vi phạm · `moderation` + `admin-moderation` (M)
- **Làm:** `UserReportDetailPage`/`UserTargetCard` · `WarnDialog`, `LockDialog`, `UnlockDialog` (ở `admin-moderation/components`) · `FlaggedAccountsPage` · ràng buộc "không tác động moderator/admin, không tự khoá".
- **shadcn:** dialog, field, textarea, select.
- **Chấp nhận:** `LockDialog` chỉ có trường **lý do**, **không** có thời hạn; xác nhận ghi rõ "đến khi được mở lại" · cả moderator và admin khoá/mở khoá được · tài khoản `LOCKED` hiện lý do/người khoá/thời điểm ở mọi bảng · bản ghi `account_sanctions` đúng (WARN/LOCK, `lifted_*`; mock mô phỏng trigger đồng bộ `users.status`) · audit đầy đủ (`USER_LOCKED`/`USER_UNLOCKED`/`USER_WARNED`) · tài khoản `LOCKED` không đăng nhập được (mock).
- **Test:** validate form, ràng buộc vai trò, khoá → mở khoá.

### Pha 5 — Quản lý người dùng · `admin` (M)
- **Làm:** `users.service/http/mock/queries` · `UsersPage`, `UserDetailPage` · form theo vai trò (USER/MODERATOR/ADMIN) · khoá/mở khoá · xoá mềm.
- **shadcn:** tabs, dialog, alert-dialog, select, field, switch, dropdown-menu, input-group.
- **Chấp nhận:** CRUD đủ; trùng email/SĐT báo lỗi theo trường; chặn xoá admin cuối/chính mình; PII ẩn khi thiếu quyền (kiểm bằng moderator); tạo moderator không có trường quyền con.
- **Test:** CRUD, ràng buộc, quyền.

### Pha 6 — Thống kê nội dung · `admin` (M)
- **Làm:** `content-stats.*` · `ContentOverviewPage`, `DashboardPage` · KPI, biểu đồ, trending hashtags, trending posts (điểm theo `interaction_types`), thẻ tóm tắt báo cáo.
- **shadcn:** chart, card, toggle-group, table, sheet, skeleton, progress.
- **Chấp nhận:** đổi khoảng thời gian cập nhật cả KPI lẫn biểu đồ; số liệu nhất quán; dữ liệu rỗng không vỡ; `score` đổi khi đổi `weight`.
- **Test:** từng khoảng thời gian, rỗng, công thức điểm.

### Pha 7 — Quản lý địa điểm + `LocationPicker` · `admin` + `components/map` (M–L)
- **Làm:** `GoogleMapsProvider` (`APIProvider`, đọc `VITE_GOOGLE_MAPS_API_KEY`, `mapId`) + `LocationPicker` trong `src/components/map` · `locations.service/http/mock/queries` · `LocationsPage`.
- **shadcn:** dialog, field, input-group, table, alert-dialog, combobox, pagination.
- **Chấp nhận:** nhập tay và chọn trên bản đồ đồng bộ hai chiều · validate toạ độ, mô tả bắt buộc · xoá địa điểm còn bài viết → hiển thị `409` thân thiện · thiếu API key → màn hình lỗi thân thiện (không trắng trang).
- **Test:** CRUD, validate (mock `@vis.gl/react-google-maps` trong jsdom).

### Pha 8 — Bản đồ nhiệt · `admin` (L)
- **Làm:** `heatmap.*` (mock sinh ô H3 quanh Hà Nội, tôn trọng `bounds+zoom`) · `HeatmapOverlay` (deck.gl `GoogleMapsOverlay`) · `HeatmapPage`, `CellPanel`, `Legend` · lazy-load trang.
- **shadcn:** card, toggle-group, calendar, popover, combobox, sheet, scroll-area, skeleton, slider, tooltip.
- **Chấp nhận:** kéo/zoom gọi lại (debounce, huỷ request cũ) · click ô cập nhật panel · đổi chế độ Mật độ ↔ H3 · chú giải thang màu · không nhận điểm thô · gỡ overlay sạch khi rời trang.
- **Test:** hàm ánh xạ zoom→resolution, thang màu, panel khi chọn ô (mock deck.gl/Maps; không kiểm tra pixel).

### Pha 9 — Cấu hình, Thông báo, Audit · `admin` + `admin-moderation` (M)
- **Làm:** `settings.*` (registry khoá, form theo nhóm, tab trọng số tương tác) · `notifications.*` (chuông + trang) · `AuditLogPage`.
- **shadcn:** tabs, switch, slider, radio-group, field, popover, scroll-area, table, pagination.
- **Chấp nhận:** ép kiểu đúng từ/đến chuỗi ≤255; cảnh báo chưa lưu; báo cáo mới lên chuông không cần reload; bấm thông báo mở đúng báo cáo; audit lọc theo người/hành động/ngày.
- **Test:** dirty-state, ép kiểu, đánh dấu đã đọc, deep link.

### Pha 10 — Hoàn thiện (S–M)
A11y (focus, `aria-live`, bàn phím cho bảng) · dark mode mọi trang · responsive tablet · lazy-load trang nặng (chart/map) · rà soát cảnh báo `react-hooks/*` còn lại · cập nhật README/AGENTS/architecture/roadmap · (tuỳ chọn, D11) hiển thị thông báo `REPORT_RESULT`/`WARNING`/`ACCOUNT_LOCKED` ở `/notifications` của app người dùng.

---

## 9. Quy ước cho agent (bổ sung vào AGENTS.md ở Pha 1)

**Cấu trúc & dữ liệu**
1. Code admin chỉ trong `src/features/{admin-moderation,moderation,admin}/**`, `src/routes/admin-routes.tsx`, `src/components/map/**`. Tuân thủ **5.2** (ESLint kiểm).
2. Truy cập dữ liệu qua `*.service.ts`; component **không** gọi mock hay `axios` trực tiếp. Logic "phía server" (gộp báo cáo, audit, thông báo, đổi `status`) nằm ở **mock service**.
3. Kiểu dữ liệu lấy từ mục 6; **không** đặt thêm trường không có trong schema mà không ghi vào mục 2; khoá/cảnh báo chỉ ghi qua `account_sanctions` (không sửa `users.status` trực tiếp).
4. Quyền: `usePermission()`/`<Can>`; không so sánh chuỗi vai trò rải rác.
5. Lọc/phân trang/sắp xếp trên **URL**. Hành động phá huỷ/khoá/xoá nội dung **luôn** có bước xác nhận và ghi audit.
6. Nhãn hiển thị lấy từ `labels.ts` (tiếng Việt). Form dùng `Field` + react-hook-form + zod; giới hạn độ dài **theo cột DB** (255…).
7. Bản đồ: chỉ qua `src/components/map` và `HeatmapOverlay`; **không** dùng `google.maps.visualization.HeatmapLayer`; thứ tự toạ độ GeoJSON/deck.gl là `[longitude, latitude]`.
8. Test dùng `renderAdmin(path, session)` + `resetMockDb()`; seed xác định.

**HTTP (axios)**
9. Mọi HTTP đi qua instance tạo bởi `createHttpClient`; chỉ `*.http.ts` được import `axios`/`adminHttp`. Luôn truyền `signal` từ TanStack Query xuống request. Lỗi là `ApiError`; lỗi 422 đổ vào form bằng `fieldErrors`; không tự `try/catch` để nuốt lỗi 401.

**React Compiler** *(compiler tự memoize — viết React "thuần")*
10. **Không thêm** `useMemo`/`useCallback`/`React.memo` theo thói quen; chỉ dùng khi cần ổn định tham chiếu cho thư viện ngoài hoặc dependency của effect, kèm comment. Không dọn hàng loạt code cũ chỉ vì lý do này.
11. Tuân thủ Rules of React: **không** thay đổi props/state/giá trị context trực tiếp; **không** đọc/ghi `ref.current` trong lúc render; không gây side effect trong render (tạo `GoogleMapsOverlay`, đăng ký listener… đều làm trong `useEffect`); hook luôn ở cấp cao nhất.
12. **Thư viện không tương thích** (compiler tự **bỏ qua** component dùng chúng, không hỏng nhưng không được tối ưu; luật `react-hooks/incompatible-library` sẽ báo):
    - `useReactTable` (TanStack Table) → gom vào **một** component `DataTable`; thêm `'use no memo'` ở đầu component kèm comment lý do, và truyền cho con **dữ liệu thuần** thay vì đối tượng `table` khi có thể.
    - `watch()` của react-hook-form → dùng **`useWatch({ control, name })`** hoặc `getValues()` trong handler.
    - `useVirtualizer` (nếu dùng sau này) → cùng cách với `useReactTable`.
13. `'use no memo'` là **ngoại lệ có chủ đích**, phải có comment; nếu compiler báo lỗi ở code của mình, sửa code trước. Kiểm tra bằng `npm run lint`, test (chạy trên code đã biên dịch) và React DevTools (nhãn "Memo ✨").

---

## 10. Phụ lục

### 10.1. API đề xuất (để chốt với backend — **không phải API có sẵn**)

| Module | Endpoint |
|---|---|
| Auth | `POST /admin/auth/login` · `POST /admin/auth/logout` · `GET /admin/auth/me` (→ `role`) |
| Reports | `GET /admin/reports?type&status&reason&q&sort&page&pageSize` (`sort` = `reportedAt:asc\|desc`) · `GET /admin/reports/:id` · `POST /admin/reports/:id/resolve` |
| Accounts | `GET /admin/accounts/flagged` · `GET /admin/users/:id/sanctions` · `POST /admin/users/:id/warn` · `POST /admin/users/:id/lock` (body `{ reason }`) · `POST /admin/users/:id/unlock` (body `{ note? }`) |
| Users | `GET/POST /admin/users` (POST tạo cả moderator/admin theo `role`) · `GET/PATCH/DELETE /admin/users/:id` |
| Content stats | `GET /admin/stats/posts?range` · `/stats/trending-hashtags?range` · `/stats/trending-posts?range` |
| Locations | `GET/POST /admin/locations` · `PATCH/DELETE /admin/locations/:id` · `GET /admin/locations/types` |
| Heatmap | `GET /admin/heatmap?north&south&east&west&zoom&from&to&locationType&hashtag` · `GET /admin/heatmap/cells/:h3Index` |
| Settings | `GET /admin/configs` · `PATCH /admin/configs/:key` · `GET/PATCH /admin/interaction-weights` |
| Notifications | `GET /admin/notifications?unread` · `POST /admin/notifications/read` · luồng SSE/WebSocket |
| Audit | `GET /admin/audit-logs?actor&action&from&to&page&pageSize` |

Lỗi UI cần xử lý (qua `ApiError`): `401` (hết phiên) · `403` · `404` · `409` (đã xử lý/trùng/bị ràng buộc) · `422` (lỗi theo trường) · `0`/`5xx` (mạng/máy chủ — thử lại). **Hình dạng body lỗi** (`code`, `message`, `errors`) chốt với backend.

### 10.2. Prompt mẫu cho agent

> Đọc `AGENTS.md`, `docs/architecture.md`, `docs/ui-guidelines.md` và `docs/admin-moderator-plan.md`. Thực hiện **Pha N**, không làm sang pha khác. Dùng đúng các quyết định ở mục 1, kiểu dữ liệu ở mục 6, quy tắc phụ thuộc 5.2 và quy ước ở mục 9 (axios, React Compiler). Nếu thiếu shadcn component hoặc thư viện, dừng và báo lại. Khi xong chạy `npx tsc -b && npm test && npm run build && npm run lint`, nói rõ đã kiểm tra gì và chưa kiểm tra gì (ví dụ chưa xem trên trình duyệt thật, chưa thử key Google Maps thật), rồi cập nhật bảng "Trạng thái".

Gợi ý Pha 1: *"Làm Pha 1. Thay `src/lib/api.ts` bằng `src/lib/http-client.ts` (axios), bật React Compiler theo 3.4 và báo lại kết quả healthcheck, cấu hình ESLint kèm luật phụ thuộc 5.2. Đừng sửa giao diện hiện có ngoài những chỗ compiler bắt buộc."*

Gợi ý Pha 3: *"Làm Pha 3. Bám đúng 8 bước ở 7.1; viết test end-to-end cho luồng 'Xoá bài + Cảnh báo' và kiểm tra mock db sau resolve (trạng thái bài viết, `audit_logs`, `notifications` cho mọi người báo cáo và chủ bài)."*

### 10.3. Rủi ro & lưu ý
- **Schema (mục 2):** file SQL đã được kiểm thử hành vi trên PostgreSQL 16 nhưng **chưa kiểm thử PostGIS/GIST**; khi áp dụng lên DB thật, chạy lại các kịch bản chính (báo cáo, khoá/mở khoá, unique). Trigger `sync_user_lock_status` đồng bộ `users.status`: backend **không** `UPDATE users.status` trực tiếp cho khoá/mở khoá.
- **React Compiler:** bật cho toàn app nên có thể làm lộ code vi phạm Rules of React ở phần đã có (đã tính vào Pha 1). Bảng (TanStack) và form (`watch`) là hai điểm dễ gặp — xem quy ước 12. Build/dev chậm hơn đôi chút do bước Babel.
- **axios:** hình dạng body lỗi và cách serialize mảng phải khớp backend; cookie `HttpOnly` cần cấu hình CORS (`Access-Control-Allow-Credentials`) và CSRF.
- **Google Maps:** key, billing, quota; thiếu key phải có màn hình lỗi thân thiện; `AdvancedMarker` cần Map ID. Trong jsdom không có WebGL/`google` → mock `@vis.gl/react-google-maps` và `@deck.gl/*` trong `test-setup`.
- **Bundle:** admin + chart + Google Maps + deck.gl rất nặng → lazy-load; kiểm tra `dist/assets` để app người dùng không kéo chunk admin.
- **Thứ tự toạ độ:** WKT `POINT(lng lat)`, GeoJSON/deck.gl `[lng, lat]`, `google.maps.LatLngLiteral` là `{ lat, lng }` — dùng một helper chuyển đổi duy nhất.
- **Khoá không thời hạn:** moderator nào cũng mở khoá được → rủi ro mở nhầm; đã có audit. Nếu cần siết lại (chỉ người khoá hoặc admin mới được mở) thì đổi D8 và quyền `users.unlock`.
- **PII:** email/SĐT/ngày sinh chỉ cho admin; cân nhắc mask mặc định.
- **Chưa có trong phạm vi:** kháng nghị, xử lý hàng loạt, phân công báo cáo cho moderator, xuất file, hoàn tác hành động, quản lý topics.

---

## Trạng thái (agent cập nhật)

| Pha | Trạng thái | Ghi chú |
|---|---|---|
| 0 Chuẩn bị | ☐ | |
| 1 Hạ tầng: axios, React Compiler, ESLint | ☑ | Hoàn thành: http-client.ts + test 8/8, compiler 239/239 components, eslint flat config + luật phụ thuộc 5.2 |
| 2 Nền tảng admin | ☑ | Hoàn thành: types, permissions, auth/mock, components (sidebar, header, layout, data-table,...), pages (login, 403, 404), admin-routes lazy |
| 3 Báo cáo nội dung | ☐ | |
| 4 Báo cáo người dùng & tài khoản vi phạm | ☐ | |
| 5 Quản lý người dùng | ☐ | |
| 6 Thống kê nội dung | ☐ | |
| 7 Quản lý địa điểm | ☐ | |
| 8 Bản đồ nhiệt | ☐ | |
| 9 Cấu hình, Thông báo, Audit | ☐ | |
| 10 Hoàn thiện | ☐ | |
