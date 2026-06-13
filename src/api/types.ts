// === 接口请求/响应类型 ===
// 与 src/types.d.ts 中的业务模型分离，专门用于 API 层

import type { Product, UserInfo } from '@/types'

// 通用分页
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 商品接口
export interface FetchProductsParams {
  keyword?: string
  category?: string
  material?: string
  priceMin?: number
  priceMax?: number
  status?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface CreateProductParams {
  title: string
  price: number
  originalPrice?: number
  cover: string
  images?: string[]
  category?: string
  material?: string
  waterGrade?: string
  color?: string
  size?: string
  weight?: string
  style?: string
  description?: string
}

export interface UpdateProductParams extends Partial<CreateProductParams> {
  id: string
  status?: 'active' | 'sold' | 'offline'
}

// 用户接口
export interface LoginParams {
  phone: string
  code: string
}

export interface LoginResponse {
  success: boolean
  user?: UserInfo
  token?: string
}

export interface SendSmsCodeResponse {
  code: string
}

// 订单接口
export interface CreateOrderParams {
  items: Array<{
    productId: string
    quantity: number
  }>
  addressId: string
  remark?: string
}

export interface ShipOrderParams {
  logisticsNo: string
  logisticsCompany: string
}

export interface RefundParams {
  reason: string
}
