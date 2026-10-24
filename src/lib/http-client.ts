import axios, {
  type AxiosAdapter,
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

/**
 * Cấu trúc dữ liệu lỗi trả về từ backend API.
 * Hỗ trợ cả hai định dạng lỗi trường: object { field: message } hoặc array [{ field, message }].
 */
export interface BackendErrorPayload {
  /** Mã lỗi nghiệp vụ (ví dụ: 'VALIDATION_FAILED', 'USER_LOCKED', ...) */
  code?: string
  /** Thông điệp lỗi chi tiết từ server */
  message?: string
  /** Danh sách lỗi xác thực (dạng object hoặc mảng các trường lỗi) */
  errors?: Record<string, string> | Array<{ field?: string; message: string }>
  /** Lỗi xác thực cụ thể theo từng trường (nếu backend trả fieldErrors riêng) */
  fieldErrors?: Record<string, string>
  [key: string]: unknown
}

/**
 * Lớp lỗi chuẩn hóa dùng cho toàn bộ ứng dụng (kế thừa từ Error).
 * Chuyển đổi mọi lỗi HTTP, lỗi mạng và lỗi validation từ backend thành một cấu trúc đồng nhất.
 */
export class ApiError extends Error {
  /** Mã trạng thái HTTP (0 đại diện cho lỗi mạng hoặc timeout không nhận được response) */
  readonly status: number
  /** Mã lỗi nghiệp vụ do backend định nghĩa (nếu có) */
  readonly code?: string
  /** Lỗi xác thực theo từng trường (dùng để gán trực tiếp vào react-hook-form qua setError) */
  readonly fieldErrors?: Record<string, string>
  /** Dữ liệu gốc trả về từ response của server */
  readonly data?: unknown

  constructor(opts: {
    message: string
    status: number
    code?: string
    fieldErrors?: Record<string, string>
    data?: unknown
  }) {
    super(opts.message)
    this.name = 'ApiError'
    this.status = opts.status
    this.code = opts.code
    this.fieldErrors = opts.fieldErrors
    this.data = opts.data

    // Đảm bảo prototype chain hoạt động đúng khi kế thừa Error trong TypeScript
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * Type guard kiểm tra một đối tượng lỗi có phải là instance của ApiError hay không.
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/**
 * Các tùy chọn cấu hình khi khởi tạo HTTP client qua hàm `createHttpClient`.
 */
export interface CreateHttpClientOptions {
  /** Đường dẫn base URL của API (ví dụ: import.meta.env.VITE_API_BASE_URL) */
  baseURL: string
  /** Có gửi kèm cookie xác thực hay không (mặc định false, bật true khi dùng cookie HttpOnly) */
  withCredentials?: boolean
  /** Thời gian chờ tối đa cho mỗi request tính theo mili-giây (mặc định 15_000ms) */
  timeout?: number
  /** Hàm lấy Access Token từ bộ nhớ (in-memory) để gắn vào header Authorization: Bearer */
  getToken?: () => string | undefined
  /** Callback được gọi khi gặp lỗi 401 Unauthorized (phiên đăng nhập hết hạn) */
  onUnauthorized?: () => void
  /** Adapter tùy biến cho Axios (chủ yếu dùng cho unit test hoặc mock) */
  adapter?: AxiosAdapter
}

/**
 * Hàm tiện ích nội bộ: trích xuất và chuẩn hóa danh sách lỗi xác thực (fieldErrors)
 * từ dữ liệu trả về của backend thành một dictionary `Record<string, string>`.
 */
function extractFieldErrors(data: unknown): Record<string, string> | undefined {
  if (!data || typeof data !== 'object') return undefined

  const payload = data as BackendErrorPayload

  // Trường hợp 1: Backend trả về sẵn thuộc tính `fieldErrors` dạng object
  if (payload.fieldErrors && typeof payload.fieldErrors === 'object') {
    return payload.fieldErrors
  }

  // Trường hợp 2: Backend trả về thuộc tính `errors`
  if (payload.errors) {
    // Nếu errors là mảng các object [{ field, message }]
    if (Array.isArray(payload.errors)) {
      const result: Record<string, string> = {}
      for (const item of payload.errors) {
        if (item && typeof item === 'object') {
          const key = item.field || 'general'
          result[key] = item.message
        }
      }
      return Object.keys(result).length > 0 ? result : undefined
    }

    // Nếu errors là object { field: message } hoặc { field: [message] }
    if (typeof payload.errors === 'object') {
      const result: Record<string, string> = {}
      for (const [k, v] of Object.entries(payload.errors)) {
        if (typeof v === 'string') {
          result[k] = v
        } else if (Array.isArray(v) && typeof v[0] === 'string') {
          result[k] = v[0]
        }
      }
      return Object.keys(result).length > 0 ? result : undefined
    }
  }

  return undefined
}

/**
 * Khởi tạo một Axios instance đã được cấu hình sẵn các interceptor:
 * - Tự động đính kèm Bearer token (nếu có cấu hình `getToken`).
 * - Chuẩn hóa tham số mảng trong query string (dạng lặp key `key=1&key=2`).
 * - Bỏ qua các request bị hủy (AbortController / axios.isCancel) để không gây báo lỗi sai.
 * - Chuẩn hóa tất cả các lỗi thành đối tượng `ApiError`.
 * - Tự động kích hoạt callback `onUnauthorized` khi gặp lỗi 401 (ngoại trừ endpoint `/auth/login`).
 */
export function createHttpClient(opts: CreateHttpClientOptions): AxiosInstance {
  const instance = axios.create({
    baseURL: opts.baseURL,
    withCredentials: opts.withCredentials ?? false,
    timeout: opts.timeout ?? 15_000,
    adapter: opts.adapter,
    paramsSerializer: {
      // Serialize mảng thành dạng lặp key: foo=1&foo=2 (thay vì foo[0]=1&foo[1]=2)
      indexes: null,
    },
  })

  // Interceptor cho Request: gắn Bearer token nếu đã xác thực
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (opts.getToken) {
        const token = opts.getToken()
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  // Interceptor cho Response: chuẩn hóa lỗi và xử lý 401
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<BackendErrorPayload>) => {
      // Nếu request bị hủy chủ động qua AbortController hoặc CancelToken,
      // ném lại nguyên trạng để caller bắt được trạng thái hủy, không coi là lỗi ApiError
      if (axios.isCancel(error)) {
        return Promise.reject(error)
      }

      // Xử lý khi server có phản hồi (mã HTTP lỗi 4xx, 5xx)
      if (error.response) {
        const status = error.response.status
        const data = error.response.data
        const code = data?.code
        const fieldErrors = extractFieldErrors(data)

        // Khi gặp mã 401 Unauthorized, gọi callback onUnauthorized (trừ khi đang ở endpoint đăng nhập)
        const isLoginEndpoint = error.config?.url?.includes('/auth/login')
        if (status === 401 && !isLoginEndpoint) {
          try {
            opts.onUnauthorized?.()
          } catch {
            // Bảo vệ tránh vỡ luồng nếu callback onUnauthorized phát sinh lỗi
          }
        }

        const message =
          data?.message ||
          error.message ||
          `Yêu cầu thất bại với mã trạng thái ${status}`

        const apiError = new ApiError({
          message,
          status,
          code,
          fieldErrors,
          data,
        })

        return Promise.reject(apiError)
      }

      // Xử lý khi không nhận được response (lỗi mạng, timeout, hoặc máy chủ không thể kết nối)
      const status = 0
      const message = error.message || 'Lỗi mạng hoặc không thể kết nối đến máy chủ'

      const apiError = new ApiError({
        message,
        status,
        data: undefined,
      })

      return Promise.reject(apiError)
    },
  )

  return instance
}
