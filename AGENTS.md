# AGENTS.md

Hướng dẫn cho AI agent (Cursor, Copilot, Claude Code, Codex…) và cho thành viên mới. Đọc file này **trước khi sửa code**. Chi tiết nằm ở [README.md](README.md) và thư mục [docs/](docs/).

## Dự án là gì

Frontend của mạng xã hội location-based ("nearby."): React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui (Base UI). Dữ liệu hiện là **mock**, chưa có backend.
## Lệnh bắt buộc trước khi kết thúc một thay đổi

```bash
npx tsc -b        # phải không có lỗi
npm run lint      # phải sạch lỗi lint
npm test          # phải pass hết
npm run build     # phải build được
```

Nếu thay đổi hành vi, **thêm hoặc cập nhật test** trong `src/*.test.tsx`.

## Quy tắc cứng

1. **Không sửa tay `src/components/ui/*`.** Đó là mã do `npx shadcn@latest add <tên>` sinh ra. Cần tuỳ biến thì bọc ra component riêng. Ngoại lệ duy nhất hiện tại: `sonner.tsx` đổi 1 dòng import `useTheme` sang `@/components/theme-provider` (nếu `add --overwrite` làm mất, áp lại dòng đó).
2. **Dùng shadcn trước.** Cần Dialog, Select, Tabs, Menu, Sheet, Toast, Input… thì dùng/thêm component shadcn, đừng tự viết `<select>`, modal, dropdown thủ công. Không thêm thư viện UI mới khi chưa thảo luận.
3. **Màu sắc dùng design token**, không hard-code: `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`… (không dùng `bg-white`, `bg-[#...]`, `text-slate-*`). Ngoại lệ: `MapView` được khoá sáng bằng class `force-light`.
4. **Điều hướng bằng `<Link>` / `<NavLink>`** (hoặc `useNavigate` khi là hành động), không dùng `<button>` để đổi trang.
5. **Trang mới** → tạo trong `src/features/<tên>/pages/<tên>-page.tsx`, khai báo route trong `src/app/router.tsx` **và** thêm mục vào `src/components/layout/nav.ts` nếu cần hiện trên menu. Trang **không** tự render `<main>`, Sidebar, header hay bottom nav — `AppLayout` lo việc đó (`<main>` chỉ có một).
6. **Icon-only button phải có `aria-label`.** Toggle dùng `aria-pressed`.
7. **Tách file nhỏ, đã format.** Mỗi component một khối rõ ràng; không dồn nhiều component vào một file hay một dòng dài. Chạy `npm run format` trước khi commit.
8. **Không gọi `fetch` hay `axios` trực tiếp trong component.** Mọi HTTP và Server State đi qua `src/features/<tên>/api/` kết hợp TanStack Query (`src/lib/api-client.ts` cho auth/chat/app với cookie tự động và `src/lib/http-client.ts`).
9. **Truy cập `localStorage`/`matchMedia` luôn có guard** (`try/catch`, kiểm tra `typeof window.matchMedia`), theo mẫu có sẵn trong `theme-provider.tsx`, `use-media-query.ts`.
10. **Không dùng `"use client"`, `next/*`** hay mẫu Next.js — đây là Vite SPA.
11. Code hết light theme trước dark tính sau
12. **Quy tắc phụ thuộc feature:** `app -> features -> components/hooks/lib/config`. App người dùng không được import từ `src/features/{admin,moderation,admin-moderation}`. Xem chi tiết tại [docs/architecture.md](docs/architecture.md).
13. **React Compiler:** Viết React thuần, tuân thủ Rules of React (không mutate state/props/context, không đọc/ghi `ref.current` lúc render, không gọi synchronous `setState` trong body effect). Không thêm `useMemo`/`useCallback` bừa bãi. Thư viện không tương thích (như `useReactTable`) gom vào component riêng và đánh dấu `'use no memo'` kèm comment lý do. Form dùng `useWatch({ control, name })` thay vì `watch()`.
## Mẫu hay gặp

```tsx
// Nút trông như Button nhưng là link
<Button render={<Link to="/" />} nativeButton={false}>Back to home</Button>

// Trigger của menu/dialog dùng nút shadcn
<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options" />}>
  <MoreHorizontal />
</DropdownMenuTrigger>

// Thông báo
import { toast } from 'sonner'
toast.success('Post shared')

// Mở dialog "Create Post" từ bất kỳ trang nào
const openCreate = useCreatePost() // components/layout/create-post-context.tsx
```

Kích thước `Button`: `default | xs | sm | lg | icon | icon-xs | icon-sm | icon-lg`. Icon trong `Button` tự có size nhỏ; chỉ đặt `size-*` khi cần khác.

## Cạm bẫy đã gặp (đừng lặp lại)

- **Chiều cao mobile:** thanh bottom nav chiếm `var(--bottom-nav-h)` (0 trên desktop). Trang cần full-height dùng `h-[calc(100dvh-var(--bottom-nav-h))]`, **không** dùng `min-h-screen`/`100vh`.
- **Sidebar không được làm co nội dung.** Rail 72px chiếm chỗ cố định; panel mở rộng phủ lên trên (xem [architecture](docs/architecture.md#sidebar)). Đừng đổi sang `hover:w-64` trên phần tử nằm trong flow.
- **Trạng thái responsive trong chat** do CSS (`hidden lg:flex`) + `mobileChatOpen`, không đổi component được mount. Đừng bỏ mount `ConversationList` khi chọn hội thoại.
- **Base UI khác Radix:** `DropdownMenuRadioItem`/`CheckboxItem` mặc định **không đóng menu** khi chọn (thêm `closeOnClick`). Component dùng prop `render={...}` thay cho `asChild`. `Select` cần `items={[{value,label}]}` để `SelectValue` hiện nhãn.
- **Hai dialog modal không được chồng nhau** (ví dụ Sheet + Dialog). Đóng lớp dưới trước khi mở lớp trên (xem `onReport` trong `chat-page.tsx`).
- **Test:** toast của Sonner xuất hiện hai lần trong DOM → dùng `findAllByText`. Menu/Select của Base UI cần `userEvent` (không dùng `fireEvent`). jsdom không có `matchMedia` → dùng `setViewport(true|false)` từ `src/test-setup.ts`.
- **Hai danh tính "tôi" khác nhau trong mock** (chat: `@minhanh`; profile/bài viết: `@minhnguyen`). Đừng giả định chúng là một cho tới khi có auth thật (xem roadmap).

## Cách giao việc cho AI hiệu quả

- Mỗi lần **một** vấn đề; nêu file, **hành vi hiện tại** và **hành vi mong muốn**.
- Với lỗi hành vi, mô tả các bước tái hiện thay vì chỉ nói "giao diện sai".
- Yêu cầu agent chạy 3 lệnh ở trên và nêu rõ cái gì đã kiểm tra, cái gì chưa (chưa xem trên trình duyệt thật).
