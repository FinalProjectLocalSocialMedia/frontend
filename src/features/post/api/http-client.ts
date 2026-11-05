import { apiClient } from "@/lib/api-client";


export const postHttp = apiClient.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? ''}`,
})
