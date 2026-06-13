import { ref, type Ref } from 'vue'
import { ApiErrorClass } from '../api/http'

interface UseRequestOptions<T> {
  /** 初始数据 */
  initialData?: T
  /** 是否立即执行 */
  immediate?: boolean
  /** 是否自动弹出错误提示 */
  showError?: boolean
  /** 自动重试次数（默认 0，弱网场景建议 1~2） */
  retryCount?: number
  /** 重试间隔（毫秒，默认 1000） */
  retryInterval?: number
}

interface UseRequestReturn<T> {
  /** 响应数据 */
  data: Ref<T | undefined>
  /** 加载状态 */
  loading: Ref<boolean>
  /** 错误信息 */
  error: Ref<string | null>
  /** 是否无数据 */
  empty: Ref<boolean>
  /** 执行请求 */
  execute: (...args: unknown[]) => Promise<T | undefined>
  /** 重试上次请求 */
  retry: () => Promise<T | undefined>
  /** 重置状态 */
  reset: () => void
}

/**
 * 统一请求 hook：自动处理 loading / empty / error 状态，支持自动重试
 */
export function useRequest<T>(
  fn: (...args: unknown[]) => Promise<T>,
  options: UseRequestOptions<T> = {}
): UseRequestReturn<T> {
  const { initialData, immediate = false, showError = true, retryCount = 0, retryInterval = 1000 } = options

  const data = ref<T | undefined>(initialData) as Ref<T | undefined>
  const loading = ref(false)
  const error = ref<string | null>(null)
  const empty = ref(false)

  let lastArgs: unknown[] = []

  async function executeWithRetry(fnCall: () => Promise<T>, retriesLeft: number): Promise<T | undefined> {
    try {
      return await fnCall()
    } catch (err) {
      if (retriesLeft > 0) {
        await new Promise(resolve => setTimeout(resolve, retryInterval))
        return executeWithRetry(fnCall, retriesLeft - 1)
      }
      throw err
    }
  }

  async function execute(...args: unknown[]): Promise<T | undefined> {
    lastArgs = args
    loading.value = true
    error.value = null
    empty.value = false

    try {
      const result = await executeWithRetry(() => fn(...args), retryCount)
      data.value = result
      empty.value = result === null || result === undefined || (Array.isArray(result) && result.length === 0)
      return result
    } catch (err) {
      const msg = err instanceof ApiErrorClass
        ? err.message
        : err instanceof Error
          ? err.message
          : '请求失败'
      error.value = msg
      empty.value = false

      if (showError) {
        window.dispatchEvent(new CustomEvent('api-error', { detail: { message: msg } }))
      }

      return undefined
    } finally {
      loading.value = false
    }
  }

  function retry(): Promise<T | undefined> {
    return execute(...lastArgs)
  }

  function reset() {
    data.value = initialData
    loading.value = false
    error.value = null
    empty.value = false
  }

  if (immediate) {
    execute()
  }

  return { data, loading, error, empty, execute, retry, reset }
}