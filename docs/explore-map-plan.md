# Kế hoạch triển khai Bản đồ tương tác cho người dùng (Explore Map)

> Dành cho **người** (chốt quyết định, chuẩn bị) và **AI agent** (code theo từng pha, mỗi pha có prompt để copy). Đọc kèm `AGENTS.md`, `docs/architecture.md`, `docs/ui-guidelines.md` của dự án.
>
> **Phạm vi:** chỉ **frontend**, chạy bằng **mock data** sau các interface `service` (đổi sang API thật sau mà không sửa UI). **Chỉ cần theme sáng.** Giao diện này **thay thế phần mock map** trong trang Explore.
>
> **Công nghệ đã chốt:** Google Maps qua `@vis.gl/react-google-maps` · **deck.gl** cho lớp mật độ (heatmap) · **H3** (`h3-js`). API key và Map ID đã có.
>
> **Lưu ý về đường dẫn:** các đường dẫn "hiện có" dưới đây theo bản repo mà tài liệu này được viết (`src/pages/explore.tsx`, `src/components/explore/map-view.tsx`, `src/lib/mock-nearby.ts`, `src/components/post-card.tsx`, `src/components/profile-page.tsx`). **Agent phải đọc repo hiện tại trước** và báo nếu khác.

---

## 0. Cách dùng tài liệu

1. **Người:** chốt mục 2 (hoặc chấp nhận mặc định), làm mục 3 (chuẩn bị), commit tài liệu này vào repo (ví dụ `docs/explore-map-plan.md`).
2. **Agent:** mỗi phiên dán **Prompt nền (8.0)** + **prompt của pha**. Làm **từng pha**, không làm vượt pha.
3. Sau mỗi pha: `npx tsc -b && npm test && npm run build && npm run lint` (nếu repo có lint), xem trên trình duyệt thật với key thật, rồi cập nhật bảng "Trạng thái" cuối file.

---

## 1. Truy vết yêu cầu → hạng mục

| # | Yêu cầu | Hạng mục | Pha |
|---|---|---|---|
| R1 | Theo dõi **mật độ đăng bài** ở một khu vực; mặc định là khu vực hiện tại của người dùng | Lớp mật độ H3 (deck.gl) + vị trí khởi đầu (GPS → vị trí gần nhất đã lưu → mặc định) | P1, P2 |
| R2 | Click một **địa điểm** → modal: tên, số bài 1d/7d/30d, thời gian bài mới nhất, topic xu hướng, danh sách bài (sắp theo xu hướng gần đây), **filter thời gian**; click topic → trang feed của topic  | `PlaceMarkers` + `PlaceDetailModal`  | P3, P5 |
| R3 | **Không lộ vị trí chính xác của bài viết**; gắn với địa điểm chung (vd. "Đại học X") | Kiểu dữ liệu **không có toạ độ ở cấp bài viết**; mật độ gom theo địa điểm/ô H3; marker chỉ ở toạ độ **địa điểm** (mục 4.5) | P0 → mọi pha |
| R4 | Zoom đủ gần → **marker tên topic xu hướng**; click → modal các **card bài viết** (người đăng, ảnh đầu, một phần nội dung, "1 ngày trước"); click card → xem chi tiết ở feed | `TopicMarkers` + `TopicPostsModal` + `PostDetailPage` | P4, P5 |
| R5 | Đổi **bán kính** (1/3/5/10 km) và **chọn một vị trí** bất kỳ trên bản đồ | `RadiusControl`, vòng tròn bán kính, chế độ "Chọn vị trí" | P1 |
| R6 | Thao tác như **Google Maps thường** | Giữ điều khiển/cử chỉ mặc định (kéo, zoom, cuộn, nhấp đúp, Street View, loại bản đồ), nút "Vị trí của tôi" | P1 |
| R7 | **Tìm kiếm trên bản đồ** (luồng 7 bước): zoom gần → thấy tên địa điểm → bấm tên → danh sách kết quả; filter thời gian (giờ trước/1 ngày/ngày cụ thể) → kết quả đã lọc; mở chi tiết (bài viết kèm comment / trang cá nhân) | `PlaceFocusCard`, `MapSearchBar`, `SearchResultsPanel`, `TimeFilter`, `PostDetailPage`, `/users/:id` | P6, P5 |
| R8 | **Giảm giật lag / thời gian chờ** | Mục 7 (ngân sách hiệu năng + kỹ thuật) | P7 và xuyên suốt |
| R9 | Chỉ theme **sáng** | Ép sáng cho route Explore (3.4, P0) | P0 |

---

## 2. Quyết định cần chốt (kèm mặc định)

Agent **dùng mặc định** nếu chưa có trả lời.

| # | Câu hỏi | Mặc định |
|---|---|---|
| M1 | Thư viện React cho Google Maps | **`@vis.gl/react-google-maps`** (`APIProvider`, `Map`, `AdvancedMarker`, `useMap`). |
| M2 | Lớp mật độ | **Mặc định `HEATMAP`** (`HeatmapLayer` của deck.gl). Code `H3HexagonLayer` (`buildHexLayer`, `useDensity`, `Legend` dạng ô) **giữ nguyên** làm chế độ `HEX` và làm **dự phòng** (M16). Không xoá |
| M3 | "Địa điểm" và "topic" trong dữ liệu | **Địa điểm = một dòng `locations`** (tên, toạ độ công khai, `h3Index`). **Topic có thể khác hashtag** (danh sách topic xu hướng có thể chứa hashtag nhưng có thể chứa chủ đề ngoài hashtag khi người dùng không chủ động tag) của bài viết. Bài viết chỉ có `locationId` |
| M4 | Kích thước ô H3 theo zoom | Bảng 4.3 (cấu hình trong `map-config.ts`); độ phân giải tối đa = độ phân giải lưu trữ của địa điểm (mặc định 8) |
| M5 | Cửa sổ thời gian của lớp mật độ | Mặc định **7 ngày**, đổi được 1d / 7d / 30d (`ToggleGroup`) |
| M6 | Filter thời gian trong modal/kết quả tìm kiếm | Preset: **3 giờ qua, 1 ngày, 7 ngày, 30 ngày** + **chọn ngày cụ thể** (`dd/MM/yyyy`, múi giờ **Việt Nam UTC+7**). Chỉ lọc **danh sách bài viết**; "topic xu hướng" trong modal luôn tính theo 7 ngày |
| M7 | Hai loại "modal" ở độ zoom gần | `PlaceFocusCard` (thẻ nhẹ **không chặn bản đồ**, gợi ý bấm tên để tìm) khác `PlaceDetailModal` (modal đầy đủ khi click marker) |
| M8 | Chi tiết bài viết "ở feed" | Trang **`/posts/:postId`** (nội dung đầy đủ + comment). Topic → **`/feed/topic/:topic`**. Người dùng → **`/users/:userId`** |
| M9 | Lấy dữ liệu | Service interface + mock + (sau này) HTTP; **TanStack Query** và **axios (`lib/http-client`)**  |
| M10 | Vị trí khởi đầu | GPS (timeout 4 s, **không chặn render**) → vị trí gần nhất đã lưu (`localStorage`) → vị trí hồ sơ → mặc định Hà Nội |
| M11 | Quyền riêng tư mật độ | Ô có **dưới `MIN_POSTS_PER_CELL` (mặc định 3) bài** không hiển thị số cụ thể (hiện "ít"); server vẫn là nơi ép ngưỡng, FE chỉ phản ánh |
| M12 | Marker chủ đề | Marker DOM (`AdvancedMarker`) tối đa 40, có **loại bỏ chồng lấn**; vượt ngưỡng → chuyển sang lớp deck.gl `TextLayer` (P7) |
| M13 | Ngôn ngữ giao diện bản đồ | **Tiếng Việt** (thời gian tương đối: "2 giờ trước", "1 ngày trước") |
| M14 | Vị trí thư mục | `src/features/map/{api,components,pages,lib}` + primitives dùng chung `src/components/map/` (để heatmap admin tái dùng sau) |
| M15 | Nguồn dữ liệu của heatmap | **Giai đoạn thử:** phương án B — tái dùng `getDensity`, đổi ô H3 thành điểm tại tâm ô (`cellToLatLng`), `weight = count`. **Khi chốt:** phương án A — `getHeatPoints` trả điểm theo **toạ độ công khai của địa điểm** (đẹp hơn, không lộ lưới lục giác ở zoom thấp) |
| M16 | Chuyển chế độ & dự phòng | `ToggleGroup` "Mượt \| Ô lục giác", lưu vào URL (`d=heat\|hex`) và `localStorage`. **Tự chuyển về `HEX`** nếu thiết bị/trình duyệt không chạy được `HeatmapLayer` (thiếu WebGL2/float texture hoặc layer báo lỗi khởi tạo) và ghi nhớ lựa chọn |
---

## 3. Việc cần làm TRƯỚC khi agent bắt đầu

### 3.1. Thư viện npm (đã thêm)

```bash
npm i @vis.gl/react-google-maps h3-js
npm i @deck.gl/core @deck.gl/layers @deck.gl/geo-layers @deck.gl/google-maps
npm i @deck.gl/aggregation-layers      # chỉ khi làm HeatmapLayer tuỳ chọn (P7)
npm i -D @types/google.maps
```

- Dùng **`h3-js` v4** (tên hàm: `latLngToCell`, `cellToLatLng`, `cellToBoundary`, `cellToParent`, `gridDisk`) và kiểm tra khớp với peer dependency của `@deck.gl/geo-layers`. Không trộn v3/v4.
- Nếu các gói này đã được cài ở pha admin: chỉ kiểm tra phiên bản.

### 3.2. shadcn components (đã có thì bỏ qua)

```bash
npx shadcn@latest add dialog sheet tabs toggle-group popover calendar scroll-area skeleton tooltip badge avatar separator button input-group empty spinner alert
```
Thiếu component nào → **dừng và báo**, không tự viết. Không sửa tay `src/components/ui/*`.

### 3.3. Biến môi trường & Google Maps (cái này t đã thêm, không được đọc .env của tôi)

