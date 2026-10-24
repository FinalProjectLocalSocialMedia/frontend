import { latLngToCell } from 'h3-js'
import { daysAgo, hoursAgo, minutesAgo } from './clock'
import type {
  DbAuditLog,
  DbComment,
  DbHashtag,
  DbLocation,
  DbModerator,
  DbNormalUser,
  DbNotification,
  DbPost,
  DbReport,
  DbSanction,
  DbUser,
  MockDb,
} from './db-types'
import { ID_KIND, seedId } from './ids'

/**
 * Seed XÁC ĐỊNH (không `Math.random()` / `Date.now()`): mọi thời điểm neo vào `SEED_NOW`.
 *
 * Tài khoản đăng nhập thử (mật khẩu chung của mock: `Passw0rd!`):
 *   admin@nearby.local       — ADMIN
 *   moderator@nearby.local   — MODERATOR
 *   moderator2@nearby.local  — MODERATOR
 *   locked@nearby.local      — NORMAL_USER đang bị khoá
 *   user@nearby.local        — NORMAL_USER (không phải staff → bị từ chối ở trang đăng nhập admin)
 */
export const MOCK_PASSWORD = 'Passw0rd!'

const uid = (n: number) => seedId(ID_KIND.user, n)
const lid = (n: number) => seedId(ID_KIND.location, n)
const hid = (n: number) => seedId(ID_KIND.hashtag, n)
const pid = (n: number) => seedId(ID_KIND.post, n)
const cid = (n: number) => seedId(ID_KIND.comment, n)
const rid = (n: number) => seedId(ID_KIND.report, n)
const sid = (n: number) => seedId(ID_KIND.sanction, n)
const nid = (n: number) => seedId(ID_KIND.notification, n)
const aid = (n: number) => seedId(ID_KIND.audit, n)

export const SEED_IDS = {
  admin: uid(1),
  moderator: uid(2),
  moderator2: uid(3),
  user: uid(10),
  lockedUser: uid(17),
} as const

function buildUsers(): Pick<MockDb, 'users' | 'admins' | 'moderators' | 'normalUsers'> {
  const staff: DbUser[] = [
    ['admin@nearby.local', 1, '0900000001', 120],
    ['moderator@nearby.local', 2, '0900000002', 90],
    ['moderator2@nearby.local', 3, '0900000003', 60],
  ].map(([email, n, phone, age]) => ({
    id: uid(n as number),
    email: email as string,
    password: MOCK_PASSWORD,
    phoneNumber: phone as string,
    status: 'ACTIVE',
    createdAt: daysAgo(age as number),
    updatedAt: daysAgo(age as number),
  }))

  const people: Array<[number, string, string, string, string, number, number]> = [
    // [n, email, họ tên, bio, ngày sinh, vĩ độ, kinh độ]
    [
      10,
      'user@nearby.local',
      'Nguyễn Minh',
      'Chia sẻ nhịp sống Cầu Giấy.',
      '1999-04-12',
      21.0333,
      105.79,
    ],
    [
      11,
      'linh.tran@nearby.local',
      'Trần Linh',
      'Cà phê và những góc phố.',
      '2000-08-30',
      21.0285,
      105.8542,
    ],
    [
      12,
      'hoa.pham@nearby.local',
      'Phạm Hoa',
      'Hay đi chơi cuối tuần.',
      '1998-01-21',
      20.9996,
      105.815,
    ],
    [
      13,
      'nam.le@nearby.local',
      'Lê Nam',
      'Dân văn phòng Mỹ Đình.',
      '1997-11-02',
      21.0286,
      105.7646,
    ],
    [14, 'an.do@nearby.local', 'Đỗ An', 'Thích ẩm thực đường phố.', '2001-06-15', 21.034, 105.8503],
    [15, 'mai.vu@nearby.local', 'Vũ Mai', 'Sinh viên năm cuối.', '2002-03-09', 21.0118, 105.8434],
    [
      16,
      'bach.hoang@nearby.local',
      'Hoàng Bách',
      'Ghi lại tin giao thông.',
      '1996-12-25',
      21.0333,
      105.79,
    ],
    [
      17,
      'locked@nearby.local',
      'Bùi Tuấn',
      'Tài khoản thử nghiệm bị khoá.',
      '1995-07-07',
      21.0285,
      105.8542,
    ],
  ]

  const users: DbUser[] = [
    ...staff,
    ...people.map(([n, email], i) => ({
      id: uid(n),
      email,
      password: MOCK_PASSWORD,
      phoneNumber: `09100000${String(n).padStart(2, '0')}`,
      status: (n === 17 ? 'LOCKED' : 'ACTIVE') as DbUser['status'],
      createdAt: daysAgo(40 - i * 3),
      updatedAt: daysAgo(40 - i * 3),
    })),
  ]

  const moderators: DbModerator[] = [2, 3].map((n) => ({
    userId: uid(n),
    grantedAdminId: uid(1),
    grantedAt: daysAgo(n === 2 ? 85 : 55),
  }))

  const normalUsers: DbNormalUser[] = people.map(([n, , fullName, bio, dob, lat, lng]) => ({
    userId: uid(n),
    fullName,
    avatarUrl: '',
    bio,
    dateOfBirth: dob,
    gender: n % 2,
    currentLocation: { latitude: lat, longitude: lng },
    currentH3Index: latLngToCell(lat, lng, 8),
    locationUpdatedAt: hoursAgo(n),
  }))

  return { users, admins: [{ userId: uid(1) }], moderators, normalUsers }
}

