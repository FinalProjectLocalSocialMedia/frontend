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
  GPS_TIMEOUT_MS: 4000,
} as const
