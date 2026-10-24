import type {
  AdminUserDetail,
  AdminUserListItem,
  CreateUserInput,
  Paginated,
  Role,
  UpdateUserInput,
  UserListParams,
  Uuid,
} from '@/features/admin-moderation/lib/types'
import type { UsersService } from './users.service'
import { ApiError } from '@/lib/http-client'

const now = new Date().toISOString()

const mockUsers: AdminUserDetail[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'ADMIN',
    status: 'ACTIVE',
    email: 'admin@lbsn.vn',
    phoneNumber: '0901234567',
    displayName: 'Quản trị viên Hệ thống',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: now,
    stats: { posts: 12, reportsAgainst: 0, warnings: 0 },
    profile: {
      bio: 'Quản trị viên cấp cao',
      gender: 1,
      dateOfBirth: '1995-05-15',
    },
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    role: 'MODERATOR',
    status: 'ACTIVE',
    email: 'mod@lbsn.vn',
    phoneNumber: '0912345678',
    displayName: 'Kiểm duyệt viên 01',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2026-01-10T08:30:00Z',
    updatedAt: now,
    moderator: {
      grantedAt: '2026-01-10T08:30:00Z',
      grantedByAdminId: '11111111-1111-1111-1111-111111111111',
    },
    stats: { posts: 4, reportsAgainst: 1, warnings: 0 },
    profile: {
      bio: 'Kiểm duyệt viên nội dung LBSN',
      gender: 1,
      dateOfBirth: '1998-08-20',
    },
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    role: 'NORMAL_USER',
    status: 'ACTIVE',
    email: 'user1@example.com',
    phoneNumber: '0987654321',
    displayName: 'Nguyễn Văn An',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: now,
    stats: { posts: 25, reportsAgainst: 3, warnings: 1 },
    profile: {
      bio: 'Yêu thích khám phá ẩm thực và du lịch.',
      gender: 1,
      dateOfBirth: '2001-03-12',
    },
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    role: 'NORMAL_USER',
    status: 'LOCKED',
    email: 'spammer@example.com',
    phoneNumber: '0922334455',
    displayName: 'Trần Thị Bích',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    createdAt: '2026-02-15T14:20:00Z',
    updatedAt: now,
    stats: { posts: 42, reportsAgainst: 15, warnings: 3 },
    lock: {
      sanctionId: '99999999-9999-9999-9999-999999999999',
      reason: 'Phát tán nội dung quảng cáo spam liên tục trong nhiều bài viết',
      lockedAt: now,
      lockedBy: {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'mod@lbsn.vn',
        role: 'MODERATOR',
      },
    },
    profile: {
      bio: 'Bán hàng online chất lượng cao',
      gender: 0,
      dateOfBirth: '1999-11-25',
    },
  },
]

