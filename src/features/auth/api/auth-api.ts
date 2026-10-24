import { apiClient } from '@/lib/api-client'
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth'

export const authApi = {
  async login(data: LoginRequest): Promise<AuthUser> {
    const response = await apiClient.post<AuthUser>('/user/auth/login', data)
    return response.data
  },

  async register(data: RegisterRequest): Promise<AuthUser> {
    const response = await apiClient.post<AuthUser>('/user/auth/register', data)
    return response.data
  },

  async getMe(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>('/user/auth/me')
    return response.data
  },

  async refresh(): Promise<AuthUser> {
    const response = await apiClient.post<AuthUser>('/user/auth/refresh')
    return response.data
  },

  async logout(): Promise<void> {
    await apiClient.post('/user/auth/logout')
  },
}
