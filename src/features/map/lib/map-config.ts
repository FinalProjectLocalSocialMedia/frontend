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
  MIN_POSTS_PER_CELL: 0, // Bỏ ngưỡng ẩn (E9) - hiển thị số lượng bài thật
  FETCH_DEBOUNCE_MS: 250,
  STALE_TIME_MS: 60_000,
  GC_TIME_MS: 300_000,
  VIEWPORT_PADDING: 0.25, // Đệm thêm 25% cho mỗi cạnh của viewport
  // Chế độ hiển thị mật độ (Pha 2B)
  DENSITY_MODE_DEFAULT: 'HEATMAP' as 'HEATMAP' | 'HEX',
  HEATMAP: {
    RADIUS_METERS: 520, // Bán kính ảnh hưởng ≈ cạnh ô H3 res 8; đổi sang pixel theo zoom 
    RADIUS_PX_MIN: 38,
    RADIUS_PX_MAX: 85,
    INTENSITY: 1.05,
    THRESHOLD: 0.06, // THRESHOLD cao hơn → ẩn quầng mờ ở vùng ít bài
    DEBOUNCE_MS: 250, // debounceTimeout của HeatmapLayer
    MAX_POINTS: 3000,
    WEIGHT_TRANSFORM: 'sqrt' as const, // Nén ngoại lệ để một điểm nóng không làm "cháy" cả bản đồ
    // Thang màu dịu nhẹ: giảm alpha và hạ tông đỏ gắt ở mức cao nhất (RGBA)
    COLOR_RANGE: [
      [255, 255, 178, 0],
      [254, 227, 145, 70],
      [254, 196, 79, 100],
      [254, 153, 41, 125],
      [247, 104, 60, 145],
      [227, 74, 51, 165],
    ] as [number, number, number, number][],
  },
  HOTSPOT_DOT_MIN_ZOOM: 10, // Chấm hotspot (không tên) để vào modal từ zoom thấp (10-12)
  HOTSPOT_DOT_LIMIT: 20,
  GPS_TIMEOUT_MS: 4000,
} as const
