export const currentLocation = { name: 'Cầu Giấy, Hanoi', latitude: 21.0362, longitude: 105.7906 }

export type NearbyPost = {
  id: string
  name: string
  handle: string
  initials: string
  color: string
  time: string
  location: string
  text: string
  topic: string
  likes: string
  comments: string
}

export const nearbyPosts: NearbyPost[] = [
  { id: 'traffic-1', name: 'Nguyễn Minh', handle: '@minhnguyen', initials: 'NM', color: 'bg-amber-100 text-amber-700', time: '8 min ago', location: 'Cầu Giấy, Hanoi', text: 'Traffic is extremely heavy around Cầu Giấy right now. Take a little extra time if you are heading toward Xuân Thủy.', topic: '#TrafficJam', likes: '124', comments: '31' },
  { id: 'campus-1', name: 'Huy Phạm', handle: '@huypham', initials: 'HP', color: 'bg-sky-100 text-sky-700', time: '24 min ago', location: 'Dịch Vọng, Hanoi', text: 'Anyone up for a casual badminton game at the university courts this evening?', topic: '#PTIT', likes: '31', comments: '24' },
  { id: 'coffee-1', name: 'Linh Trần', handle: '@linh.works', initials: 'LT', color: 'bg-rose-100 text-rose-700', time: '46 min ago', location: 'Nghĩa Tân, Hanoi', text: 'Found a quiet corner to work from this morning. Great light and even better bánh mì.', topic: '#CoffeeCrawl', likes: '86', comments: '19' },
]

export const hotspots = [
  { id: 'cau-giay', name: 'Cầu Giấy', activity: 'Very high activity', posts: 342, x: 48, y: 45, level: 'high' },
  { id: 'xuan-thuy', name: 'Xuân Thủy', activity: 'High activity', posts: 218, x: 62, y: 37, level: 'medium' },
  { id: 'dich-vong', name: 'Dịch Vọng', activity: 'Medium activity', posts: 126, x: 35, y: 59, level: 'low' },
]

export const trending = [
  { tag: '#TrafficJam', posts: 200, location: 'Cầu Giấy, Hanoi', marker: { x: 53, y: 42 } },
  { tag: '#PTIT', posts: 186, location: 'Xuân Thủy, Hanoi', marker: { x: 67, y: 34 } },
  { tag: '#AI', posts: 129, location: 'Dịch Vọng, Hanoi', marker: { x: 31, y: 62 } },
  { tag: '#Hanoi', posts: 2400, location: 'Hanoi', marker: { x: 76, y: 52 } },
]

export const activitySpots = [
  { x: 46, y: 43, size: 170, color: 'bg-orange-400/20' },
  { x: 59, y: 35, size: 120, color: 'bg-amber-400/20' },
  { x: 33, y: 60, size: 100, color: 'bg-sky-400/20' },
  { x: 74, y: 53, size: 80, color: 'bg-emerald-400/20' },
]

export const radiusOptions = ['1 km', '5 km', '10 km', '25 km']
export const defaultRadius = '5 km'
export const radiusScale: Record<string, number> = { '1 km': 62, '5 km': 122, '10 km': 188, '25 km': 270 }
export const radiusPostLimit: Record<string, number> = { '1 km': 1, '5 km': 3, '10 km': 3, '25 km': 3 }

