import { createHttpClient } from "@/lib/http-client";



export const postHttp= createHttpClient({
    baseURL: `${import.meta.env.VITE_API_BASE_URL ?? ''}`,
    withCredentials: true, 
    timeout: 15_000,
})