import { describe, it, expect, vi } from 'vitest'
import axios, { type AxiosAdapter } from 'axios'
import { createHttpClient, ApiError, isApiError } from './http-client'

describe('http-client', () => {
  it('handles successful requests', async () => {
    const mockAdapter: AxiosAdapter = async (config) => ({
      data: { success: true, message: 'OK' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    })

    const client = createHttpClient({
      baseURL: 'https://api.nearby.local',
      adapter: mockAdapter,
    })

    const response = await client.get('/test')
    expect(response.status).toBe(200)
    expect(response.data).toEqual({ success: true, message: 'OK' })
  })

  it('attaches Bearer token when getToken is provided', async () => {
    let capturedAuthHeader: string | undefined

    const mockAdapter: AxiosAdapter = async (config) => {
      capturedAuthHeader = config.headers?.Authorization as string
      return {
        data: { authenticated: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }

    const client = createHttpClient({
      baseURL: 'https://api.nearby.local',
      getToken: () => 'my-secret-token-123',
      adapter: mockAdapter,
    })

    await client.get('/profile')
    expect(capturedAuthHeader).toBe('Bearer my-secret-token-123')
  })

  it('transforms 422 errors into ApiError with fieldErrors', async () => {
    const mockAdapter: AxiosAdapter = async (config) => {
      const error = new axios.AxiosError(
        'Request failed with status code 422',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          data: {
            code: 'VALIDATION_FAILED',
            message: 'Dữ liệu không hợp lệ',
            errors: {
              email: 'Email đã tồn tại trong hệ thống',
              phoneNumber: 'Số điện thoại không đúng định dạng',
            },
          },
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: {},
          config,
        },
      )
      return Promise.reject(error)
    }

    const client = createHttpClient({
      baseURL: 'https://api.nearby.local',
      adapter: mockAdapter,
    })

    try {
      await client.post('/users', { email: 'test@example.com' })
      expect.fail('Should have thrown an error')
    } catch (err) {
      expect(isApiError(err)).toBe(true)
      const apiErr = err as ApiError
      expect(apiErr.status).toBe(422)
      expect(apiErr.code).toBe('VALIDATION_FAILED')
      expect(apiErr.message).toBe('Dữ liệu không hợp lệ')
      expect(apiErr.fieldErrors).toEqual({
        email: 'Email đã tồn tại trong hệ thống',
        phoneNumber: 'Số điện thoại không đúng định dạng',
      })
    }
  })

  it('transforms array errors into fieldErrors object', async () => {
    const mockAdapter: AxiosAdapter = async (config) => {
      const error = new axios.AxiosError(
        'Validation error',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          data: {
            message: 'Lỗi xác thực',
            errors: [
              { field: 'reason', message: 'Lý do không được để trống' },
              { field: 'targetId', message: 'ID không hợp lệ' },
            ],
          },
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: {},
          config,
        },
      )
      return Promise.reject(error)
    }

    const client = createHttpClient({
      baseURL: 'https://api.nearby.local',
      adapter: mockAdapter,
    })

    try {
      await client.post('/reports/resolve', {})
      expect.fail('Should have thrown')
    } catch (err) {
      expect(isApiError(err)).toBe(true)
      const apiErr = err as ApiError
      expect(apiErr.fieldErrors).toEqual({
        reason: 'Lý do không được để trống',
        targetId: 'ID không hợp lệ',
      })
    }
  })

  it('transforms network errors (no response) into ApiError with status 0', async () => {
    const mockAdapter: AxiosAdapter = async (config) => {
      const error = new axios.AxiosError(
        'Network Error',
        'ERR_NETWORK',
        config,
        {},
        undefined, // No response
      )
      return Promise.reject(error)
    }

    const client = createHttpClient({
      baseURL: 'https://api.nearby.local',
      adapter: mockAdapter,
    })

    try {
      await client.get('/anywhere')
      expect.fail('Should have thrown')
    } catch (err) {
      expect(isApiError(err)).toBe(true)
      const apiErr = err as ApiError
      expect(apiErr.status).toBe(0)
      expect(apiErr.message).toContain('Network Error')
    }
  })

  it('triggers onUnauthorized callback on 401 status for non-login endpoints', async () => {
    const onUnauthorized = vi.fn()

    const mockAdapter: AxiosAdapter = async (config) => {
      const error = new axios.AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          data: { message: 'Phiên đăng nhập đã hết hạn' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        },
      )
      return Promise.reject(error)
    }

    const client = createHttpClient({
      baseURL: 'https://api.nearby.local',
      onUnauthorized,
      adapter: mockAdapter,
    })

    try {
      await client.get('/protected-resource')
    } catch (err) {
      expect(isApiError(err)).toBe(true)
      expect((err as ApiError).status).toBe(401)
    }

    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('does NOT trigger onUnauthorized on 401 for /auth/login endpoint', async () => {
    const onUnauthorized = vi.fn()

    const mockAdapter: AxiosAdapter = async (config) => {
      const error = new axios.AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          data: { message: 'Email hoặc mật khẩu không chính xác' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        },
      )
      return Promise.reject(error)
    }

    const client = createHttpClient({
      baseURL: 'https://api.nearby.local',
      onUnauthorized,
      adapter: mockAdapter,
    })

    try {
      await client.post('/auth/login', { email: 'wrong@test.com', password: 'bad' })
    } catch (err) {
      expect(isApiError(err)).toBe(true)
    }

    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('re-throws canceled requests untouched without converting to ApiError', async () => {
    const controller = new AbortController()

    const mockAdapter: AxiosAdapter = async (config) => {
      const error = new axios.CanceledError('canceled', undefined, config)
      return Promise.reject(error)
    }

    const client = createHttpClient({
      baseURL: 'https://api.nearby.local',
      adapter: mockAdapter,
    })

    controller.abort()

    try {
      await client.get('/long-request', { signal: controller.signal })
      expect.fail('Should have aborted')
    } catch (err) {
      expect(axios.isCancel(err)).toBe(true)
      expect(isApiError(err)).toBe(false)
    }
  })
})
