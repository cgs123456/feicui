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

interface HttpClient {
  get<T>(url: string, mockFn?: MockFn<T>): Promise<ApiResponse<T>>
  post<T>(url: string, data?: unknown, mockFn?: MockFn<T>): Promise<ApiResponse<T>>
  put<T>(url: string, data?: unknown, mockFn?: MockFn<T>): Promise<ApiResponse<T>>
  delete<T>(url: string, mockFn?: MockFn<T>): Promise<ApiResponse<T>>
}

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const baseURL = import.meta.env.VITE_API_BASE_URL || ''

function getToken(): string | null {
  return localStorage.getItem('jadeite_token')
}

async function request<T>(
  method: string,
  url: string,
  data?: unknown,
  mockFn?: MockFn<T>
): Promise<ApiResponse<T>> {
  if (useMock && mockFn) {
    return mockFn()
  }

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

  const fullURL = `${baseURL}${url}`

  const response = await fetch(fullURL, fetchOptions)
  const json = await response.json()

  if (json.code !== 0) {
    throw new ApiErrorClass(json.code || -1, json.message || '请求失败')
  }

  return json as ApiResponse<T>
}

export function createHttpClient(): HttpClient {
  return {
    get<T>(url: string, mockFn?: MockFn<T>) {
      return request<T>('GET', url, undefined, mockFn)
    },
    post<T>(url: string, data?: unknown, mockFn?: MockFn<T>) {
      return request<T>('POST', url, data, mockFn)
    },
    put<T>(url: string, data?: unknown, mockFn?: MockFn<T>) {
      return request<T>('PUT', url, data, mockFn)
    },
    delete<T>(url: string, mockFn?: MockFn<T>) {
      return request<T>('DELETE', url, undefined, mockFn)
    }
  }
}

export const http = createHttpClient()
