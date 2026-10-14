# UI guidelines (shadcn/ui + Base UI)

## Thiết lập

- `components.json`: style `base-nova`, thư viện nền **Base UI**, icon `lucide`, alias `@/components`, `@/components/ui`, `@/lib/utils`.
- Component chính thức import `cn` từ package **`"cn"`** (package của shadcn). `src/lib/utils.ts` re-export cùng hàm đó — dùng `import { cn } from '@/lib/utils'` trong code của app.
- Thêm component: `npx shadcn@latest add <tên>`. **Không chạy lại `init`** (có thể ghi đè token trong `index.css`).
- `src/components/ui/` do CLI quản lý và được Prettier bỏ qua (`.prettierignore`). Khi `add` báo trùng file, chỉ ghi đè nếu bạn không tuỳ biến — và nhớ áp lại dòng import trong `sonner.tsx` nếu bị đổi.

## Component đang có

`avatar` · `badge` · `button` · `dialog` · `dropdown-menu` · `input` · `select` · `separator` · `sheet` · `sonner` · `tabs` · `textarea` · `toggle`

| Cần | Dùng |
|---|---|
| Hộp thoại / xác nhận | `Dialog` (+ `DialogHeader/Title/Description/Footer`) |
| Ngăn kéo (panel mobile) | `Sheet` |
| Menu hành động `...` | `DropdownMenu` |
| Chọn một giá trị | `Select` |
| Bật/tắt | `Toggle` |
| Chuyển tab | `Tabs` (`TabsList variant="line"`) |
| Thông báo ngắn | `toast` từ `sonner` |
| Ô nhập | `Input`, `Textarea` |
| Số đếm/nhãn nhỏ | `Badge` |
| Ảnh đại diện | `Avatar` + `AvatarFallback` (`size="sm" \| default \| "lg"`) |

Chưa có (thêm khi cần): `tooltip`, `skeleton`, `scroll-area`, `popover`, `label`, `form`, `table`…

## Khác biệt Base UI so với Radix (hay gây lỗi)

| Chủ đề | Base UI (dự án này) |
|---|---|
| Đổi phần tử render | `render={<Link to="…" />}` (không phải `asChild`) |
| Nút giả làm link | `<Button render={<Link … />} nativeButton={false}>` |
| Trigger | `<DropdownMenuTrigger render={<Button … />}>` |
| `Select` hiện nhãn | truyền `items={[{ value, label }]}` lên `<Select>` |
| Radio/Checkbox item trong menu | **không tự đóng** → thêm `closeOnClick` nếu muốn đóng |
| Trạng thái | thuộc tính `data-open`, `data-pressed`, `aria-pressed`… (không phải `data-state`) |
| `onValueChange` của Select | có thể nhận `null` → kiểm tra trước khi dùng |

## Token màu & kiểu chữ

Dùng class ngữ nghĩa, không hard-code:

| Mục đích | Class |
|---|---|
| Nền trang / thẻ / vùng phụ | `bg-background` / `bg-card` / `bg-muted` |
| Chữ chính / phụ | `text-foreground` / `text-muted-foreground` |
| Viền | `border-border` |
| Hành động chính | `bg-primary text-primary-foreground` |
| Nguy hiểm | `text-destructive` / `variant="destructive"` |
| Vòng focus | `focus-visible:ring-3 focus-visible:ring-ring/50` |

Màu pastel của avatar (`bg-sky-100 text-sky-700`…) nằm trong dữ liệu mock và là trang trí; chấp nhận được ở cả hai theme.

## Mẫu code

```tsx
// Dialog có footer — để DialogFooter là con TRỰC TIẾP của DialogContent
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Share an update</DialogTitle>
      <DialogDescription>…</DialogDescription>
    </DialogHeader>
    <Textarea … />
    <DialogFooter>
      <Button variant="outline" onClick={…}>Cancel</Button>
      <Button onClick={…}>Post update</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Select
<Select value={radius} onValueChange={(v) => v && setRadius(v)}
        items={options.map((o) => ({ value: o, label: o }))}>
  <SelectTrigger size="sm" aria-label="Search radius"><SelectValue /></SelectTrigger>
  <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
</Select>

// Toggle có trạng thái đậm khi bật
<Toggle pressed={on} onPressedChange={setOn}
        className="aria-pressed:bg-primary aria-pressed:text-primary-foreground">…</Toggle>
```

## Accessibility tối thiểu

- Icon-only button: luôn `aria-label`.
- Danh sách chọn một hàng: dùng `aria-current` (xem `ConversationList`).
- Không lồng hai modal; Dialog/Sheet của Base UI đã xử lý focus trap và Esc.
- Chưa có audit a11y đầy đủ (xem roadmap).
