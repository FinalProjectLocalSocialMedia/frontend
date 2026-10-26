export const MAP_CONFIG = {
  DEFAULT_CENTER: { latitude: 21.0285, longitude: 105.8542 }, // Hanoi fallback
  RADIUS_OPTIONS_KM: [1, 3, 5, 10] as const,
  DEFAULT_RADIUS_KM: 3,
  MIN_ZOOM: 9,
  MAX_ZOOM: 19,
  // zoom → H3 resolution bands (res max = STORED_H3_RESOLUTION)
  DENSITY_RES_BANDS: [
    { minZoom: 9, res: 6 },
    { minZoom: 11, res: 7 },
    { minZoom: 13, res: 8 },
  ],
  STORED_H3_RESOLUTION: 8,
  PLACE_MARKER_MIN_ZOOM: 13, // show place markers
  TOPIC_MARKER_MIN_ZOOM: 15, // show trending topic markers (R4)
  PLACE_FOCUS_MIN_ZOOM: 17,  // show PlaceFocusCard (R7)
  PLACE_FOCUS_MAX_DISTANCE_M: 80,
  MAX_CELLS: 1500,
  MAX_PLACE_MARKERS: 60,
  MAX_TOPIC_MARKERS: 40,
  MIN_POSTS_PER_CELL: 3, // privacy threshold (M11)
  FETCH_DEBOUNCE_MS: 250,
  STALE_TIME_MS: 60_000,
  GC_TIME_MS: 300_000,
  VIEWPORT_PADDING: 0.25, // pad bounds 25% on each side
  GPS_TIMEOUT_MS: 4000,
} as const