export const mockUsersService: UsersService = {
  async list(params?: UserListParams): Promise<Paginated<AdminUserListItem>> {
    await new Promise((r) => setTimeout(r, 200))
    let items = [...mockUsers]

    if (!params?.includeDeleted) {
      items = items.filter((u) => !u.deletedAt)
    }

    if (params?.role && params.role !== 'ALL') {
      const r = params.role === 'USER' ? 'NORMAL_USER' : params.role
      items = items.filter((u) => u.role === r)
    }

    if (params?.status && params.status !== 'ALL') {
      items = items.filter((u) => u.status === params.status)
    }

    if (params?.q) {
      const q = params.q.toLowerCase()
      items = items.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phoneNumber && u.phoneNumber.includes(q)) ||
          u.id.includes(q),
      )
    }

    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 20
    const total = items.length
    const offset = (page - 1) * pageSize
    const paginatedItems = items.slice(offset, offset + pageSize)

    return {
      items: paginatedItems,
      page,
      pageSize,
      total,
    }
  },

  async get(id: Uuid): Promise<AdminUserDetail> {
    await new Promise((r) => setTimeout(r, 150))
    const user = mockUsers.find((u) => u.id === id)
    if (!user) {
      throw new Error(`Không tìm thấy người dùng với ID: ${id}`)
    }
    return user
  },

  async create(input: CreateUserInput): Promise<AdminUserDetail> {
    await new Promise((r) => setTimeout(r, 200))

    // Check duplicate email
    if (
      mockUsers.some(
        (u) => u.email && u.email.toLowerCase() === input.email.toLowerCase() && !u.deletedAt,
      )
    ) {
      throw new ApiError({
        message: 'Email đã được sử dụng bởi một tài khoản khác',
        status: 409,
        code: 'EMAIL_ALREADY_EXISTS',
        fieldErrors: { email: 'Email đã được sử dụng' },
      })
    }

    // Check duplicate phone
    if (
      input.phoneNumber &&
      mockUsers.some((u) => u.phoneNumber === input.phoneNumber && !u.deletedAt)
    ) {
      throw new ApiError({
        message: 'Số điện thoại đã được sử dụng bởi một tài khoản khác',
        status: 409,
        code: 'PHONE_ALREADY_EXISTS',
        fieldErrors: { phoneNumber: 'Số điện thoại đã được sử dụng' },
      })
    }

    const newId = crypto.randomUUID()
    const role = (input.role as string) === 'USER' ? 'NORMAL_USER' : input.role
    const displayName =
      'profile' in input && input.profile.fullName
        ? input.profile.fullName
        : input.email.split('@')[0]

    const newUser: AdminUserDetail = {
      id: newId,
      role: role as Role,
      status: 'ACTIVE',
      email: input.email,
      phoneNumber: input.phoneNumber,
      displayName,
      avatarUrl: 'profile' in input ? input.profile.avatarUrl : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: { posts: 0, reportsAgainst: 0, warnings: 0 },
      profile:
        'profile' in input
          ? {
              bio: input.profile.bio || '',
              gender: input.profile.gender ?? 1,
              dateOfBirth: input.profile.dateOfBirth,
            }
          : undefined,
    }

    mockUsers.unshift(newUser)
    return newUser
  },

  async update(id: Uuid, input: UpdateUserInput): Promise<AdminUserDetail> {
    await new Promise((r) => setTimeout(r, 200))
    const idx = mockUsers.findIndex((u) => u.id === id)
    if (idx === -1) {
      throw new Error(`Không tìm thấy người dùng với ID: ${id}`)
    }

    const current = mockUsers[idx]
    const updated: AdminUserDetail = {
      ...current,
      email: input.email ?? current.email,
      phoneNumber: input.phoneNumber ?? current.phoneNumber,
      displayName: input.profile?.fullName ?? current.displayName,
      avatarUrl: input.profile?.avatarUrl ?? current.avatarUrl,
      updatedAt: new Date().toISOString(),
      profile: current.profile
        ? {
            ...current.profile,
            bio: input.profile?.bio ?? current.profile.bio,
            dateOfBirth: input.profile?.dateOfBirth ?? current.profile.dateOfBirth,
            gender: input.profile?.gender ?? current.profile.gender,
          }
        : undefined,
    }

    mockUsers[idx] = updated
    return updated
  },

  async delete(id: Uuid): Promise<void> {
    await new Promise((r) => setTimeout(r, 200))
    const user = mockUsers.find((u) => u.id === id)
    if (!user) {
      throw new Error(`Không tìm thấy người dùng với ID: ${id}`)
    }
    if (user.role === 'ADMIN') {
      const activeAdmins = mockUsers.filter(
        (u) => u.role === 'ADMIN' && !u.deletedAt && u.id !== id,
      )
      if (activeAdmins.length === 0) {
        throw new ApiError({
          message: 'Không thể xoá quản trị viên cuối cùng trong hệ thống',
          status: 409,
          code: 'LAST_ADMIN',
        })
      }
    }
    user.deletedAt = new Date().toISOString()
  },
}