- `.env`: `VITE_GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_MAPS_MAP_ID` (đã có), `VITE_USE_MOCK=true`.
- **Map ID phải là kiểu vector và dùng style sáng** (Cloud-based map styling). Nếu Map ID là raster, lớp deck.gl chạy chế độ *overlaid* (kém mượt hơn) — agent kiểm tra `map.getRenderingType()` và ghi vào báo cáo.
- Key đã **giới hạn theo HTTP referrer** (thêm `http://localhost:5173/*` cho dev).
- `index.html`: thêm `<link rel="preconnect" href="https://maps.googleapis.com">` và `<link rel="preconnect" href="https://maps.gstatic.com" crossorigin>`.

### 3.4. Ép theme sáng cho route Explore

App có chuyển sáng/tối (`ThemeProvider`). Dialog/Sheet render qua **portal ra `<body>`** nên bọc `force-light` quanh trang là **không đủ**. Cách làm (Pha 0): thêm vào `theme-provider.tsx` một hook **`useForceLight()`** — khi component gắn kết, provider coi `resolvedTheme = 'light'` (bỏ class `dark` trên `<html>`), khi gỡ thì khôi phục; hỗ trợ nhiều component gọi cùng lúc (đếm tham chiếu). Chỉ **thêm**, không đổi API hiện có.

---

## 4. Kiến trúc

### 4.1. Cấu trúc thư mục

```
src/
├─ components/map/                       # PRIMITIVES dùng chung (admin heatmap tái dùng sau)
│  ├─ google-maps-provider.tsx           # APIProvider (key, language 'vi', region 'VN', loading async)
│  ├─ base-map.tsx                       # <Map> bọc: mapId, ánh sáng, tuỳ chọn cử chỉ, onIdle, ref bản đồ
│  ├─ map-context.tsx                    # Context: map instance, viewport (chỉ cập nhật khi idle), flyTo/fitBounds
│  ├─ deck-overlay.tsx                   # MỘT GoogleMapsOverlay + registry: useDeckLayers(id, layers)
│  ├─ h3-layers.ts                       # buildHexLayer, thang màu, zoom→resolution (hàm thuần)
│  ├─ geo.ts                             # haversine, radius→bounds, bounds→tile keys, latLng↔pixel (Mercator)
│  └─ map-types.ts                       # GeoPoint, LatLngBounds
└─ features/map/
   ├─ api/                               # map.service/.mock/.queries · feed.* · search.* · user.*  (+ mock/seed)
   ├─ components/                        # ExploreMap, DensityLayer, DensityControls, Legend, RadiusControl, LocateButton,
   │                                     # PlaceMarkers, TopicMarkers, CenterPin, MapSearchBar, PlaceFocusCard,
   │                                     # PlaceDetailModal, TopicPostsModal, SearchResultsPanel, TimeFilter,
   │                                     # PostCardCompact, PostFeedCard, TopicChip, CommentList
   ├─ pages/                             # ExplorePage, TopicFeedPage, PostDetailPage, PublicProfilePage
   └─ lib/                               # types.ts, map-config.ts, time-filter.ts, relative-time.ts, url-state.ts, labels.ts
```

### 4.2. Quy tắc phụ thuộc
- `features/map` dùng được: `components/ui`, `components/map`, `components/theme-provider`, `lib/utils`, `lib/http-client`. **Không** import từ `features/admin*`/`features/moderation`.
- `components/map` **không** import từ `features/*` (để admin dùng lại được).
- Giữ nguyên Trang chủ (`pages/home.tsx`, `PostCard`) — không di chuyển sang kiểu dữ liệu mới.

### 4.3. Cấu hình (`features/map/lib/map-config.ts`) — mọi ngưỡng ở một chỗ

```ts
export const MAP_CONFIG = {
  DEFAULT_CENTER: { latitude: 21.0285, longitude: 105.8542 },   // Hà Nội — chỉ là dự phòng cuối cùng
  RADIUS_OPTIONS_KM: [1, 3, 5, 10] as const,
  DEFAULT_RADIUS_KM: 3,
  MIN_ZOOM: 9, MAX_ZOOM: 19,
  // zoom → độ phân giải H3 (hàm thuần trong h3-layers.ts; res tối đa = STORED_H3_RESOLUTION)
  DENSITY_RES_BANDS: [{ minZoom: 9, res: 6 }, { minZoom: 11, res: 7 }, { minZoom: 13, res: 8 }],
  STORED_H3_RESOLUTION: 8,
  PLACE_MARKER_MIN_ZOOM: 13,     // hiện marker địa điểm
  TOPIC_MARKER_MIN_ZOOM: 15,     // hiện marker topic xu hướng (R4)
  PLACE_FOCUS_MIN_ZOOM: 17,      // hiện PlaceFocusCard (R7)
  PLACE_FOCUS_MAX_DISTANCE_M: 80,
  MAX_CELLS: 1500, MAX_PLACE_MARKERS: 60, MAX_TOPIC_MARKERS: 40,
  MIN_POSTS_PER_CELL: 3,         // M11
  FETCH_DEBOUNCE_MS: 250, STALE_TIME_MS: 60_000, GC_TIME_MS: 300_000,
  VIEWPORT_PADDING: 0.25,        // mở rộng bounds 25% mỗi phía khi gọi API
  GPS_TIMEOUT_MS: 4000,
} as const
```

| Zoom | Lớp hiển thị |
|---|---|
| 9–10 | Ô H3 độ phân giải **6** (cạnh ≈ 3,2 km) |
| 11–12 | Ô H3 **7** (≈ 1,2 km) + (≥ 12) chưa có marker |
| 13–14 | Ô H3 **8** (≈ 460 m) + **marker địa điểm** (tên, số bài) |
| 15–16 | Như trên + **marker topic xu hướng** |
| ≥ 17 | Như trên + **PlaceFocusCard** khi tâm bản đồ gần một địa điểm |

```ts
DENSITY_MODE_DEFAULT: 'HEATMAP' as 'HEATMAP' | 'HEX',
HEATMAP: {
  RADIUS_METERS: 450,             // bán kính ảnh hưởng ≈ cạnh ô H3 res 8; đổi sang pixel theo zoom (6.3b)
  RADIUS_PX_MIN: 24, RADIUS_PX_MAX: 80,
  INTENSITY: 1.2, THRESHOLD: 0.05,  // THRESHOLD cao hơn → ẩn quầng mờ ở vùng ít bài
  DEBOUNCE_MS: 250,               // debounceTimeout của HeatmapLayer
  MAX_POINTS: 3000,
  WEIGHT_TRANSFORM: 'sqrt',       // nén ngoại lệ để một điểm nóng không làm "cháy" cả bản đồ
  // Thang sáng: alpha 0 ở mức thấp nhất để nền bản đồ lộ ra (RGBA)
  COLOR_RANGE: [[255,255,178,0],[254,217,118,120],[254,178,76,160],[253,141,60,190],[240,59,32,210],[189,0,38,230]],
},
HOTSPOT_DOT_MIN_ZOOM: 10,         // chấm hotspot (không tên) để vào modal từ zoom thấp
HOTSPOT_DOT_LIMIT: 20,
// tuỳ chọn: PLACE_MARKER_MIN_ZOOM hạ từ 13 xuống 12 nếu chấm hotspot chưa đủ
```
Giá trị trên là **điểm khởi đầu để tinh chỉnh** bằng mắt với dữ liệu seed; ghi giá trị cuối cùng vào config.

### 4.4. Route & trạng thái URL

| Route | Trang |
|---|---|
| `/explore` | Bản đồ (thay mock hiện tại); lazy-load |
| `/feed/topic/:topic` | Feed theo topic (query: `placeId`, `lat`, `lng`, `r`, `t`, `sort`) |
| `/posts/:postId` | Chi tiết bài viết + bình luận |
| `/profile/:userId` | Trang cá nhân người khác |

`/explore` giữ trạng thái trong **search params**: `lat`, `lng`, `z`, `r` (km), `src` (`gps\|picked`), `w` (cửa sổ mật độ), `place` (mở `PlaceDetailModal`), `q` (mở kết quả tìm kiếm), `t` (filter thời gian). Quy tắc: **camera (`lat,lng,z`) cập nhật bằng `replace`, debounce ~600 ms, chỉ khi `idle`**; **`place`/`q` dùng `push`** để nút Back đóng modal/panel và quay lại từ trang chi tiết thì **mở lại đúng modal**.

`AppLayout`: ẩn `MobileHeader` ở `/explore` (như `/messages`) để bản đồ chiếm trọn chiều cao `h-[calc(100dvh-var(--bottom-nav-h))]`.

### 4.5. Quyền riêng tư vị trí (R3) — nguyên tắc cấu trúc

1. **Kiểu dữ liệu bài viết không có `latitude/longitude`** (mục 5). Bài viết chỉ có `place: { id, name }`.
2. Mật độ gom **theo địa điểm → ô H3** (không từ toạ độ người đăng). Ô nhỏ nhất = độ phân giải lưu trữ của địa điểm.
3. Marker (địa điểm, topic) đặt ở **toạ độ công khai của địa điểm**, không bao giờ ở nơi người đăng đứng.
4. Ô quá ít bài không hiện số (M11).
5. Có **kiểm tra ở mức kiểu** (mục 5.6) để không ai thêm toạ độ vào kiểu bài viết mà không bị lỗi biên dịch.
6. **Vị trí người xem** (chấm xanh GPS, tâm đã chọn) chỉ lưu ở thiết bị (`localStorage`), không gửi kèm khi tải chi tiết bài viết.

### 4.6. Luồng dữ liệu & trạng thái

