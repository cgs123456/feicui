/** 统一响应壳：对齐前端 src/api/http.ts 的 ApiResponse 语义 */
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}

/** 错误码：与前端 http.ts 既有语义对齐 */
export const CODE = {
  OK: 0,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_SMS: 1001,
  BAD_PARAM: 2000,
  BUSINESS_CONFLICT: 3000,
  SERVER_ERROR: 5000
} as const

export class ApiError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

/** 领域模型镜像自前端 src/types/models.ts（字段名一致，直接对齐契约） */
export type ProductStatus = 'active' | 'sold' | 'offline'

export interface Product {
  id: string
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
  merchantId?: string
  merchantName?: string
  description?: string
  status?: ProductStatus
  createTime?: string
  views?: number
  inquiries?: number
  certNo?: string
  certOrg?: string
  certDate?: string
  certGrade?: string
  certificate?: string
  popularity?: number
  stock?: number
}

export interface Address {
  id: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  fullAddress: string
  isDefault: boolean
}

export interface OrderItem {
  productId: string
  title: string
  cover: string
  price: number
  quantity: number
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'completed'
  | 'refunding'
  | 'refunded'
  | 'cancelled'

export interface Order {
  id: string
  orderNo: string
  items: OrderItem[]
  totalPrice: number
  status: OrderStatus
  address: Address
  remark: string
  createTime: string
  payTime?: string
  shipTime?: string
  completeTime?: string
  refundReason?: string
  refundTime?: string
  refundFromStatus?: OrderStatus
  logisticsNo?: string
  logisticsCompany?: string
  buyerId: string
  buyerName: string
  buyerPhone: string
}

export interface UserPayload {
  id: string
  phone: string
  role: 'owner' | 'buyer'
  nickname?: string
}
