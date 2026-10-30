export const MAP_CONFIG = {
  DEFAULT_CENTER: { latitude: 21.0285, longitude: 105.8542 }, // Toạ độ mặc định (Hà Nội)
  RADIUS_OPTIONS_KM: [1, 3, 5, 10] as const,
  DEFAULT_RADIUS_KM: 3,
  MIN_ZOOM: 9,
  MAX_ZOOM: 19,
  // zoom → dải độ phân giải H3 tương ứng (độ phân giải tối đa = STORED_H3_RESOLUTION)
  DENSITY_RES_BANDS: [
    { minZoom: 9, res: 6 },
    { minZoom: 11, res: 7 },
    { minZoom: 13, res: 8 },
  ],
  STORED_H3_RESOLUTION: 8,
  PLACE_MARKER_MIN_ZOOM: 13, // Mức zoom tối thiểu để hiển thị marker địa điểm
  TOPIC_MARKER_MIN_ZOOM: 15, // Mức zoom tối thiểu để hiển thị marker chủ đề xu hướng (R4)
  PLACE_FOCUS_MIN_ZOOM: 17,  // Mức zoom tối thiểu để hiển thị thẻ tiêu điểm địa điểm (R7)
  PLACE_FOCUS_MAX_DISTANCE_M: 80,
  MAX_CELLS: 1500,
  MAX_PLACE_MARKERS: 60,
  MAX_TOPIC_MARKERS: 40,
  MIN_POSTS_PER_CELL: 3, // Ngưỡng riêng tư tối thiểu (M11)
  FETCH_DEBOUNCE_MS: 250,
  STALE_TIME_MS: 60_000,
  GC_TIME_MS: 300_000,
  VIEWPORT_PADDING: 0.25, // Đệm thêm 25% cho mỗi cạnh của viewport
  // Chế độ hiển thị mật độ (Pha 2B)
  DENSITY_MODE_DEFAULT: 'HEATMAP' as 'HEATMAP' | 'HEX',
  HEATMAP: {
    RADIUS_METERS: 450, // Bán kính ảnh hưởng ≈ cạnh ô H3 res 8; đổi sang pixel theo zoom (6.3b)
    RADIUS_PX_MIN: 24,
    RADIUS_PX_MAX: 80,
    INTENSITY: 1.2,
    THRESHOLD: 0.05, // THRESHOLD cao hơn → ẩn quầng mờ ở vùng ít bài
    DEBOUNCE_MS: 250, // debounceTimeout của HeatmapLayer
    MAX_POINTS: 3000,
    WEIGHT_TRANSFORM: 'sqrt' as const, // Nén ngoại lệ để một điểm nóng không làm "cháy" cả bản đồ
    // Thang sáng: alpha 0 ở mức thấp nhất để nền bản đồ lộ ra (RGBA)
    COLOR_RANGE: [
      [255, 255, 178, 0],
      [254, 217, 118, 120],
      [254, 178, 76, 160],
      [253, 141, 60, 190],
      [240, 59, 32, 210],
      [189, 0, 38, 230],
    ] as [number, number, number, number][],
  },
  HOTSPOT_DOT_MIN_ZOOM: 10, // Chấm hotspot (không tên) để vào modal từ zoom thấp (10-12)
  HOTSPOT_DOT_LIMIT: 20,
  GPS_TIMEOUT_MS: 4000,
} as const