```
ExplorePage (giữ: modal/panel đang mở, filter)
 └─ MapContext (map instance, viewport{center,zoom,bounds} = chỉ cập nhật ở 'idle')
     ├─ BaseMap
     │   ├─ DeckOverlay (1 instance) ◄─ useDeckLayers('density', [hexLayer])
     │   ├─ DensityLayer     → useDensity(viewport, window)          (TanStack Query)
     │   ├─ PlaceMarkers     → usePlaceMarkers(viewport) (zoom ≥ 13)
     │   ├─ TopicMarkers     → useTopicMarkers(viewport) (zoom ≥ 15)
     │   ├─ RadiusCircle, CenterPin, UserLocationDot
     └─ Overlays: controls (radius, locate, pick, window), MapSearchBar, PlaceFocusCard
        Modal/Panel: PlaceDetailModal · TopicPostsModal · SearchResultsPanel
```
- **Camera không nằm trong state React theo từng khung hình.** Đọc `bounds/zoom` ở sự kiện `idle`; trong lúc kéo/zoom chỉ Google Maps + deck.gl vẽ.
- Modal/panel mở **không** làm render lại cây bản đồ (state overlay ở `ExplorePage`, `ExploreMap` nhận callback ổn định).
- Mỗi `useQuery` truyền `signal` xuống service để **huỷ request cũ**; dùng `placeholderData: keepPreviousData` để **không nháy trắng** khi pan.

---

## 5. Kiểu dữ liệu (TypeScript)

`src/components/map/map-types.ts` (dùng chung) và `src/features/map/lib/types.ts`.

```ts
// ===== Nguyên thuỷ =====
export type Uuid = string
export type IsoDateTime = string                         // ISO 8601
export type GeoPoint = { latitude: number; longitude: number }
export type LatLngBounds = { north: number; south: number; east: number; west: number }
export type PageResponse<T> = { items: T[]; page: number; pageSize: number; total: number }   // page bắt đầu từ 1

// ===== Phạm vi khu vực người dùng quan tâm =====
export type RadiusKm = 1 | 3 | 5 | 10
export type CenterSource = 'GPS' | 'LAST_KNOWN' | 'PICKED' | 'DEFAULT'
export type MapScope = { center: GeoPoint; radiusKm: RadiusKm; source: CenterSource }
export type MapViewState = { center: GeoPoint; zoom: number; bounds: LatLngBounds }          // chỉ cập nhật khi 'idle'

// ===== Thời gian =====
export type StatsWindow = '1d' | '7d' | '30d'
export type TimePreset = '3h' | '1d' | '7d' | '30d'
export type TimeFilterValue =
  | { kind: 'all' }
  | { kind: 'preset'; preset: TimePreset }
  | { kind: 'date'; date: string }                       // 'YYYY-MM-DD' theo giờ Việt Nam (UTC+7)
export type TimeRange = { from?: IsoDateTime; to?: IsoDateTime }  // kết quả của resolveTimeFilter()

// ===== Địa điểm & topic (M3) =====
export type MapPlace = {
  id: Uuid; name: string; locationType: string           // locations.location_type (chuỗi tự do)
  center: GeoPoint                                         // toạ độ CÔNG KHAI của địa điểm
  h3Index: string
  postCount: number                                        // theo cửa sổ hiện tại
  trendScore: number
  topTopic?: string
}
export type TrendingTopic = { name: string /* hashtag, không có '#' */; postCount: number; score: number; changePct?: number }
export type PlaceCounts = { last1d: number; last7d: number; last30d: number }
export type PlaceSummary = {
  place: MapPlace & { description?: string }
  counts: PlaceCounts
  latestPostAt?: IsoDateTime                               // thời gian bài MỚI NHẤT
  trendingTopics: TrendingTopic[]                          // top ~10, cửa sổ 7 ngày
}

// ===== Mật độ H3 =====
export type DensityQuery = { bounds: LatLngBounds; resolution: number; window: StatsWindow }
export type DensityCell = { h3Index: string; count: number }
export type DensityResponse = {
  resolution: number; window: StatsWindow
  cells: DensityCell[]                                     // đã gom + áp ngưỡng riêng tư; ≤ MAX_CELLS
  maxCount: number; totalPosts: number; generatedAt: IsoDateTime
}

// ===== Marker =====
export type PlaceMarkersQuery = { bounds: LatLngBounds; limit: number; window: StatsWindow }
export type TopicMarker = {
  id: string                                               // `${placeId}:${topic}`
  placeId: Uuid; placeName: string; topic: string
  postCount: number; score: number
  position: GeoPoint                                       // = toạ độ địa điểm (R3)
}
export type TopicMarkersQuery = { bounds: LatLngBounds; limit: number; window: StatsWindow }

// ===== Bài viết — KHÔNG có toạ độ (R3) =====
export type AuthorRef = { id: Uuid; displayName: string; avatarUrl?: string }
export type PlaceRef = { id: Uuid; name: string }
export type PostCardData = {
  id: Uuid; author: AuthorRef
  excerpt: string                                          // ≤ 160 ký tự (cắt ở server/mock)
  firstImageUrl?: string; imageCount: number
  createdAt: IsoDateTime
  place: PlaceRef; topics: string[]
  likeCount: number; commentCount: number
}
export type PostDetail = Omit<PostCardData, 'excerpt' | 'firstImageUrl'> & {
  content: string; imageUrls: string[]; sharedPost?: PostCardData
  likedByMe: boolean; savedByMe: boolean
}
export type CommentItem = { id: Uuid; postId: Uuid; author: AuthorRef; content: string; createdAt: IsoDateTime; parentCommentId?: Uuid; replyCount: number }

export type PostSort = 'TRENDING' | 'NEWEST'
export type PlacePostsQuery = { placeId: Uuid; time: TimeFilterValue; sort: PostSort; topic?: string; page: number; pageSize: number }
export type FeedScope =
  | { kind: 'place'; placeId: Uuid }
  | { kind: 'area'; center: GeoPoint; radiusKm: RadiusKm }
export type TopicFeedQuery = { topic: string; scope: FeedScope; time: TimeFilterValue; sort: PostSort; page: number; pageSize: number }

// ===== Tìm kiếm (R7) =====
export type SearchKind = 'POST' | 'USER' | 'PLACE'
export type MapSearchQuery = {
  q: string
  scope?: { placeId?: Uuid; center?: GeoPoint; radiusKm?: RadiusKm }
  time: TimeFilterValue; kinds: SearchKind[]; page: number; pageSize: number
}
export type PostHit = { kind: 'POST' } & PostCardData
export type UserHit = { kind: 'USER'; id: Uuid; displayName: string; avatarUrl?: string; bio?: string }
export type PlaceHit = { kind: 'PLACE'; id: Uuid; name: string; locationType: string; center: GeoPoint; postCount: number }
export type SearchResponse = { q: string; posts: PageResponse<PostHit>; users: UserHit[]; places: PlaceHit[] }

// ===== Trang cá nhân người khác =====
export type PublicProfile = { id: Uuid; displayName: string; avatarUrl?: string; bio: string; followerCount: number; followingCount: number; postCount: number }
```

```ts
// chế độ mật độ
export type DensityMode = 'HEATMAP' | 'HEX'

// Điểm nhiệt: CHỈ 2 trường. position = toạ độ CÔNG KHAI của địa điểm (hoặc tâm ô ở phương án B).
export type HeatPoint = { position: GeoPoint; weight: number }
export type HeatPointsQuery = { bounds: LatLngBounds; window: StatsWindow; limit: number }
export type HeatPointsResponse = { points: HeatPoint[]; maxWeight: number; totalPosts: number; window: StatsWindow; generatedAt: IsoDateTime }

// MapService thêm (phương án A):
getHeatPoints(q: HeatPointsQuery, o?: RequestOptions): Promise<HeatPointsResponse>
```


### 5.1. Service interface (mock-first, đổi HTTP sau)

```ts
export type RequestOptions = { signal?: AbortSignal }
export interface MapService {
  getDensity(q: DensityQuery, o?: RequestOptions): Promise<DensityResponse>
  getPlaceMarkers(q: PlaceMarkersQuery, o?: RequestOptions): Promise<MapPlace[]>
  getTopicMarkers(q: TopicMarkersQuery, o?: RequestOptions): Promise<TopicMarker[]>
  getPlaceSummary(placeId: Uuid, o?: RequestOptions): Promise<PlaceSummary>
  getPlacePosts(q: PlacePostsQuery, o?: RequestOptions): Promise<PageResponse<PostCardData>>
}
export interface FeedService {
  getTopicFeed(q: TopicFeedQuery, o?: RequestOptions): Promise<PageResponse<PostCardData>>
  getPost(id: Uuid, o?: RequestOptions): Promise<PostDetail>
  getComments(postId: Uuid, p: { page: number; pageSize: number }, o?: RequestOptions): Promise<PageResponse<CommentItem>>
  addComment(postId: Uuid, content: string, parentCommentId?: Uuid): Promise<CommentItem>    // mock: thêm vào bộ nhớ
}
export interface SearchService { search(q: MapSearchQuery, o?: RequestOptions): Promise<SearchResponse> }
export interface UserService {
  getPublicProfile(id: Uuid, o?: RequestOptions): Promise<PublicProfile>
  getUserPosts(id: Uuid, p: { page: number; pageSize: number }, o?: RequestOptions): Promise<PageResponse<PostCardData>>
}
```
Chọn mock/HTTP bằng `import.meta.env.VITE_USE_MOCK`, theo mẫu service của các feature khác. Khoá query: `['map', <module>, …]`.

### 5.2. Hàm thuần bắt buộc (có test)
- `resolveTimeFilter(filter, now): TimeRange` — `preset` = `[now − n, now]`; `date` = `[YYYY-MM-DDT00:00:00+07:00, YYYY-MM-DDT23:59:59.999+07:00]`.
- `formatRelativeVi(iso, now)`: `< 60 s` → "vừa xong"; `< 60 phút` → "n phút trước"; `< 24 giờ` → "n giờ trước"; `< 7 ngày` → "n ngày trước"; còn lại `dd/MM/yyyy`.
- `zoomToResolution(zoom)` theo `DENSITY_RES_BANDS`, chặn bởi `STORED_H3_RESOLUTION`.
- `radiusToBounds(center, km)`, `haversineMeters(a, b)`, `padBounds(bounds, ratio)`, `latLngToPixel(...)` (Web Mercator).

