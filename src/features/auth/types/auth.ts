export type Role = 'USER' | 'MODERATOR' | 'ADMIN'

export type UserStatus = 'ACTIVE' | 'LOCKED' | 'PENDING' | 'BANNED'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export interface NormalUser {
  id: string
  email: string
  phoneNumber?: string
  fullName: string
  avatarUrl?: string
  role: 'USER'
  bio?: string
  dateOfBirth?: string
  gender?: Gender | string
  status?: UserStatus | string
  currentH3Index?: string
  locationUpdatedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface StaffUser {
  id: string
  email: string
  role: 'ADMIN' | 'MODERATOR'
  status?: UserStatus | string
  grantedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export type AuthUser = NormalUser | StaffUser
export type User = AuthUser

export const isStaff = (u: AuthUser | null | undefined): u is StaffUser =>
  !!u && (u.role === 'ADMIN' || u.role === 'MODERATOR')

export const getDisplayName = (user: AuthUser | null | undefined): string => {
  if (!user) return ''
  if ('fullName' in user && user.fullName) return user.fullName
  return user.email.split('@')[0]
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  phoneNumber?: string
}