function buildContent(): Pick<
  MockDb,
  'locations' | 'hashtags' | 'posts' | 'postHashtags' | 'comments'
> {
  const places: Array<[number, string, string, string, number, number]> = [
    [1, 'Hồ Gươm', 'Hồ Hoàn Kiếm, trung tâm Hà Nội', 'LANDMARK', 21.0285, 105.8542],
    [2, 'Cầu Giấy', 'Khu vực quận Cầu Giấy', 'DISTRICT', 21.0333, 105.79],
    [3, 'Royal City', 'Trung tâm thương mại Royal City', 'MALL', 20.9996, 105.815],
    [4, 'Công viên Thống Nhất', 'Công viên giữa phố Lê Duẩn', 'PARK', 21.0118, 105.8434],
    [5, 'Mỹ Đình', 'Khu liên hợp thể thao quốc gia', 'STADIUM', 21.0286, 105.7646],
    [6, 'Phố cổ Hà Nội', 'Khu phố cổ 36 phố phường', 'OLD_QUARTER', 21.034, 105.8503],
  ]
  const locations: DbLocation[] = places.map(([n, name, description, type, lat, lng]) => ({
    id: lid(n),
    name,
    description,
    coordinate: { latitude: lat, longitude: lng },
    h3Index: latLngToCell(lat, lng, 8),
    locationType: type,
  }))

  const hashtags: DbHashtag[] = [
    'TrafficJam',
    'CafeHanoi',
    'FoodStreet',
    'WeekendVibes',
    'Flood',
    'Concert',
  ].map((name, i) => ({ id: hid(i + 1), name }))

  // S10: posts.content là TEXT — bài số 5 cố ý rất dài để kiểm tra "Xem thêm".
  const longText = Array.from(
    { length: 8 },
    (_, i) =>
      `Đoạn ${i + 1}: hôm nay mình đi dạo quanh khu vực này và thấy rất nhiều điều thú vị, từ quán cà phê nhỏ đến những con phố đông người qua lại.`,
  ).join(' ')

  // [n, tác giả, nội dung, địa điểm, phút trước, trạng thái]
  const rawPosts: Array<[number, number, string, number, number, DbPost['status']]> = [
    [1, 16, 'Kẹt xe nghiêm trọng đoạn Xuân Thuỷ, mọi người nên đi đường khác!', 2, 35, 'ACTIVE'],
    [2, 11, 'Cà phê trứng ở phố cổ vẫn là số một.', 6, 90, 'ACTIVE'],
    [
      3,
      15,
      'Nghe nói tối nay sẽ ngập nặng ở khu Thống Nhất, ai biết thông tin không?',
      4,
      150,
      'ACTIVE',
    ],
    [4, 12, 'Cuối tuần này Royal City có sự kiện âm nhạc rất vui.', 3, 240, 'ACTIVE'],
    [5, 14, longText, 6, 330, 'ACTIVE'],
    [6, 13, 'Concert tại Mỹ Đình tối qua đông kín người.', 5, 600, 'ACTIVE'],
    [7, 10, 'Hồ Gươm sáng nay thật yên bình.', 1, 720, 'ACTIVE'],
    [8, 16, 'Lại kẹt xe ở Cầu Giấy, lần thứ ba trong tuần.', 2, 900, 'ACTIVE'],
    [9, 17, 'Nội dung quảng cáo vi phạm đã bị gỡ.', 6, 1500, 'REMOVED'],
    [10, 15, 'Món ăn đường phố ngon nhất quanh Hồ Gươm.', 1, 2000, 'ACTIVE'],
    [11, 12, 'Chia sẻ lại bài về sự kiện Royal City.', 3, 2300, 'ACTIVE'],
    [12, 11, 'Công viên Thống Nhất buổi sáng cuối tuần.', 4, 2800, 'ACTIVE'],
  ]
  const posts: DbPost[] = rawPosts.map(([n, author, content, loc, ago, status]) => ({
    id: pid(n),
    authorId: uid(author),
    content,
    media: '',
    locationId: lid(loc),
    status,
    createdAt: minutesAgo(ago),
    updatedAt: minutesAgo(ago),
    // S6: bài số 11 là bài chia sẻ lại bài số 4
    ...(n === 11 ? { sharedPostId: pid(4) } : {}),
  }))

  const tagMap: Array<[number, number[]]> = [
    [1, [1]],
    [2, [2]],
    [3, [5]],
    [4, [4, 6]],
    [5, [3]],
    [6, [6]],
    [7, [4]],
    [8, [1]],
    [10, [3]],
    [11, [4]],
    [12, [4]],
  ]
  const postHashtags = tagMap.flatMap(([post, tags]) =>
    tags.map((tag) => ({ postId: pid(post), hashtagId: hid(tag) })),
  )

  // [n, tác giả, nội dung, bài viết, phút trước, trạng thái, bình luận cha]
  const rawComments: Array<[number, number, string, number, number, DbComment['status'], number?]> =
    [
      [1, 12, 'Cảm ơn bạn đã báo tin!', 1, 30, 'ACTIVE'],
      [2, 13, 'Bình luận này chứa lời lẽ công kích cá nhân.', 1, 25, 'ACTIVE'],
      [3, 14, 'Mình cũng thấy vậy.', 2, 80, 'ACTIVE'],
      [4, 10, 'Đã gỡ vì vi phạm quy tắc cộng đồng.', 3, 100, 'REMOVED'],
      [5, 11, 'Mình sẽ đến xem.', 4, 200, 'ACTIVE'],
      [6, 16, 'Đồng ý với bạn.', 1, 20, 'ACTIVE', 1],
    ]
  const comments: DbComment[] = rawComments.map(
    ([n, author, content, post, ago, status, parent]) => ({
      id: cid(n),
      authorId: uid(author),
      content,
      media: [],
      parentCommentId: parent ? cid(parent) : undefined,
      createdAt: minutesAgo(ago),
      updatedAt: minutesAgo(ago),
      postId: pid(post),
      status,
    }),
  )

  return { locations, hashtags, posts, postHashtags, comments }
}