### 5.3. Dữ liệu mock (xác định)
`features/map/api/mock/seed.ts` sinh bằng **PRNG có seed** (không `Math.random()`/`Date.now()` trong seed; "now" truyền vào): ~40 **địa điểm** quanh Hà Nội (Cầu Giấy, Hoàn Kiếm, Đống Đa, Hà Đông, Thanh Xuân, Tây Hồ; loại: trường đại học, quán cà phê, công viên, trung tâm thương mại…), `h3Index` ở res 8 (`latLngToCell`), ~25 tác giả, ~20 hashtag tiếng Việt, ~800 bài rải 45 ngày (một số địa điểm "nóng" có nhiều bài gần đây), bình luận cho vài bài. Mock service thực hiện **đúng logic server**: gom theo ô H3 (`cellToParent`), lọc theo `bounds`/cửa sổ, áp `MIN_POSTS_PER_CELL`, `score` = số bài trong cửa sổ có trọng số theo độ mới, độ trễ giả 150–400 ms, huỷ được bằng `AbortSignal`. Ảnh dùng URL placeholder theo seed (ví dụ `https://picsum.photos/seed/<id>/600/400`).

### 5.4. Kiểm tra quyền riêng tư ở mức kiểu (R3)
```ts
type HasKey<T, K extends string> = K extends keyof T ? true : false
type Expect<T extends true> = T
export type _NoGeoOnPost = Expect<HasKey<PostCardData, 'latitude' | 'longitude' | 'location' | 'coordinate'> extends false ? true : false>
```
(đặt trong `features/map/lib/types.test-d.ts` hoặc cuối `types.ts`; lỗi biên dịch nếu ai thêm toạ độ vào `PostCardData`/`PostDetail`).
Kiểm tra quyền riêng tư ở mức kiểu (đặt cạnh `_NoGeoOnPost`):
```ts
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false
export type _HeatPointShape = Expect<Equal<keyof HeatPoint, 'position' | 'weight'>>
```

Hàm thuần mới (có test): `cellsToHeatPoints(cells)` (phương án B; **chú ý `cellToLatLng` trả `[lat, lng]`** còn deck.gl cần `[lng, lat]`), `radiusPixelsForZoom(zoom, latitude)` = `clamp(RADIUS_METERS / metersPerPixel, MIN, MAX)` với `metersPerPixel = 156543.03392 * cos(lat°) / 2^zoom`, `transformWeight(count)`.


---

## 6. Đặc tả giao diện & hành vi

### 6.1. Bố cục `ExplorePage`

- bố cục ban đầu giống explore.tsx trong frontend, nhưng nó nút để chuyển sang chế độ tràn khung như mô tả bên dưới:
- Bản đồ **tràn khung** (`h-[calc(100dvh-var(--bottom-nav-h))]`), nền chờ `#e5e3df` + skeleton nhẹ (chỉ hiện chữ "Đang tải bản đồ…" nếu quá 800 ms).
- **Góc trái trên:** `MapSearchBar` (ô tìm + gợi ý địa điểm) và dưới nó hàng chip **bán kính** `1 km · 3 km · 5 km · 10 km` (`ToggleGroup`).
- **Góc phải trên:** nút **"Vị trí của tôi"** (`LocateButton`), nút **"Chọn vị trí"** (chế độ chọn tâm), chọn **cửa sổ mật độ** `Hôm nay · 7 ngày · 30 ngày`. Tránh đè lên điều khiển mặc định của Google (đặt Google controls ở `RIGHT_BOTTOM`/`LEFT_BOTTOM`).
- **Góc trái dưới:** `Legend` mật độ (Ít → Nhiều, thang 5 mức).
- **Trung tâm dưới:** `PlaceFocusCard` (khi áp dụng).
- **Mobile:** các nút gọn thành biểu tượng; modal/panel là **bottom sheet** (`Sheet side="bottom"`, ~85dvh); desktop dùng `Dialog` (modal) và panel trái cho kết quả tìm kiếm.


### 6.2. Bản đồ cơ bản (R5, R6, R9)
- `Map` với `mapId` (style sáng, vector), `colorScheme` sáng nếu thư viện hỗ trợ, `gestureHandling: 'greedy'`, `clickableIcons: false` (**không** để POI của Google cướp click), `minZoom/maxZoom` theo cấu hình, `language="vi"`, `region="VN"`.
- **Giữ điều khiển mặc định như Google Maps:** zoom +/−, Street View, loại bản đồ, toàn màn hình; kéo, cuộn, chụm, nhấp đúp, xoay/nghiêng (vector).
- **Vị trí khởi đầu (M10):** hiển thị ngay ở vị trí gần nhất đã lưu/mặc định → khi GPS trả về và người dùng **chưa tương tác**, `panTo` vị trí GPS. GPS bị từ chối/timeout → toast nhẹ "Không lấy được vị trí, đang dùng vị trí gần nhất" (không chặn).
- **Chấm xanh GPS** (vị trí của tôi) + **vòng tròn bán kính** quanh **tâm khu vực** (`Circle`, viền màu chủ đạo, nền trong suốt ~8%). Đổi bán kính → vẽ lại vòng tròn và `fitBounds` vừa vòng tròn (có đệm).
- **Chọn vị trí:** bấm "Chọn vị trí" → con trỏ chữ thập, **lần click kế tiếp** đặt **tâm khu vực** (`source = 'PICKED'`, hiện `CenterPin`), tự thoát chế độ; bấm "Vị trí của tôi" để quay về GPS. Có thể thêm **nhấn giữ/chuột phải → "Đặt làm tâm khu vực"** (tuỳ chọn, P7). Lưu tâm gần nhất vào `localStorage` (try/catch).
- **Phạm vi bán kính vs dữ liệu:** dữ liệu mật độ tải theo **khung nhìn** (để kéo bản đồ không bị "hết dữ liệu"); ô **nằm trong vòng tròn** vẽ đậm, ô ngoài vòng tròn vẽ mờ (alpha ~35%).

### 6.3. Lớp mật độ H3 (R1)
- `DensityLayer` gọi `useDensity({ bounds: padBounds(viewport.bounds), resolution: zoomToResolution(zoom), window })` khi **idle** (debounce `FETCH_DEBOUNCE_MS`).
- Vẽ bằng `H3HexagonLayer` (`getHexagon: d => d.h3Index`), `stroked: false`, `extruded: false`, `coverage ≈ 0.95`, màu theo thang **sqrt** của `count/maxCount` (5 mức, vàng nhạt → cam → đỏ, alpha 0.45–0.7 để thấy tên đường).
- **Hover** ô → tooltip nhỏ "≈ N bài trong {cửa sổ}" (ô dưới ngưỡng riêng tư: "Ít bài"); **click** ô ở zoom < 13 → phóng vào ô (zoom +2); ≥ 13 không làm gì.
- Trạng thái: **loading lần đầu** (skeleton bản đồ + dải "Đang tải mật độ…" mỏng ở đỉnh); **đổi vùng** → giữ lớp cũ mờ nhẹ tới khi dữ liệu mới về (không nháy trắng); **rỗng** → chip "Chưa có bài viết trong vùng này"; **lỗi** → chip có nút "Thử lại" (không chặn bản đồ).
- `Legend` hiển thị thang, đơn vị "bài / ô" và cửa sổ đang chọn.

### 6.3b. Lớp mật độ dạng Heatmap (chế độ `HEATMAP`)

- **File mới:** `components/map/heatmap-layers.ts` (thuần: `buildHeatmapLayer(points, opts)`, `radiusPixelsForZoom`, `supportsHeatmap()`); **không sửa** `h3-layers.ts`. `features/map/components/density-layer.tsx` trở thành **bộ chuyển chế độ**: `HEATMAP` → `useHeatPoints` (hoặc `useDensity` + `cellsToHeatPoints` ở phương án B), `HEX` → code Pha 2 như cũ. Cả hai đăng ký qua **cùng** `useDeckLayers('density', …)`; **không** tạo lại `GoogleMapsOverlay` khi đổi chế độ.
- **Nạp động:** `@deck.gl/aggregation-layers` chỉ `import()` khi lần đầu dùng `HEATMAP`; `@deck.gl/geo-layers` chỉ khi dùng `HEX`.
- **Thuộc tính layer:** `id: 'density'`, `data: points`, `getPosition: p => [p.position.longitude, p.position.latitude]` (**lng, lat**), `getWeight: p => transformWeight(p.weight)`, `aggregation: 'SUM'`, `radiusPixels: radiusPixelsForZoom(zoom, centerLat)`, `intensity`, `threshold`, `colorRange` (6.3b/4.3), `debounceTimeout`, `pickable: false`. Cập nhật `radiusPixels` **chỉ khi `idle`** (như mọi state camera khác).
- **Màu ổn định khi pan:** `HeatmapLayer` mặc định chuẩn hoá theo giá trị lớn nhất **trong khung nhìn** nên màu đổi khi kéo bản đồ. Nếu phiên bản deck.gl đang dùng có `colorDomain`, đặt **miền cố định** theo cửa sổ (1d/7d/30d) lấy từ dữ liệu seed (ghi vào config). Nếu không có, chấp nhận thang tương đối và ghi rõ trên `Legend`.
- **Chế độ interleaved/overlaid:** `GoogleMapsOverlay` chỉ đặt được `interleaved` lúc khởi tạo. **Thử `HeatmapLayer` ở cả hai chế độ** trên bản đồ vector; nếu interleaved bị nhấp nháy/lỗi thì **ép overlaid cho cả hai chế độ** (ghi vào báo cáo).
- **Legend:** thanh gradient `Ít → Nhiều` + nhãn "Cường độ tương đối trong khung nhìn" (hoặc "Cường độ" nếu có `colorDomain` cố định). Bỏ tooltip hover ở chế độ này.
- **Thay cho "hover/click ô":** từ `HOTSPOT_DOT_MIN_ZOOM` đến `PLACE_MARKER_MIN_ZOOM` hiện **chấm hotspot** (không tên, kích thước theo `trendScore`, tối đa `HOTSPOT_DOT_LIMIT`) từ `getPlaceMarkers`; click chấm → mở `PlaceDetailModal` hoặc phóng vào địa điểm. Click vào vùng nhiệt không có chấm: không làm gì (double-click zoom mặc định của Google vẫn hoạt động).
- **Vòng tròn bán kính:** vẫn vẽ; **không** làm mờ vùng ngoài vòng (chỉ ở chế độ `HEX`).
- **Quyền riêng tư:** điểm chỉ là toạ độ công khai của địa điểm (hoặc tâm ô); server vẫn bỏ địa điểm dưới ngưỡng (M11 áp cho địa điểm ở phương án A). Không bao giờ thêm trường nào khác vào `HeatPoint`.
- **Dự phòng:** `supportsHeatmap()` (WebGL2 + khả năng texture dấu phẩy động theo tài liệu của phiên bản deck.gl đang dùng) trả `false`, hoặc layer ném lỗi khi khởi tạo → tự chuyển `HEX`, hiện toast nhẹ một lần, lưu lựa chọn vào `localStorage`.
- **Nạp dữ liệu:** `getHeatPoints` dùng cùng cơ chế với `useDensity` (bounds đệm 25% + làm tròn, debounce, `AbortSignal`, `keepPreviousData`), giới hạn `MAX_POINTS`.

