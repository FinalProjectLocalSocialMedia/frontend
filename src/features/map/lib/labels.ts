import type { StatsWindow, TimePreset } from './types'

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  university: 'Trường đại học',
  college: 'Trường cao đẳng',
  school: 'Trường học',
  cafe: 'Quán cà phê',
  restaurant: 'Nhà hàng',
  park: 'Công viên',
  mall: 'Trung tâm thương mại',
  hospital: 'Bệnh viện',
  stadium: 'Sân vận động',
  lake: 'Hồ nước',
  landmark: 'Địa danh',
  transit: 'Bến xe / Ga tàu',
}

/** Định dạng kiểu địa điểm thành nhãn tiếng Việt thân thiện */
export function formatLocationType(type: string): string {
  const normalized = type.toLowerCase().trim()
  return LOCATION_TYPE_LABELS[normalized] || type
}

export const STATS_WINDOW_LABELS: Record<StatsWindow, string> = {
  '1d': 'Hôm nay',
  '7d': '7 ngày',
  '30d': '30 ngày',
}

export const TIME_PRESET_LABELS: Record<TimePreset, string> = {
  '3h': '3 giờ qua',
  '1d': '1 ngày trước',
  '7d': '7 ngày qua',
  '30d': '30 ngày qua',
}
