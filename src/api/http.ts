export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export interface ApiError {
  code: number
  message: string
}

export class ApiErrorClass extends Error {
  code: number
  message: string

  constructor(code: number, message: string) {
    super(message)
    this.code = code
    this.message = message
    this.name = 'ApiError'
  }
}

type MockFn<T> = () => Promise<ApiResponse<T>>

interface RequestOptions {
  /** 是否自动弹出错误提示（默认 true） */
  showError?: boolean
  /** 请求超时时间（毫秒，默认 10000） */
  timeout?: number
}

interface HttpClient {
  get<T>(url: string, mockFn?: MockFn<T>, options?: RequestOptions): Promise<ApiResponse<T>>
  post<T>(url: string, data?: unknown, mockFn?: MockFn<T>, options?: RequestOptions): Promise<ApiResponse<T>>
  put<T>(url: string, data?: unknown, mockFn?: MockFn<T>, options?: RequestOptions): Promise<ApiResponse<T>>
  delete<T>(url: string, mockFn?: MockFn<T>, options?: RequestOptions): Promise<ApiResponse<T>>
}

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const baseURL = import.meta.env.VITE_API_BASE_URL || ''
const DEFAULT_TIMEOUT = 10000

/** 简单 Base64 编码 token（防君子不防小人，真实应用应使用 httpOnly cookie） */
const TOKEN_KEY = 'jadeite_token'
const TOKEN_EXPIRY_KEY = 'jadeite_token_expiry'

function encodeToken(raw: string): string {
  try {
    return btoa(encodeURIComponent(raw))
  } catch {
    return raw
  }
}

function decodeToken(encoded: string): string {
  try {
    return decodeURIComponent(atob(encoded))
  } catch {
    return encoded
  }
}

export function getToken(): string | null {
  const encoded = localStorage.getItem(TOKEN_KEY)
  if (!encoded) return null

  // 检查过期时间
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (expiry) {
    const expiryTime = parseInt(expiry, 10)
    if (Date.now() > expiryTime) {
      clearToken()
      return null
    }
  }

  return decodeToken(encoded)
}

export function setToken(token: string, expiresInMs: number = 7 * 24 * 60 * 60 * 1000): void {
  localStorage.setItem(TOKEN_KEY, encodeToken(token))
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresInMs))
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

/** 401 时尝试刷新 token（预留接口，当前 demo 直接登出） */
async function handleUnauthorized(): Promise<void> {
  // 真实项目中：调用 refreshToken 接口，成功后重试原请求
  // Demo 阶段：直接清除 token，跳转登录页
  clearToken()
  window.location.hash = '#/merchant/login'
}

async function request<T>(
  method: string,
  url: string,
  data?: unknown,
  mockFn?: MockFn<T>,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  const showError = options?.showError !== false // 默认 true
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT

  // Mock 模式
  if (useMock && mockFn) {
    try {
      return await mockFn()
    } catch (err) {
      if (err instanceof ApiErrorClass) throw err
      throw new ApiErrorClass(-1, err instanceof Error ? err.message : 'Mock 请求失败')
    }
  }

  // 构造请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const fetchOptions: RequestInit = {
    method,
    headers
  }

  if (data !== undefined && method !== 'GET' && method !== 'DELETE') {
    fetchOptions.body = JSON.stringify(data)
  }

  // 超时控制
  const controller = new AbortController()
  fetchOptions.signal = controller.signal
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const fullURL = `${baseURL}${url}`

  try {
    const response = await fetch(fullURL, fetchOptions)

    // 401 处理
    if (response.status === 401) {
      await handleUnauthorized()
      throw new ApiErrorClass(401, '登录已过期，请重新登录')
    }

    const json = await response.json()

    if (json.code !== 0) {
      const err = new ApiErrorClass(json.code || -1, json.message || '请求失败')
      if (showError) {
        // 通过自定义事件通知 UI 层展示错误
        window.dispatchEvent(new CustomEvent('api-error', { detail: err }))
      }
      throw err
    }

    return json as ApiResponse<T>
  } catch (err) {
    // 网络错误（断网、DNS、超时等）
    if (err instanceof ApiErrorClass) throw err

    const isAbort = err instanceof DOMException && err.name === 'AbortError'
    const isNetwork = err instanceof TypeError

    let message = '网络异常，请检查网络连接'
    if (isAbort) message = '请求超时，请稍后重试'
    else if (isNetwork) message = '网络连接失败，请检查网络设置'

    const apiErr = new ApiErrorClass(-1, message)
    if (showError) {
      window.dispatchEvent(new CustomEvent('api-error', { detail: apiErr }))
    }
    throw apiErr
  } finally {
    clearTimeout(timeoutId)
  }
}

export function createHttpClient(): HttpClient {
  return {
    get<T>(url: string, mockFn?: MockFn<T>, options?: RequestOptions) {
      return request<T>('GET', url, undefined, mockFn, options)
    },
    post<T>(url: string, data?: unknown, mockFn?: MockFn<T>, options?: RequestOptions) {
      return request<T>('POST', url, data, mockFn, options)
    },
    put<T>(url: string, data?: unknown, mockFn?: MockFn<T>, options?: RequestOptions) {
      return request<T>('PUT', url, data, mockFn, options)
    },
    delete<T>(url: string, mockFn?: MockFn<T>, options?: RequestOptions) {
      return request<T>('DELETE', url, undefined, mockFn, options)
    }
  }
}

export const http = createHttpClient()