### 6.4. Marker địa điểm & `PlaceDetailModal` (R2)
- Từ zoom ≥ 13: chấm/pill địa điểm (tên rút gọn + số bài) bằng `AdvancedMarker`, tối đa `MAX_PLACE_MARKERS`, ưu tiên `trendScore` cao; loại bỏ chồng lấn (6.5).
- **Click marker** → mở `PlaceDetailModal` (`?place=<id>`):
  1. **Đầu:** tên địa điểm, nhãn loại (map `locationType` → tiếng Việt, loại lạ hiển thị nguyên văn), mô tả ngắn.
  2. **Thống kê:** ba ô **1 ngày · 7 ngày · 30 ngày** (số bài) và dòng **"Bài mới nhất: 2 giờ trước (23/09/2026 14:05)"**.
  3. **Topic xu hướng** (chip `#tốtnghiệp · 12`): click → `/feed/topic/<topic>?placeId=<id>` (R2).
  4. **Filter thời gian** (`TimeFilter`, 6.7) đặt phía trên danh sách bài.
  5. **Danh sách bài** (`PostCardCompact`, 10/lần, nút "Xem thêm"), mặc định **sắp theo xu hướng gần đây** (`TRENDING`), có công tắc "Mới nhất"; click card → `/posts/:id`.
  6. Trạng thái: skeleton, rỗng ("Chưa có bài viết trong khoảng thời gian này"), lỗi + thử lại.
- Đóng modal: Esc/nút đóng/Back; **không** làm mất vị trí camera.

### 6.5. Marker topic xu hướng & `TopicPostsModal` (R4)
- Từ zoom ≥ 15: với mỗi địa điểm trong khung nhìn lấy **topic hàng đầu**; marker dạng **pill** `#tốtnghiệp · 12` đặt ở toạ độ địa điểm; tối đa `MAX_TOPIC_MARKERS`.
- **Loại bỏ chồng lấn (greedy):** sắp theo `score` giảm dần, đổi toạ độ sang pixel (`latLngToPixel`), bỏ marker có hộp bao (xấp xỉ theo độ dài nhãn) chồng lên marker đã chọn; thực hiện **sau `idle`**, độ phức tạp O(n²) với n ≤ ~100.
- **Click marker** → `TopicPostsModal`: tiêu đề `#topic · {tên địa điểm}`, `TimeFilter`, lưới/danh sách **`PostCardCompact`**: **avatar + tên người đăng**, **ảnh đầu** (nếu có; tỉ lệ cố định 4:3, lazy), **một phần nội dung** (tối đa ~3 dòng), **thời gian tương đối** ("1 ngày trước"), số like/bình luận. Click card → `/posts/:id`; nút "Xem tất cả bài về #topic" → `/feed/topic/:topic?placeId=…`.

### 6.6. `PlaceFocusCard` & tìm kiếm (R7)
Luồng 7 bước của yêu cầu ánh xạ như sau:

| Bước yêu cầu | Triển khai |
|---|---|
| 1. Kéo gần tới khu vực cần tìm | Người dùng zoom ≥ 17 |
| 2. Hệ thống hiện modal tên địa điểm | Khi `idle`, tìm địa điểm gần **tâm bản đồ** trong `PLACE_FOCUS_MAX_DISTANCE_M` (dùng danh sách marker đã tải, **không gọi API thêm**) → hiện `PlaceFocusCard` (không chặn bản đồ): "📍 **Đại học X** · 128 bài trong 7 ngày" |
| 3. Bấm vào tên đó | Click tên → mở **`SearchResultsPanel`** với `q = tên địa điểm`, `scope.placeId` (`?q=…&place=…`) |
| 4. Danh sách kết quả | Tab **Bài viết · Người dùng · Địa điểm** (mặc định "Bài viết"). Mỗi bài: dòng đầu nội dung, tác giả, **"(đăng 1 ngày trước)"**, tên địa điểm |
| 5. Bấm filter, chọn ngày/giờ trước/1 ngày trước | `TimeFilter`: **Vài giờ trước** (3 giờ), **1 ngày trước**, 7 ngày, 30 ngày, **Chọn ngày** (lịch, `23/09/2026`) |
| 6. Kết quả đã lọc theo thời gian | Gọi lại `search()` với `time`; hiển thị ngày đăng khi lọc theo ngày cụ thể |
| 7. Mở chi tiết | **Bài viết** → `/posts/:id` (có bình luận bên dưới); **Người dùng** → `/users/:id`; **Địa điểm** → bay tới địa điểm + mở `PlaceDetailModal` |

`MapSearchBar` cũng cho tìm theo **từ khoá bất kỳ** (không cần zoom gần): gợi ý địa điểm trùng tên khi gõ (debounce 250 ms), Enter → `SearchResultsPanel` với `scope` = khu vực hiện tại (tâm + bán kính). Từ khoá rỗng → không gọi API.

### 6.7. `TimeFilter` (dùng chung: modal địa điểm, topic modal, kết quả tìm kiếm, feed topic)
Nút hiển thị giá trị hiện tại ("1 ngày trước", "23/09/2026") → `Popover`: danh sách preset (`3h`, `1d`, `7d`, `30d`, "Tất cả") + `Calendar` chọn **một ngày** (không cho chọn ngày tương lai). Điều khiển được bằng bàn phím; giá trị lưu vào URL (`t=1d` hoặc `t=2026-09-23`). Phát ra `TimeFilterValue`; không tự gọi API (cha dùng `resolveTimeFilter`).

### 6.8. `TopicFeedPage` — `/feed/topic/:topic`
- Header `#topic`; chip phạm vi: "tại {địa điểm}" (nếu có `placeId`, bấm × để bỏ) hoặc "quanh bạn ({r} km)"; `TimeFilter`; công tắc `Xu hướng / Mới nhất`.
- Danh sách `PostFeedCard` (cuộn vô hạn 10/lần hoặc nút "Xem thêm"), skeleton/rỗng/lỗi; click → `/posts/:id`. Nút quay lại về `/explore` với trạng thái cũ (Back).

### 6.9. `PostDetailPage` — `/posts/:postId`
- `PostFeedCard` đầy đủ: tác giả (→ `/users/:id`), **địa điểm** (chip → `/explore?place=<id>`, **chỉ tên, không toạ độ**), thời gian tương đối + ngày đầy đủ khi rê chuột, nội dung đầy đủ, **ảnh** (lưới, lazy), topic (chip → feed), like/lưu/chia sẻ (dùng `posts-context` theo id nếu phù hợp).
- **Bình luận bên dưới:** danh sách (10/lần), trả lời 1 cấp, ô nhập bình luận (mock thêm vào bộ nhớ), skeleton/rỗng.

### 6.10. `PublicProfilePage` — `/users/:userId`
Tối thiểu: ảnh đại diện, tên, bio, số người theo dõi/đang theo dõi/bài viết, danh sách bài (`PostCardCompact`). Nếu `ProfilePage` hiện có tái dùng được (props `profile`, `isOwnProfile={false}`) thì tái dùng; nếu không, tạo trang đơn giản riêng — **không** làm lan sang sửa `ProfilePage`.

### 6.11. Truy cập & bàn phím
- Marker có `aria-label` ("Địa điểm Đại học X, 128 bài viết", "Chủ đề tốtnghiệp tại Đại học X"); focus được và kích hoạt bằng Enter/Space.
- Modal/Sheet dùng shadcn (đã có focus trap + Esc). Vùng tải dữ liệu có `aria-live="polite"` ("Đang tải dữ liệu khu vực" / "Đã tải xong").
- **Chế độ danh sách thay thế** (P7): nút "Xem dạng danh sách" mở `Sheet` liệt kê địa điểm/topic trong khung nhìn — hữu ích cho trình đọc màn hình và máy yếu.

---

## 7. Hiệu năng & giảm giật lag / thời gian chờ

### 7.1. Ngân sách (đo trên máy tầm trung, mạng 4G giả lập)

| Chỉ số | Mục tiêu |
|---|---|
| Bản đồ nhìn thấy (gạch nền hiện) kể từ lúc vào `/explore` | ≤ 1,5 s (mạng tốt) / ≤ 3 s (4G) |
| Lớp mật độ vẽ xong sau khi bản đồ `idle` | ≤ 800 ms (cache trống) / ≤ 100 ms (cache có) |
| Kéo/zoom | ≥ 55 FPS, không có *long task* > 50 ms |
| Request đồng thời cho mỗi lớp | ≤ 1 (request cũ bị huỷ) |
| Số marker DOM | ≤ 100 (place ≤ 60, topic ≤ 40) |

Đo bằng Chrome Performance + `performance.mark('map:ready' | 'map:density-first-paint')` (chỉ bật ở dev, có HUD nhỏ hiển thị).