function buildModeration(): Pick<MockDb, 'reports' | 'sanctions' | 'notifications' | 'auditLogs'> {
  const pending = (
    n: number,
    reporter: number,
    type: DbReport['targetType'],
    targetId: string,
    reason: string,
    ago: number,
  ): DbReport => ({
    id: rid(n),
    reporterId: uid(reporter),
    targetType: type,
    targetId,
    reason,
    status: 'PENDING',
    reportedAt: minutesAgo(ago),
  })

  const reports: DbReport[] = [
    // 4 người cùng báo cáo bài số 1 (D7: xử lý một lần cho cả nhóm)
    pending(1, 11, 'POST', pid(1), 'SPAM', 110),
    pending(2, 12, 'POST', pid(1), 'HARASSMENT', 95),
    pending(3, 13, 'POST', pid(1), 'SPAM', 70),
    pending(4, 14, 'POST', pid(1), 'Nội dung gây hoang mang', 40),
    pending(5, 15, 'POST', pid(3), 'MISINFORMATION', 55),
    pending(6, 10, 'COMMENT', cid(2), 'HATE_SPEECH', 45),
    pending(7, 10, 'USER', uid(16), 'HARASSMENT', 30),
    pending(8, 12, 'USER', uid(16), 'SPAM', 22),
    {
      id: rid(9),
      reporterId: uid(11),
      targetType: 'USER',
      targetId: uid(17),
      reason: 'FAKE_ACCOUNT',
      status: 'RESOLVED',
      reportedAt: daysAgo(4),
      handledAt: daysAgo(3),
      resolutionNote: 'Tài khoản giả mạo, đã khoá.',
      handleModeratorId: uid(2),
    },
    {
      id: rid(10),
      reporterId: uid(13),
      targetType: 'POST',
      targetId: pid(7),
      reason: 'OTHER',
      status: 'REJECTED',
      reportedAt: daysAgo(2),
      handledAt: daysAgo(2),
      resolutionNote: 'Không vi phạm.',
      handleAdminId: uid(1),
    },
    {
      id: rid(11),
      reporterId: uid(12),
      targetType: 'POST',
      targetId: pid(9),
      reason: 'SPAM',
      status: 'RESOLVED',
      reportedAt: daysAgo(1.2),
      handledAt: daysAgo(1),
      resolutionNote: 'Đã gỡ bài quảng cáo.',
      handleModeratorId: uid(3),
    },
  ]

  const sanctions: DbSanction[] = [
    // Khoá không thời hạn, chưa mở khoá → users.status = LOCKED (trigger trong DB thật)
    {
      id: sid(1),
      userId: uid(17),
      type: 'LOCK',
      reason: 'Tài khoản giả mạo thương hiệu.',
      reportId: rid(9),
      issuedBy: uid(2),
      issuedAt: daysAgo(3),
    },
    {
      id: sid(2),
      userId: uid(16),
      type: 'WARN',
      reason: 'Vui lòng không đăng tin chưa kiểm chứng.',
      issuedBy: uid(3),
      issuedAt: daysAgo(10),
    },
  ]

  // S4: mỗi báo cáo mới tạo một dòng REPORT_CREATED cho TỪNG moderator/admin.
  const staffIds = [uid(1), uid(2), uid(3)]
  const notifiedReports: Array<[number, number]> = [
    [4, 40],
    [6, 45],
    [7, 30],
    [8, 22],
  ]
  const notifications: DbNotification[] = notifiedReports.flatMap(([reportNo, ago], i) =>
    staffIds.map((staffId, j) => ({
      id: nid(i * 10 + j + 1),
      recipient: staffId,
      type: 'REPORT_CREATED' as const,
      content: 'Có báo cáo mới cần xử lý.',
      referenceTargetId: rid(reportNo),
      isRead: i === 0 && j === 2,
      createdAt: minutesAgo(ago),
    })),
  )

  const audit = (
    n: number,
    actor: number,
    action: string,
    targetType: string,
    targetId: string,
    details: Record<string, unknown>,
    at: string,
  ): DbAuditLog => ({
    id: aid(n),
    userId: uid(actor),
    action,
    targetType,
    targetId,
    details,
    ipAddress: `10.0.0.${n + 10}`,
    occurredAt: at,
  })

  const auditLogs: DbAuditLog[] = [
    audit(
      1,
      2,
      'USER_LOCKED',
      'USER',
      uid(17),
      { reportId: rid(9), reason: 'Tài khoản giả mạo thương hiệu.' },
      daysAgo(3),
    ),
    audit(
      2,
      2,
      'REPORT_RESOLVED',
      'REPORT',
      rid(9),
      { actions: ['LOCK_USER'], note: 'Tài khoản giả mạo, đã khoá.' },
      daysAgo(3),
    ),
    audit(
      3,
      1,
      'REPORT_REJECTED',
      'REPORT',
      rid(10),
      { actions: ['REJECT'], note: 'Không vi phạm.' },
      daysAgo(2),
    ),
    audit(4, 3, 'POST_REMOVED', 'POST', pid(9), { reportId: rid(11) }, daysAgo(1)),
    audit(
      5,
      3,
      'REPORT_RESOLVED',
      'REPORT',
      rid(11),
      { actions: ['REMOVE_CONTENT'], note: 'Đã gỡ bài quảng cáo.' },
      daysAgo(1),
    ),
    audit(
      6,
      3,
      'USER_WARNED',
      'USER',
      uid(16),
      { message: 'Vui lòng không đăng tin chưa kiểm chứng.' },
      daysAgo(10),
    ),
  ]

  return { reports, sanctions, notifications, auditLogs }
}

/** Tạo một mock db mới, luôn cho cùng một kết quả. */
export function createSeedDb(): MockDb {
  return { ...buildUsers(), ...buildContent(), ...buildModeration() }
}
