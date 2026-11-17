import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import {
  apiClient,
  refreshAccessToken,
  AuthExpiredError,
  isAuthExpiredError,
} from './api-client'
import { authEvents } from '@/features/auth/lib/auth-events'

describe('api-client and refreshAccessToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('refreshAccessToken single-flight', () => {
    it('executes only one refresh request when called multiple times concurrently', async () => {
      let callCount = 0
      const postSpy = vi.spyOn(apiClient, 'post').mockImplementation(async (url) => {
        if (url === '/user/auth/refresh') {
          callCount++
          await new Promise((resolve) => setTimeout(resolve, 20))
          return { data: { success: true } } as AxiosResponse
        }
        return { data: {} } as AxiosResponse
      })

      // Gọi đồng thời 3 lần
      const [res1, res2, res3] = await Promise.all([
        refreshAccessToken(),
        refreshAccessToken(),
        refreshAccessToken(),
      ])

      expect(callCount).toBe(1)
      expect(postSpy).toHaveBeenCalledTimes(1)
      expect(res1).toBeUndefined()
      expect(res2).toBeUndefined()
      expect(res3).toBeUndefined()
    })

    it('throws AuthExpiredError and emits unauthorized when refresh returns 401', async () => {
      const emitSpy = vi.spyOn(authEvents, 'emit')

      const error401 = new axios.AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        {} as InternalAxiosRequestConfig,
        {},
        {
          status: 401,
          statusText: 'Unauthorized',
          data: { message: 'Token expired' },
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        },
      )

      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(error401)

      await expect(refreshAccessToken()).rejects.toThrow(AuthExpiredError)
      expect(emitSpy).toHaveBeenCalledWith('unauthorized')
    })

    it('throws AuthExpiredError when refresh returns 403', async () => {
      const error403 = new axios.AxiosError(
        'Forbidden',
        'ERR_BAD_REQUEST',
        {} as InternalAxiosRequestConfig,
        {},
        {
          status: 403,
          statusText: 'Forbidden',
          data: { message: 'Token invalid' },
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        },
      )

      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(error403)

      try {
        await refreshAccessToken()
        expect.fail('Should have thrown AuthExpiredError')
      } catch (err) {
        expect(isAuthExpiredError(err)).toBe(true)
      }
    })

    it('throws normal network error when network fails (not AuthExpiredError)', async () => {
      const networkError = new axios.AxiosError(
        'Network Error',
        'ERR_NETWORK',
        {} as InternalAxiosRequestConfig,
        {},
        undefined,
      )

      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(networkError)

      try {
        await refreshAccessToken()
        expect.fail('Should have thrown network error')
      } catch (err) {
        expect(isAuthExpiredError(err)).toBe(false)
        expect((err as Error).message).toBe('Network Error')
      }
    })
  })
})