### 7.2. Giảm thời gian chờ ban đầu
1. **Lazy-load** route `/explore` (`React.lazy`) và **tải trước khi rê/focus/chạm** vào mục Explore ở Sidebar/BottomNav (`import()` + `prefetch`).
2. `preconnect` tới `maps.googleapis.com`, `maps.gstatic.com` (3.3). Tải Google Maps **một lần**, `loading=async`, chỉ nạp thư viện cần (`maps`, `marker`).
3. **Dynamic import deck.gl + h3-js** sau khi bản đồ `idle` lần đầu (bản đồ hiện trước, lớp mật độ đến sau); chunk riêng.
4. **Không chờ GPS**: render ngay tại vị trí đã lưu/mặc định, `panTo` khi GPS về (M10). Lưu `lastView` (`center`, `zoom`, `radius`) vào `localStorage`.
5. **Skeleton/nền chờ** màu giống nền bản đồ để không giật bố cục; không hiện spinner toàn trang.
6. Dữ liệu ban đầu: gọi `density` + `placeMarkers` **song song** ngay khi có `viewport` đầu tiên.

### 7.3. Giảm giật khi kéo/zoom
1. **Chỉ cập nhật state React ở `idle`** (không dùng `onBoundsChanged`/`onCenterChanged` để setState). Lưu camera trong `ref` khi cần.
2. **Debounce 250 ms + huỷ request cũ** (`AbortSignal`); `keepPreviousData`; **mở rộng bounds 25%** và **làm tròn bounds** để khoá query ổn định (nhiều lần pan nhỏ trúng cache).
3. **Một `GoogleMapsOverlay` duy nhất**, cập nhật bằng `setProps({ layers })`, **không tạo lại** overlay hay đổi `id` layer. Dọn dẹp (`setMap(null)`, `finalize()`) khi gỡ.
4. Chế độ `interleaved` khi bản đồ là vector (mượt hơn, đồng bộ camera); *overlaid* khi raster.
5. Layer deck.gl: `stroked: false`, `extruded: false`, `pickable` chỉ khi cần hover/click, màu là **mảng hằng** hoặc accessor + `updateTriggers`; tắt `transitions` ở lần vẽ đầu; giới hạn `MAX_CELLS`; giảm `useDevicePixels` (≤ 1,5) trên máy yếu.
6. **Hover tooltip cập nhật bằng DOM trực tiếp** (ref + `requestAnimationFrame`), không `setState` cho mỗi lần di chuột.
7. **Marker DOM ít và nhẹ**: dùng `AdvancedMarker` (không dùng `Marker` cũ, không `InfoWindow`), nội dung chỉ là text + 1 lớp CSS, loại chồng lấn, ẩn khi zoom thấp. Vượt ngưỡng → `TextLayer` của deck.gl.
8. **React Compiler:** tạo layer/overlay/listener **trong `useEffect`**, không đọc `ref.current` khi render, không mutate đối tượng Google/deck trong render. Không thêm `useMemo/useCallback` theo thói quen.
9. Modal/panel mở **không** render lại cây bản đồ (4.6).

### 7.3b. Riêng cho `HeatmapLayer`
1. Chi phí chủ yếu tỉ lệ với **số pixel màn hình × `radiusPixels`**, không phải số điểm → giữ `RADIUS_PX_MAX` hợp lý và **giới hạn `useDevicePixels` ≤ 1,5** trên màn hình mật độ cao; máy yếu (7.6) giảm `RADIUS_PX_MAX` và đặt `useDevicePixels = 1`.
2. Khi kéo bản đồ, layer **gom lại trọng số sau `debounceTimeout`** nên có thể thấy hình giãn nhẹ trong lúc kéo; thử 150–300 ms để cân bằng giữa mượt và đúng.
3. Đổi chế độ HEATMAP ↔ HEX **không** tạo lại overlay (chỉ đổi layer cùng `id`); chunk của chế độ không dùng **không** được nạp.
4. Tile hoá (7.4.3) với điểm theo địa điểm **đơn giản hơn** ô H3: mỗi địa điểm thuộc đúng một tile nên chỉ cần nối mảng điểm (không cộng `count` theo `h3Index`); ở phương án B vẫn cộng theo `h3Index` như cũ.

### 7.4. Dữ liệu & mạng
1. **Server gom sẵn** (ô H3, topic, địa điểm) — FE **không bao giờ** nhận điểm thô; giới hạn `MAX_CELLS`, `limit` marker.
2. **Cache:** `staleTime 60 s`, `gcTime 5 phút`; header `Cache-Control: max-age=30` + `ETag` cho `density`; nén Brotli/gzip.
3. **Chia theo ô (tile) + prefetch** (P7): chia khung nhìn thành tile theo `z/x/y` (tile zoom = `floor(zoom) − 2`), mỗi tile là một query riêng → tái dùng cache khi pan; prefetch tile lân cận lúc rảnh (`requestIdleCallback`). Tile dùng khoảng nửa mở `[west,east) × [south,north)` để **cộng `count` theo `h3Index` không bị tính đôi**.
4. Ảnh: `loading="lazy"`, `decoding="async"`, khung cố định (4:3) để không dịch bố cục, dùng ảnh thu nhỏ nếu CDN hỗ trợ (`?w=`/`srcset`).
5. Danh sách trong modal **phân trang 10/lần** (không render hàng trăm card).

### 7.5. Chi phí Google Maps
- Mỗi lần tạo `Map` tính là **một lượt tải bản đồ**: **không** dựng bản đồ ẩn/phụ, không remount `Map` khi mở modal (modal nằm ngoài cây `Map`).
- Không gọi Geocoding/Places theo từng lần kéo bản đồ; gợi ý tìm kiếm dùng dữ liệu địa điểm của hệ thống.
- Giữ giới hạn referrer và đặt cảnh báo ngân sách trên Google Cloud.

### 7.6. Chế độ máy yếu / giảm chuyển động
Nếu `navigator.hardwareConcurrency ≤ 4` hoặc `prefers-reduced-motion`: tắt chuyển động deck.gl, giảm `MAX_CELLS`, `MAX_TOPIC_MARKERS`, `useDevicePixels = 1`, tắt hiệu ứng mở modal nặng.



---

## 8. Các pha triển khai

**DoD chung:** `tsc`, `npm test`, `npm run build` sạch; **xem trên trình duyệt thật với key thật** (jsdom không chạy được Google Maps/WebGL) và nêu rõ cái gì đã/chưa kiểm tra; không import chéo trái 4.2; không sửa `components/ui`; kiểu bài viết **không có toạ độ**; theme sáng; đủ loading/empty/error; tuân thủ quy ước React Compiler; không vi phạm ngân sách ở mục 7 (đo và ghi lại).

### 8.0. Prompt nền (dán đầu mỗi phiên)

```text
Bạn là agent frontend cho dự án LBSN (React + Vite + TypeScript + Tailwind + shadcn/ui). Đọc TRƯỚC: AGENTS.md, docs/architecture.md, docs/ui-guidelines.md và docs/explore-map-plan.md (mục 1, 4, 5, 7 bắt buộc; mục của pha hiện tại).
Quy tắc cứng:
1. Làm đúng pha được giao, không làm vượt pha. Dùng mặc định ở mục 2 nếu chưa có trả lời khác.
2. Bản đồ: @vis.gl/react-google-maps + deck.gl (GoogleMapsOverlay) + h3-js v4. KHÔNG dùng google.maps.visualization.HeatmapLayer. Thứ tự toạ độ deck.gl/GeoJSON là [longitude, latitude].
3. Kiểu dữ liệu theo mục 5; bài viết KHÔNG có toạ độ (R3). Marker/ô chỉ ở toạ độ địa điểm hoặc ô H3.
4. Truy cập dữ liệu qua service (mock-first), không gọi mock/axios trực tiếp trong component. Mỗi query truyền AbortSignal.
5. Camera bản đồ chỉ cập nhật state React ở sự kiện 'idle'. Overlay/layer/listener tạo trong useEffect và dọn dẹp khi gỡ.
6. React Compiler đang bật: viết React thuần, không thêm useMemo/useCallback theo thói quen, không đọc ref.current khi render.
7. shadcn: chỉ dùng component đã có/đã add; thiếu thì dừng và báo. Không sửa src/components/ui/*. Dùng token màu, không màu cứng (trừ thang màu mật độ). Chỉ cần theme sáng.
8. Không thêm thư viện ngoài danh sách ở mục 3.1 mà không nêu lý do.
9. Khi xong: chạy tsc/test/build, xem trên trình duyệt thật, báo cáo (đã kiểm tra gì, chưa kiểm tra gì, số đo hiệu năng nếu có) và cập nhật bảng "Trạng thái".
```

### Pha 0 — Nền tảng bản đồ & dữ liệu (M)
**Làm**
1. Cài thư viện (3.1), `.env`, `preconnect` (3.3).
2. `components/map/`: `GoogleMapsProvider`, `BaseMap` (mapId, cử chỉ, `clickableIcons=false`, `onIdle`), `MapContext` (map + viewport khi idle, `flyTo`, `fitBounds`), `DeckOverlay` + `useDeckLayers` (một overlay, đăng ký layer theo `id`, `interleaved` theo `getRenderingType()`, dọn dẹp), `geo.ts`, `h3-layers.ts` (`zoomToResolution`, thang màu, `buildHexLayer`), `map-types.ts`.
3. `useForceLight()` trong `theme-provider.tsx` (3.4).
4. `features/map/lib`: `types.ts` (mục 5 + kiểm tra 5.4), `map-config.ts`, `time-filter.ts`, `relative-time.ts`, `labels.ts`.
5. `features/map/api`: interface (5.1), mock seed + mock service (5.3), `*.queries.ts` (TanStack Query, `keepPreviousData`).
6. Route `/explore` **lazy** trỏ tới một `ExplorePage` tối thiểu chỉ hiện `BaseMap` (chưa thay giao diện cũ); `AppLayout` ẩn `MobileHeader` ở `/explore`.
**Chấp nhận:** bản đồ sáng hiện đúng với key/Map ID thật, không lỗi console; mở/đóng trang nhiều lần **không** để lại overlay/listener (kiểm tra bằng DevTools); `useForceLight` ép sáng cả Dialog (portal) khi hệ thống đang ở dark; mock trả dữ liệu xác định.
**Test:** hàm thuần (`resolveTimeFilter`, `formatRelativeVi`, `zoomToResolution`, `haversineMeters`, `padBounds`, `radiusToBounds`); mock service (gom theo ô, ngưỡng riêng tư, huỷ bằng signal).

