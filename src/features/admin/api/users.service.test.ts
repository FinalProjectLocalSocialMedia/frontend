import { describe, it, expect } from 'vitest'
import { mockUsersService } from './users.mock'
import { maskEmail, maskPhone } from '@/features/admin-moderation/lib/formatters'
import type { CreateUserInput, UpdateUserInput } from '@/features/admin-moderation/lib/types'

describe('Users Service (Mock Implementation & Business Logic)', () => {
  it('lists users and excludes soft-deleted by default', async () => {
    const result = await mockUsersService.list({ page: 1, pageSize: 20 })
    expect(result.items.length).toBeGreaterThan(0)
    expect(result.items.every((u) => !u.deletedAt)).toBe(true)
  })

  it('includes soft-deleted users when includeDeleted is true', async () => {
    const withDeleted = await mockUsersService.list({ page: 1, pageSize: 20, includeDeleted: true })
    const withoutDeleted = await mockUsersService.list({ page: 1, pageSize: 20, includeDeleted: false })
    expect(withDeleted.total).toBeGreaterThanOrEqual(withoutDeleted.total)
  })

  it('filters users by role (USER/NORMAL_USER, MODERATOR, ADMIN)', async () => {
    const adminRes = await mockUsersService.list({ page: 1, pageSize: 20, role: 'ADMIN' })
    expect(adminRes.items.every((u) => u.role === 'ADMIN')).toBe(true)

    const modRes = await mockUsersService.list({ page: 1, pageSize: 20, role: 'MODERATOR' })
    expect(modRes.items.every((u) => u.role === 'MODERATOR')).toBe(true)

    const userRes = await mockUsersService.list({ page: 1, pageSize: 20, role: 'NORMAL_USER' })
    expect(userRes.items.every((u) => u.role === 'NORMAL_USER' || u.role === 'USER')).toBe(true)
  })

  it('searches users by name, email, or phone', async () => {
    const res = await mockUsersService.list({ page: 1, pageSize: 20, q: 'admin' })
    expect(res.items.length).toBeGreaterThan(0)
    expect(
      res.items.some(
        (u) =>
          u.displayName.toLowerCase().includes('admin') ||
          (u.email && u.email.toLowerCase().includes('admin'))
      )
    ).toBe(true)
  })

  it('retrieves user detail by id without location coordinates or h3 index', async () => {
    const list = await mockUsersService.list({ page: 1, pageSize: 5 })
    const firstUser = list.items[0]
    const detail = await mockUsersService.get(firstUser.id)

    expect(detail.id).toBe(firstUser.id)
    expect(detail.displayName).toBe(firstUser.displayName)
    // Geolocation privacy check: coordinates, h3 index must not exist in detail profile
    const profile = detail.profile as Record<string, unknown> | undefined
    if (profile) {
      expect(profile.currentLocation).toBeUndefined()
      expect(profile.currentH3Index).toBeUndefined()
      expect(profile.locationUpdatedAt).toBeUndefined()
    }
  })

  it('throws error when user not found', async () => {
    await expect(mockUsersService.get('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
      'Không tìm thấy người dùng'
    )
  })

  it('creates a new user successfully and rejects duplicate email', async () => {
    const uniqueEmail = `test_${Date.now()}@example.com`
    const uniquePhone = '099' + Date.now().toString().slice(-7)
    const newReq: CreateUserInput = {
      role: 'NORMAL_USER',
      email: uniqueEmail,
      password: 'password123',
      phoneNumber: uniquePhone,
      profile: {
        fullName: 'Test New User',
        gender: 1,
        bio: 'Hello world test bio',
        dateOfBirth: '2000-01-01',
      },
    }

    const created = await mockUsersService.create(newReq)
    expect(created.id).toBeDefined()
    expect(created.email).toBe(uniqueEmail)
    expect(created.displayName).toBe('Test New User')

    // Duplicate email should throw
    await expect(mockUsersService.create(newReq)).rejects.toThrow('Email đã được sử dụng')
  })

  it('updates existing user details', async () => {
    const list = await mockUsersService.list({ page: 1, pageSize: 5 })
    const target = list.items[0]

    const updateReq: UpdateUserInput = {
      profile: {
        fullName: 'Updated Name ' + Date.now(),
        avatarUrl: target.avatarUrl || '',
        bio: 'Updated bio',
        dateOfBirth: '1995-01-01',
        gender: 1,
      },
    }
    const updated = await mockUsersService.update(target.id, updateReq)
    expect(updated.displayName).toBe(updateReq.profile?.fullName)
  })

  it('soft-deletes user and marks deletedAt', async () => {
    // First create a temporary user to delete
    const tempUser = await mockUsersService.create({
      role: 'NORMAL_USER',
      email: `temp_del_${Date.now()}@example.com`,
      password: 'password123',
      phoneNumber: '0988776655',
      profile: {
        fullName: 'To Be Deleted',
        gender: 1,
        dateOfBirth: '2000-01-01',
      },
    })

    await mockUsersService.delete(tempUser.id)

    // Now list without deleted: should not be in active list
    const activeList = await mockUsersService.list({ page: 1, pageSize: 50, includeDeleted: false })
    expect(activeList.items.some((u) => u.id === tempUser.id)).toBe(false)

    // With deleted: should have deletedAt
    const allList = await mockUsersService.list({ page: 1, pageSize: 50, includeDeleted: true })
    const found = allList.items.find((u) => u.id === tempUser.id)
    expect(found).toBeDefined()
    expect(found?.deletedAt).toBeDefined()
  })
})

describe('PII Masking Formatters', () => {
  it('masks email appropriately', () => {
    expect(maskEmail('john.doe@example.com')).toBe('j***e@example.com')
    expect(maskEmail('a@b.com')).toBe('a***@b.com')
    expect(maskEmail('')).toBe('—')
    expect(maskEmail(null)).toBe('—')
    expect(maskEmail(undefined)).toBe('—')
  })

  it('masks phone number appropriately', () => {
    expect(maskPhone('0901234567')).toBe('090••••567')
    expect(maskPhone('1234')).toBe('••••')
    expect(maskPhone('')).toBe('—')
    expect(maskPhone(null)).toBe('—')
    expect(maskPhone(undefined)).toBe('—')
  })
})
