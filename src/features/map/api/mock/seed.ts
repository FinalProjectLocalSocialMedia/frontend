import { latLngToCell } from 'h3-js'
import type {
  AuthorRef,
  CommentItem,
  MapPlace,
  PostCardData,
  PostDetail,
  PublicProfile,
} from '../../lib/types'

// Bộ tạo số giả ngẫu nhiên xác định tuyến tính LCG
export function createPRNG(seed = 42) {
  let s = seed
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

// Danh sách 25 tác giả mẫu
export const SEED_AUTHORS: AuthorRef[] = [
  { id: 'usr-1', displayName: 'Minh Anh', avatarUrl: 'https://picsum.photos/seed/u1/100/100' },
  { id: 'usr-2', displayName: 'Tuấn Hoàng', avatarUrl: 'https://picsum.photos/seed/u2/100/100' },
  { id: 'usr-3', displayName: 'Hương Trà', avatarUrl: 'https://picsum.photos/seed/u3/100/100' },
  { id: 'usr-4', displayName: 'Bảo Long', avatarUrl: 'https://picsum.photos/seed/u4/100/100' },
  { id: 'usr-5', displayName: 'Khánh Linh', avatarUrl: 'https://picsum.photos/seed/u5/100/100' },
  { id: 'usr-6', displayName: 'Huy Nam', avatarUrl: 'https://picsum.photos/seed/u6/100/100' },
  { id: 'usr-7', displayName: 'Phương Thảo', avatarUrl: 'https://picsum.photos/seed/u7/100/100' },
  { id: 'usr-8', displayName: 'Đức Minh', avatarUrl: 'https://picsum.photos/seed/u8/100/100' },
  { id: 'usr-9', displayName: 'Thanh Hà', avatarUrl: 'https://picsum.photos/seed/u9/100/100' },
  { id: 'usr-10', displayName: 'Văn Dũng', avatarUrl: 'https://picsum.photos/seed/u10/100/100' },
  { id: 'usr-11', displayName: 'Ngọc Mai', avatarUrl: 'https://picsum.photos/seed/u11/100/100' },
  { id: 'usr-12', displayName: 'Quốc Việt', avatarUrl: 'https://picsum.photos/seed/u12/100/100' },
  { id: 'usr-13', displayName: 'Thu Trang', avatarUrl: 'https://picsum.photos/seed/u13/100/100' },
  { id: 'usr-14', displayName: 'Hải Đăng', avatarUrl: 'https://picsum.photos/seed/u14/100/100' },
  { id: 'usr-15', displayName: 'Quỳnh Nga', avatarUrl: 'https://picsum.photos/seed/u15/100/100' },
  { id: 'usr-16', displayName: 'Việt Anh', avatarUrl: 'https://picsum.photos/seed/u16/100/100' },
  { id: 'usr-17', displayName: 'Hồng Ánh', avatarUrl: 'https://picsum.photos/seed/u17/100/100' },
  { id: 'usr-18', displayName: 'Thành Đạt', avatarUrl: 'https://picsum.photos/seed/u18/100/100' },
  { id: 'usr-19', displayName: 'Yến Nhi', avatarUrl: 'https://picsum.photos/seed/u19/100/100' },
  { id: 'usr-20', displayName: 'Tùng Lâm', avatarUrl: 'https://picsum.photos/seed/u20/100/100' },
  { id: 'usr-21', displayName: 'Bích Phương', avatarUrl: 'https://picsum.photos/seed/u21/100/100' },
  { id: 'usr-22', displayName: 'Tiến Thành', avatarUrl: 'https://picsum.photos/seed/u22/100/100' },
  { id: 'usr-23', displayName: 'Lan Anh', avatarUrl: 'https://picsum.photos/seed/u23/100/100' },
  { id: 'usr-24', displayName: 'Trọng Hiếu', avatarUrl: 'https://picsum.photos/seed/u24/100/100' },
  { id: 'usr-25', displayName: 'Hà My', avatarUrl: 'https://picsum.photos/seed/u25/100/100' },
]

// 20 hashtag tiếng Việt mẫu (không có '#')
export const SEED_TOPICS: string[] = [
  'totnghiep',
  'cafengon',
  'checkinhanoi',
  'muaroi',
  'ngaplut',
  'khampha',
  'amthuc',
  'sinhvien',
  'hoctap',
  'congvien',
  'chaybo',
  'cuoituan',
  'trainghiem',
  'phoco',
  'muasam',
  'xuhuong',
  'sukien',
  'docuocsong',
  'hoianh',
  'chill',
]

// Danh sách địa điểm gốc tại các quận Hà Nội
const RAW_LOCATIONS = [
  // Cầu Giấy
  { id: 'plc-1', name: 'Đại học Quốc gia Hà Nội', type: 'university', lat: 21.0372, lng: 105.7828 },
  { id: 'plc-2', name: 'Đại học Sư phạm Hà Nội', type: 'university', lat: 21.0366, lng: 105.7836 },
  { id: 'plc-3', name: 'Học viện Báo chí và Tuyên truyền', type: 'university', lat: 21.0361, lng: 105.7905 },
  { id: 'plc-4', name: 'Công viên Cầu Giấy', type: 'park', lat: 21.0289, lng: 105.7917 },
  { id: 'plc-5', name: 'Keangnam Hanoi Landmark Tower', type: 'landmark', lat: 21.0173, lng: 105.7838 },
  { id: 'plc-6', name: 'Cà phê Yên Cầu Giấy', type: 'cafe', lat: 21.0321, lng: 105.7925 },
  { id: 'plc-7', name: 'The Coffee House Duy Tân', type: 'cafe', lat: 21.0315, lng: 105.7852 },
  { id: 'plc-8', name: 'Vincom Plaza Bắc Từ Liêm', type: 'mall', lat: 21.0506, lng: 105.7783 },

  // Hoàn Kiếm
  { id: 'plc-9', name: 'Hồ Hoàn Kiếm', type: 'lake', lat: 21.0287, lng: 105.8523 },
  { id: 'plc-10', name: 'Nhà hát Lớn Hà Nội', type: 'landmark', lat: 21.0245, lng: 105.8576 },
  { id: 'plc-11', name: 'Phố đi bộ Hoàn Kiếm', type: 'landmark', lat: 21.0312, lng: 105.8528 },
  { id: 'plc-12', name: 'Tràng Tiền Plaza', type: 'mall', lat: 21.0258, lng: 105.8546 },
  { id: 'plc-13', name: 'Cà phê Đinh', type: 'cafe', lat: 21.0305, lng: 105.8532 },
  { id: 'plc-14', name: 'Nhà thờ Lớn Hà Nội', type: 'landmark', lat: 21.0288, lng: 105.8491 },

  // Đống Đa
  { id: 'plc-15', name: 'Văn Miếu - Quốc Tử Giám', type: 'landmark', lat: 21.0276, lng: 105.8355 },
  { id: 'plc-16', name: 'Đại học Bách Khoa Hà Nội', type: 'university', lat: 21.0048, lng: 105.8437 },
  { id: 'plc-17', name: 'Đại học Kinh tế Quốc dân', type: 'university', lat: 20.9996, lng: 105.8431 },
  { id: 'plc-18', name: 'Đại học Xây dựng Hà Nội', type: 'university', lat: 21.0028, lng: 105.8422 },
  { id: 'plc-19', name: 'Hồ Hoàng Cầu', type: 'lake', lat: 21.0189, lng: 105.8236 },
  { id: 'plc-20', name: 'Vincom Center Nguyễn Chí Thanh', type: 'mall', lat: 21.0224, lng: 105.8115 },
  { id: 'plc-21', name: 'Gạt Tàn Coffee Hoàng Cầu', type: 'cafe', lat: 21.0195, lng: 105.8245 },

  // Thanh Xuân
  { id: 'plc-22', name: 'Đại học Khoa học Xã hội và Nhân văn', type: 'university', lat: 20.9982, lng: 105.8078 },
  { id: 'plc-23', name: 'Đại học Hà Nội', type: 'university', lat: 20.9918, lng: 105.7963 },
  { id: 'plc-24', name: 'Vinhomes Royal City', type: 'mall', lat: 21.0024, lng: 105.8162 },
  { id: 'plc-25', name: 'Công viên Nhân Chính', type: 'park', lat: 21.0047, lng: 105.7998 },
  { id: 'plc-26', name: 'All Day Coffee Thanh Xuân', type: 'cafe', lat: 21.0012, lng: 105.8123 },

  // Tây Hồ
  { id: 'plc-27', name: 'Hồ Tây', type: 'lake', lat: 21.0543, lng: 105.8231 },
  { id: 'plc-28', name: 'Chùa Trấn Quốc', type: 'landmark', lat: 21.0478, lng: 105.8368 },
  { id: 'plc-29', name: 'Phủ Tây Hồ', type: 'landmark', lat: 21.0667, lng: 105.8288 },
  { id: 'plc-30', name: 'Lotte Mall West Lake Hanoi', type: 'mall', lat: 21.0743, lng: 105.8087 },
  { id: 'plc-31', name: 'Maison de Blanc Quảng Khánh', type: 'cafe', lat: 21.0601, lng: 105.8242 },
  { id: 'plc-32', name: 'Thung Lũng Hoa Hồ Tây', type: 'park', lat: 21.0655, lng: 105.8184 },

  // Hà Đông
  { id: 'plc-33', name: 'Học viện Công nghệ Bưu chính Viễn thông', type: 'university', lat: 20.9806, lng: 105.7876 },
  { id: 'plc-34', name: 'Đại học Kiến trúc Hà Nội', type: 'university', lat: 20.9825, lng: 105.7892 },
  { id: 'plc-35', name: 'Aeon Mall Hà Đông', type: 'mall', lat: 20.9858, lng: 105.7538 },
  { id: 'plc-36', name: 'Hồ Văn Quán', type: 'lake', lat: 20.9765, lng: 105.7895 },
  { id: 'plc-37', name: 'Highlands Coffee Mỗ Lao', type: 'cafe', lat: 20.9832, lng: 105.7845 },

  // Hai Bà Trưng & Ba Đình
  { id: 'plc-38', name: 'Công viên Thống Nhất', type: 'park', lat: 21.0145, lng: 105.8442 },
  { id: 'plc-39', name: 'Lăng Chủ tịch Hồ Chí Minh', type: 'landmark', lat: 21.0368, lng: 105.8346 },
  { id: 'plc-40', name: 'Công viên Bách Thảo', type: 'park', lat: 21.0412, lng: 105.8305 },
]

export type SeedDatabase = {
  places: MapPlace[]
  posts: PostDetail[]
  comments: CommentItem[]
  profiles: PublicProfile[]
}

/**
 * Khởi tạo cơ sở dữ liệu mẫu xác định (deterministic mock database).
 * @param referenceTime Mốc thời gian 'hiện tại' làm neo cho các bài viết trong quá khứ (mặc định: 2026-10-26T12:00:00Z)
 */
export function buildSeedDatabase(referenceTime = new Date('2026-10-26T12:00:00.000Z')): SeedDatabase {
  const rand = createPRNG(42)

  // 1. Tạo danh sách MapPlaces với chỉ mục H3 ở độ phân giải 8
  const places: MapPlace[] = RAW_LOCATIONS.map((loc) => {
    const h3Index = latLngToCell(loc.lat, loc.lng, 8)
    return {
      id: loc.id,
      name: loc.name,
      locationType: loc.type,
      center: { latitude: loc.lat, longitude: loc.lng },
      h3Index,
      postCount: 0,
      trendScore: 0,
      topTopic: undefined,
    }
  })

  // 2. Tạo ~800 bài viết phân bổ trong vòng 45 ngày qua
  const posts: PostDetail[] = []
  const totalPosts = 800
  const nowMs = referenceTime.getTime()
  const fortyFiveDaysMs = 45 * 24 * 60 * 60 * 1000

  // Các địa điểm 'nóng' có tần suất hoạt động cao hơn
  const hotPlaceIds = new Set(['plc-1', 'plc-9', 'plc-16', 'plc-24', 'plc-30', 'plc-33'])

  for (let i = 1; i <= totalPosts; i++) {
    // Chọn địa điểm với xác suất ưu tiên địa điểm hot
    let place = places[Math.floor(rand() * places.length)]
    if (rand() < 0.35) {
      const hotList = places.filter((p) => hotPlaceIds.has(p.id))
      place = hotList[Math.floor(rand() * hotList.length)]
    }

    const author = SEED_AUTHORS[Math.floor(rand() * SEED_AUTHORS.length)]

    // Phân bổ thời gian: ưu tiên các ngày gần đây (dùng hàm mũ để tập trung bài gần mốc hiện tại)
    const ageFactor = Math.pow(rand(), 1.8)
    const postTimeMs = nowMs - Math.floor(ageFactor * fortyFiveDaysMs)
    const createdAt = new Date(postTimeMs).toISOString()

    // Gán từ 1 đến 3 chủ đề (topics)
    const topicCount = 1 + Math.floor(rand() * 3)
    const assignedTopics: string[] = []
    for (let t = 0; t < topicCount; t++) {
      const candidate = SEED_TOPICS[Math.floor(rand() * SEED_TOPICS.length)]
      if (!assignedTopics.includes(candidate)) {
        assignedTopics.push(candidate)
      }
    }

    // Xác định số lượng hình ảnh (0 đến 3)
    const imageCount = rand() < 0.65 ? 1 + Math.floor(rand() * 3) : 0
    const imageUrls: string[] = []
    for (let img = 0; img < imageCount; img++) {
      imageUrls.push(`https://picsum.photos/seed/post-${i}-${img}/600/400`)
    }

    const likeCount = Math.floor(rand() * 150)
    const commentCount = Math.floor(rand() * 40)

    const contentSnippets = [
      `Hôm nay không khí tại ${place.name} thật tuyệt vời! Mọi người ghé qua đừng quên trải nghiệm nhé. #${assignedTopics.join(' #')}`,
      `Góc nhỏ bình yên tại ${place.name}. Một ngày cuối tuần thư thái ngắm nhìn phố phường. #${assignedTopics.join(' #')}`,
      `Cập nhật tình hình tại ${place.name}: khá đông đúc và nhộn nhịp, thời tiết đẹp. #${assignedTopics.join(' #')}`,
      `Kỷ niệm đáng nhớ cùng bạn bè ở ${place.name}! #${assignedTopics.join(' #')}`,
      `Gợi ý địa điểm check-in cực đỉnh: ${place.name}. Chắc chắn sẽ quay lại sớm! #${assignedTopics.join(' #')}`,
    ]
    const content = contentSnippets[Math.floor(rand() * contentSnippets.length)]

    posts.push({
      id: `post-${i}`,
      author,
      content,
      imageUrls,
      imageCount,
      createdAt,
      place: { id: place.id, name: place.name },
      topics: assignedTopics,
      likeCount,
      commentCount,
      likedByMe: rand() < 0.2,
      savedByMe: rand() < 0.15,
    })
  }

  // Sắp xếp bài theo thời gian giảm dần (mới nhất trước)
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // 3. Tạo bình luận mẫu cho các bài viết gần đây
  const comments: CommentItem[] = []
  let commentCounter = 1
  for (let pIdx = 0; pIdx < Math.min(60, posts.length); pIdx++) {
    const post = posts[pIdx]
    const numComments = Math.min(5, post.commentCount)
    for (let c = 0; c < numComments; c++) {
      const commenter = SEED_AUTHORS[Math.floor(rand() * SEED_AUTHORS.length)]
      const commentTimeMs = new Date(post.createdAt).getTime() + (c + 1) * 3600 * 1000
      comments.push({
        id: `cmt-${commentCounter++}`,
        postId: post.id,
        author: commenter,
        content: `Bình luận hay quá, đồng quan điểm với tác giả tại ${post.place.name}!`,
        createdAt: new Date(commentTimeMs).toISOString(),
        replyCount: 0,
      })
    }
  }

  // 4. Khởi tạo hồ sơ người dùng mẫu
  const profiles: PublicProfile[] = SEED_AUTHORS.map((author, index) => {
    const authorPosts = posts.filter((p) => p.author.id === author.id)
    return {
      id: author.id,
      displayName: author.displayName,
      avatarUrl: author.avatarUrl,
      bio: `Thích chia sẻ những khoảnh khắc đời thường tại Hà Nội. Yêu thích chụp ảnh và khám phá địa điểm mới (#${SEED_TOPICS[index % SEED_TOPICS.length]}).`,
      followerCount: 50 + Math.floor(rand() * 800),
      followingCount: 30 + Math.floor(rand() * 300),
      postCount: authorPosts.length,
    }
  })

  return {
    places,
    posts,
    comments,
    profiles,
  }
}

// Cơ sở dữ liệu seed toàn cục khởi tạo một lần
export const seedDatabase = buildSeedDatabase()
