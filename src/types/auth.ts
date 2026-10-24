export interface User {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  bio?: string
  phoneNumber?: string
  currentH3Index?: string
  locationUpdatedAt?: string
  dateOfBirth?: string
  gender?: string
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

export interface AuthResponse {
  accessToken?: string | null
  refreshToken?: string | null
  tokenType?: string
  expiresIn?: number
  user: User
}