```text
[Dán Prompt nền 8.0] Thực hiện PHA 0 của docs/explore-map-plan.md: dựng components/map (provider, base-map, map-context, deck-overlay với registry, geo, h3-layers), useForceLight, kiểu dữ liệu + cấu hình + hàm thuần, mock seed + services + queries, route /explore lazy hiển thị bản đồ trống. Chưa thay giao diện Explore cũ. Viết test cho hàm thuần và mock service. Báo cáo theo 8.0.
```

### Pha 1 — Khung bản đồ & điều khiển (M)
**Làm:** `ExplorePage` mới thay thế trang mock (xoá `components/explore/map-view.tsx`, bỏ phần Select/Toggle/PostCard/aside cũ; **cập nhật hoặc xoá** các test Explore cũ trong `shadcn-ui.test.tsx`); vị trí khởi đầu (M10) + `UserLocationDot`; `RadiusControl` (1/3/5/10) + `RadiusCircle` + `fitBounds`; "Vị trí của tôi"; chế độ "Chọn vị trí" + `CenterPin`; điều khiển mặc định Google + cử chỉ; URL state (4.4: `lat,lng,z,r,src`); `lastView` trong `localStorage`; bố cục mục 6.1 (desktop + mobile).
**Chấp nhận:** R5, R6; từ chối GPS vẫn dùng được; F5 giữ nguyên khung nhìn; Back/Forward hoạt động; không còn tham chiếu tới `MapView`/`hotspots`/`radiusScale`/`radiusPostLimit` của mock cũ (xoá export không còn dùng trong `mock-nearby.ts`, **giữ** `trending`/`currentLocation` nếu Trang chủ còn dùng).
**Test:** URL state ↔ khung nhìn (mock map); chọn bán kính cập nhật `r`; luồng chọn vị trí.

```text
[Dán Prompt nền 8.0] Thực hiện PHA 1: ExplorePage mới (khung bản đồ + điều khiển) thay mock cũ theo mục 6.1, 6.2 và 4.4. Dọn code mock Explore cũ (không động vào Trang chủ), cập nhật test bị ảnh hưởng. Báo cáo theo 8.0.
```

### Pha 2 — Lớp mật độ H3 (M–L)
**Làm:** `DensityLayer` (`useDensity`, bounds đệm + làm tròn, debounce, huỷ request, `keepPreviousData`) + `buildHexLayer`; chọn cửa sổ mật độ (1d/7d/30d); `Legend`; hover tooltip bằng DOM; click ô phóng vào; ô trong/ngoài bán kính đậm/mờ; ngưỡng riêng tư; trạng thái loading/empty/error (6.3); `dynamic import` deck.gl sau `idle` đầu tiên (7.2).
**Chấp nhận:** R1; pan/zoom mượt, không nháy trắng khi đổi vùng; đổi zoom đổi độ phân giải đúng bảng 4.3; số ô ≤ `MAX_CELLS`; ghi lại số đo `map:ready` và `density-first-paint`.
**Test:** hàm ánh xạ màu/thang `sqrt`, hợp nhất/ngưỡng riêng tư; hook `useDensity` huỷ request khi đổi viewport (mock).

```text
[Dán Prompt nền 8.0] Thực hiện PHA 2: lớp mật độ H3HexagonLayer trên Google Map theo mục 6.3 và 7.3. Một GoogleMapsOverlay duy nhất, cập nhật bằng setProps. Đo và báo cáo thời gian map:ready và density-first-paint. Báo cáo theo 8.0.
```

### Pha 2B — Chuyển lớp mật độ sang HeatmapLayer, giữ H3 làm dự phòng (M)
**Làm**
1. Cài `@deck.gl/aggregation-layers` (cùng phiên bản các gói `@deck.gl/*` khác); không đổi phiên bản gói đang chạy. (đã cài)
2. Thêm `heatmap-layers.ts`, cấu hình `HEATMAP`/`DENSITY_MODE_DEFAULT` (4.3), kiểu `HeatPoint*` + `getHeatPoints` (mock: gom điểm theo địa điểm trong `bounds`/cửa sổ, `weight` = số bài, trả ≤ `MAX_POINTS`).
3. Biến `DensityLayer` thành bộ chuyển chế độ (6.3b); **giữ nguyên** `buildHexLayer`, `useDensity`, các test Pha 2.
4. `DensityControls`: thêm `ToggleGroup` "Mượt | Ô lục giác"; đồng bộ `d=` trong URL và `localStorage`; `Legend` có hai biến thể.
5. Chấm hotspot ở zoom thấp (6.3b) + điều chỉnh `PLACE_MARKER_MIN_ZOOM` nếu cần.
6. `supportsHeatmap()` + tự chuyển về `HEX` khi lỗi.
7. **Tinh chỉnh bằng mắt** `RADIUS_METERS`, `INTENSITY`, `THRESHOLD`, `COLOR_RANGE`, `colorDomain` (nếu có) ở các mức zoom 10/12/14/16; ghi giá trị cuối vào config và chụp ảnh trước/sau gửi kèm báo cáo.
**Chấp nhận:** mặc định là heatmap, đẹp ở zoom 10–16; đổi chế độ không giật, không tạo lại overlay, không rò rỉ listener; chế độ `HEX` vẫn chạy đúng như Pha 2; **mọi tương tác theo địa điểm (Pha 3+) không đổi hành vi**; từ zoom thấp vẫn vào được modal qua chấm hotspot; giả lập `supportsHeatmap=false` → tự về `HEX`.
**Test:** `radiusPixelsForZoom` (đơn điệu, chặn min/max), `transformWeight`, `cellsToHeatPoints` (đúng thứ tự lng/lat), `buildHeatmapLayer` (thuộc tính đúng, `pickable:false`), lưu/đọc chế độ (URL + `localStorage`), nhánh dự phòng (mock `supportsHeatmap`), kiểm tra kiểu `_HeatPointShape`. Không test pixel.

```text
[Dán Prompt nền 8.0] Thực hiện PHA 2B của docs/explore-map-plan.md: thêm chế độ HEATMAP (HeatmapLayer) cho lớp mật độ theo mục 6.3b, giữ nguyên code H3 làm chế độ HEX và dự phòng. Dùng một GoogleMapsOverlay duy nhất, đổi chế độ chỉ đổi layer id 'density'. Bắt đầu với phương án B (cellsToHeatPoints) nếu chưa có getHeatPoints, nhưng viết getHeatPoints cho mock theo phương án A. Không sửa PlaceMarkers/PlaceDetailModal ngoài việc thêm chấm hotspot. Thử interleaved và overlaid, ghi kết quả. Báo cáo theo 8.0 kèm ảnh trước/sau và giá trị tham số cuối.
```

### Pha 3 — Địa điểm & `PlaceDetailModal` (M–L)
**Làm:** `PlaceMarkers` (zoom ≥ 13, giới hạn, loại chồng lấn — dùng chung hàm với Pha 4); `PlaceDetailModal` (6.4) với `getPlaceSummary` + `getPlacePosts`, `TimeFilter` (6.7, dựng ở pha này), `PostCardCompact`; `?place=` push/pop; bottom sheet trên mobile; click topic → điều hướng `/feed/topic/:topic?placeId=` (trang đích làm ở Pha 5; tạm chuyển hướng tới route tồn tại).
**Chấp nhận:** R2 (trừ trang feed); filter thời gian đổi danh sách; sắp xếp xu hướng/mới nhất; Back đóng modal; mở lại từ trang chi tiết quay về đúng modal.
**Test:** modal hiển thị đủ phần tử với mock; `TimeFilter` (preset + ngày cụ thể → `TimeRange` đúng múi giờ); phân trang "Xem thêm".

```text
[Dán Prompt nền 8.0] Thực hiện PHA 3: marker địa điểm + PlaceDetailModal + TimeFilter theo mục 6.4 và 6.7. Modal không được làm render lại cây bản đồ. Báo cáo theo 8.0.
```

### Pha 4 — Marker topic xu hướng & `TopicPostsModal` (M)
**Làm:** `TopicMarkers` (zoom ≥ 15; topic hàng đầu mỗi địa điểm; loại chồng lấn greedy sau `idle`; `AdvancedMarker` dạng pill); `TopicPostsModal` (6.5) với `PostCardCompact` (avatar, tên, ảnh đầu lazy 4:3, trích nội dung ~3 dòng, thời gian tương đối); điều hướng `/posts/:id` và "Xem tất cả".
**Chấp nhận:** R4; không quá `MAX_TOPIC_MARKERS`; không chồng lấn nhãn; cuộn/zoom vẫn mượt (ghi số đo).
**Test:** thuật toán loại chồng lấn (đầu vào pixel cố định); `PostCardCompact` hiển thị thời gian tương đối đúng ("2 giờ trước", "1 ngày trước").

```text
[Dán Prompt nền 8.0] Thực hiện PHA 4: marker topic xu hướng (zoom >= 15) + TopicPostsModal theo mục 6.5 và 7.3. Marker DOM tối đa 40, loại chồng lấn sau idle. Báo cáo theo 8.0.
```

### Pha 5 — Trang feed topic, chi tiết bài viết, trang cá nhân (M)
**Làm:** routes `/feed/topic/:topic`, `/posts/:postId`, `/profile/:userId` trong `AppLayout`; `TopicFeedPage` (6.8), `PostDetailPage` + `PostFeedCard` + `CommentList` (6.9), `PublicProfilePage` (6.10); điều hướng Back về bản đồ đúng trạng thái.
**Chấp nhận:** click topic từ modal → feed của topic (đúng phạm vi địa điểm/khu vực); click card → chi tiết có bình luận; chip địa điểm chỉ có tên (không toạ độ); `TimeFilter`/sắp xếp hoạt động ở feed.
**Test:** render theo route với mock; bình luận thêm mới; Back.

```text
[Dán Prompt nền 8.0] Thực hiện PHA 5: TopicFeedPage, PostDetailPage (kèm bình luận), PublicProfilePage theo mục 6.8–6.10. Không sửa Trang chủ/PostCard hiện có. Báo cáo theo 8.0.
```

