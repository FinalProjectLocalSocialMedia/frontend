import { createPrng } from './ids'

const nextRandom = createPrng(20260419)

const config = { enabled: true, minMs: 200, maxMs: 500 }

/** Tắt/bật độ trễ mô phỏng (test nên tắt). */
export const setMockLatency = (enabled: boolean) => {
  config.enabled = enabled
}

const abortError = () => new DOMException('The operation was aborted.', 'AbortError')

/**
 * Mô phỏng độ trễ mạng 200–500 ms và tôn trọng `AbortSignal`
 * (giống axios: request bị huỷ sẽ reject, TanStack Query bỏ qua kết quả).
 */
export function mockDelay(signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(abortError())
  if (!config.enabled) return Promise.resolve()
  const ms = config.minMs + Math.floor(nextRandom() * (config.maxMs - config.minMs))
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(abortError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
