// === 接口请求/响应类型 ===
// 与 src/types/models.ts 中的业务模型分离，专门用于 API 层

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

/** 后端登录用户载荷（镜像 server/src/types.ts UserPayload；到前端 UserInfo 的映射在 user store 完成） */
export interface LoginUser {
  id: string
  phone: string
  role: 'owner' | 'buyer'
  nickname?: string
}

export interface LoginResponse {
  success: boolean
  user?: LoginUser
  token?: string
}

export interface SendSmsCodeResponse {
  code: string
}

// 订单接口（契约预留：api 层暂无 order 实现，数据流当前由 store 直连 mock）
// 注意：与 store 层 createOrder 参数的映射关系——
//   items{productId,quantity} → store 由商品表补齐 title/cover/price 快照
//   addressId                → store 当前传完整 address 对象快照（接后端后改传 id）
//   remark                   → 透传
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
// store 层 shipOrder(id) 当前不收物流参数；接真实后端时需在 B 端发货弹窗补录并透传

export interface RefundParams {
  reason: string
}