### Pha 6 — Tìm kiếm trên bản đồ (M–L)
**Làm:** `PlaceFocusCard` (zoom ≥ 17, địa điểm gần tâm); `MapSearchBar` (gợi ý địa điểm, Enter); `SearchResultsPanel` (tab Bài viết/Người dùng/Địa điểm, `TimeFilter`, phân trang, trạng thái); `?q=` push/pop; mở chi tiết theo loại (6.6); panel trái trên desktop, bottom sheet trên mobile.
**Chấp nhận:** đi được đủ **7 bước** ở 6.6 với dữ liệu mock (ví dụ "Đại học X" → lọc ngày `23/09/2026` → mở bài viết có bình luận / mở trang cá nhân); từ khoá rỗng không gọi API; lọc theo thời gian đổi kết quả đúng.
**Test:** luồng bấm tên → kết quả → lọc ngày → mở chi tiết (mock map); `search()` mock lọc đúng theo `TimeRange`.

```text
[Dán Prompt nền 8.0] Thực hiện PHA 6: PlaceFocusCard, MapSearchBar, SearchResultsPanel theo mục 6.6 và 6.7. PlaceFocusCard dùng danh sách marker đã tải, không gọi API thêm. Báo cáo theo 8.0 và nêu rõ 7 bước đã chạy được.
```

### Pha 7 — Hiệu năng & hoàn thiện (M)
**Làm:** chia **tile** + prefetch (7.4.3); chuyển marker vượt ngưỡng sang `TextLayer`; (tuỳ chọn) `HeatmapLayer` mượt + công tắc (M2); chế độ máy yếu (7.6); HUD/`performance.mark` dev; `prefetch` route khi rê Explore; chế độ danh sách thay thế + `aria-live` (6.11); nhấn giữ/chuột phải đặt tâm; rà `console`/rò rỉ; lập **bảng so sánh số đo trước/sau**; cập nhật `README.md`, `AGENTS.md`, `docs/architecture.md`; xoá code chết.
**Chấp nhận:** đạt ngân sách 7.1 (hoặc nêu rõ chỗ chưa đạt và vì sao); không rò rỉ khi vào/ra Explore 20 lần liên tiếp; QA checklist (mục 9) đạt.

```text
[Dán Prompt nền 8.0] Thực hiện PHA 7: tối ưu theo mục 7 (tile + prefetch, TextLayer dự phòng, chế độ máy yếu, prefetch route, danh sách thay thế), đo trước/sau và lập bảng số đo. Không thêm tính năng mới ngoài danh sách. Báo cáo theo 8.0.
```

### Pha 8 (tuỳ chọn) — Tái dùng cho heatmap admin
`components/map/*` đã độc lập với user feature → trang admin heatmap chỉ cần thêm `HeatmapLayer`/`H3HexagonLayer` + panel thống kê. Không thuộc phạm vi hiện tại.

---

## 9. Kiểm thử & QA

**Tự động (Vitest, mock `@vis.gl/react-google-maps` và `@deck.gl/*` trong `test-setup`):** hàm thuần; mock service; `TimeFilter`; `PlaceDetailModal`, `TopicPostsModal`, `SearchResultsPanel`; điều hướng giữa trang; kiểm tra kiểu (5.4). **Không** kiểm thử pixel bản đồ.

**QA thủ công (key thật, Chrome + Safari iOS + Android):**
1. Vào Explore: bản đồ sáng hiện nhanh, chấm xanh về đúng vị trí; từ chối GPS vẫn dùng được.
2. Đổi bán kính 1/3/5/10: vòng tròn và khung nhìn đổi đúng.
3. "Chọn vị trí": click đặt tâm; "Vị trí của tôi" quay về.
4. Kéo/zoom/cuộn/nhấp đúp/Street View/loại bản đồ hoạt động như Google Maps.
5. Mật độ: đổi zoom đổi kích thước ô; đổi cửa sổ 1d/7d/30d; ô ít bài hiện "Ít bài".
6. Click địa điểm → modal đủ thông tin; filter thời gian đổi danh sách; click topic → feed.
7. Zoom ≥ 15 → marker topic, không chồng nhãn; click → card bài viết; click card → chi tiết.
8. Zoom ≥ 17 → `PlaceFocusCard`; bấm tên → kết quả; lọc "ngày 23/09/2026" → kết quả đổi; mở bài viết có bình luận; mở trang cá nhân.
9. Tìm bằng từ khoá ở thanh tìm kiếm; từ khoá rỗng không gọi API.
10. Back/Forward đóng/mở đúng modal/panel; F5 giữ trạng thái.
11. **Không** thấy toạ độ nào ở UI/Network tab của bài viết (chỉ `place.name/id`).
12. Mạng chậm (Slow 4G), mất mạng giữa chừng: trạng thái lỗi + thử lại, không treo.
13. Thiết bị yếu: kéo bản đồ vẫn mượt; chế độ danh sách thay thế dùng được.
14. Chuyển hệ thống sang dark: **Explore vẫn sáng**, modal cũng sáng.
15. Vào/ra Explore 20 lần: bộ nhớ ổn định, không lỗi console.
16. Chế độ Mượt/Ô lục giác: đổi qua lại nhiều lần không giật, không nhân đôi lớp, F5 giữ lựa chọn (`d=`).
17. Heatmap: kéo bản đồ không đổi màu đột ngột (hoặc `Legend` ghi rõ "tương đối"); không có quầng mờ ở vùng gần như không có bài.
18. Zoom 10–12: thấy chấm hotspot, click mở đúng `PlaceDetailModal`.
19. Giả lập thiết bị không hỗ trợ (tắt WebGL2 bằng cờ trình duyệt hoặc mock): tự về `HEX` và hiện thông báo một lần.
20. Dữ liệu trong Network tab của heatmap chỉ có `position` + `weight` (không có tên/ID bài viết, người dùng).
---

## 10. Rủi ro & lưu ý

- **Map ID raster / không phải vector:** deck.gl chỉ chạy *overlaid* (kém mượt); kiểm tra sớm ở Pha 0.
- **Tương thích phiên bản:** `@deck.gl/google-maps`, `@vis.gl/react-google-maps`, `h3-js` v4 phải khớp peer dependency; ghi phiên bản đã dùng.
- **React Compiler + đối tượng ngoài (Google/deck):** mọi thao tác imperative trong `useEffect`; nếu compiler báo lỗi, sửa theo Rules of React trước khi dùng `'use no memo'`.
- **Chi phí Google Maps:** mỗi `Map` mới = một lượt tải; tránh remount/bản đồ phụ (7.5).
- **Z-index/chồng điều khiển:** điều khiển Google và lớp UI của ta dễ chồng nhau trên mobile — kiểm tra thực tế.
- **Safari iOS:** `100dvh`, cử chỉ chụm/kéo và `Sheet` bottom cần thử thật.
- **Quyền riêng tư:** FE chỉ phản ánh; việc gom theo địa điểm/ô và ngưỡng ẩn số **phải được server thực thi** khi nối API thật.
- **Trang Trending/Hotspot cũ ở Explore bị bỏ:** thông tin này chuyển vào marker topic và modal địa điểm; Trang chủ không đổi.
- **Chưa có trong phạm vi:** đăng bài từ bản đồ, điều hướng chỉ đường, chia sẻ liên kết vị trí, hiển thị bình luận thời gian thực, heatmap admin.
- **`HeatmapLayer` không pick được:** mọi thứ cần bấm phải nằm ở marker/chấm hotspot, không phụ thuộc vào lớp nhiệt.
- **Màu phụ thuộc khung nhìn** nếu không có `colorDomain` cố định (mục 6.3b).
- **Thiết bị/GPU không hỗ trợ texture dấu phẩy động** (một số máy mobile cũ): có dự phòng `HEX` — đây là lý do **không xoá** code H3.
- **Interleaved với HeatmapLayer** có thể không ổn định: kiểm tra, nếu lỗi dùng overlaid chung cho cả hai chế độ.
---

## Trạng thái (agent cập nhật)

| Pha | Trạng thái | Ghi chú |
|---|---|---|
| 0 Nền tảng bản đồ & dữ liệu | ☑ | components/map primitives, useForceLight, types & privacy assertion, pure utils, mock seed + services + queries, route /explore lazy, tsc/build pass, 25/25 unit tests pass |
| 1 Khung bản đồ & điều khiển | ☑ | ExplorePage mới thay thế mock cũ, xoá map-view.tsx, dọn dẹp mock-nearby, RadiusControl, LocateButton, PickLocationButton, WindowControl, CenterPin, UserLocationDot, RadiusCircle, URL state debounce 600ms, lastView localStorage, tests pass, build pass |
| 2 Lớp mật độ H3 | ☑ | DensityLayer (useDensityQuery debounce 250ms, bounds đệm 25% + làm tròn 3 số thập phân, keepPreviousData), H3HexagonLayer đăng ký qua 1 GoogleMapsOverlay duy nhất (setProps), mờ ô ngoài bán kính (haversine), click ô zoom < 13 phóng to (zoom+2), tooltip DOM trực tiếp, DensityLegend 5 mức, DensityStatus (loading/empty/error), PerformanceHUD đo map:ready và density-first-paint, 42/42 tests PASS, build pass |
| 3 Địa điểm & PlaceDetailModal | ☑ | PlaceMarkers (zoom >= 13, AdvancedMarker, deduplicateMarkersByCollision theo pixel), PlaceDetailModal (Dialog desktop / Sheet mobile 85dvh, summary 3 ô đếm bài 1d/7d/30d, bài mới nhất, trending topics chip), TimeFilter (preset + lịch Calendar không chọn tương lai, URL state), PostCardCompact (R3 không toạ độ, ảnh 4:3, line-clamp-3), modal tách biệt ngoài cây BaseMap không gây re-render map, 47/47 tests PASS, build pass |
| 4 Marker topic & TopicPostsModal | ☐ | |
| 5 Feed topic, chi tiết bài viết, trang cá nhân | ☐ | |
| 6 Tìm kiếm trên bản đồ | ☐ | |
| 7 Hiệu năng & hoàn thiện | ☐ | |