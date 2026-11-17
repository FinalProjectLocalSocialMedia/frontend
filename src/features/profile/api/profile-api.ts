import { apiClient } from '@/lib/api-client'
import type { NormalUser } from '@/features/auth/types/auth'
import type {
  CreateReportPayload,
  CreateReportResponse,
  FollowDto,
  PublicUserProfile,
  UpdateProfilePayload,
} from '../types/profile'

export async function getPublicProfile(userId: string): Promise<PublicUserProfile> {
  const response = await apiClient.get<PublicUserProfile>(`/user/users/${userId}`)
  return response.data
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<NormalUser> {
  const response = await apiClient.patch<NormalUser>('/user/users/me', payload)
  return response.data
}

export async function followUser(userId: string): Promise<FollowDto> {
  const response = await apiClient.post<FollowDto>(`/user/users/${userId}/follow`)
  return response.data
}

export async function unfollowUser(userId: string): Promise<void> {
  await apiClient.delete(`/user/users/${userId}/follow`)
}

export async function blockUser(userId: string): Promise<void> {
  await apiClient.put(`/user/blocks/${userId}`)
}

export async function unblockUser(userId: string): Promise<void> {
  await apiClient.delete(`/user/blocks/${userId}`)
}

export async function createReport(payload: CreateReportPayload): Promise<CreateReportResponse> {
  const response = await apiClient.post<CreateReportResponse>('/moderation/reports', payload)
  return response.data
}
