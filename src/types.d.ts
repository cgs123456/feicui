export interface Product {
  id: string
  title: string
  price: number
  originalPrice?: number
  cover: string
  images?: string[]
  category?: string
  material?: string
  /** 种水：玻璃种/冰种/糯种/豆种 */
  waterGrade?: string
  /** 颜色：绿色系/紫色系/红色系/黄色系/无色系/飘花 */
  color?: string
  size?: string
  weight?: string
  style?: string
  description?: string
  status?: 'active' | 'sold' | 'offline'
  createTime?: string
  views?: number
  inquiries?: number
  /** 鉴定证书编号 */
  certNo?: string
  /** 鉴定机构 */
  certOrg?: string
  /** 鉴定日期 */
  certDate?: string
  /** 证书等级 */
  certGrade?: string
  certificate?: string
  /** 热度/排名 */
  popularity?: number
}

export interface UserInfo {
  id: string
  name: string
  phone: string
  avatar: string
  role: 'user' | 'merchant' | 'admin'
  permissions?: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  products?: ProductRecommendation[]
  ts: string
}

export interface ProductRecommendation {
  id: string
  cover: string
  title: string
  price: number
  score?: number
  reasons?: string[]
}

export interface UserRequirement {
  budget: number | null
  category: string | null
  color: string | null
  material: string | null
  waterGrade: string | null
  usage: string | null
  size: string | null
  giftScene: string | null
  keywords: string[]
  style?: string | null
  preferenceTags?: string[]
}

export interface MatchResult {
  product: Product
  score: number
  reasons: string[]
}

// === 订单相关 ===
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunding' | 'refunded'

export interface OrderItem {
  productId: string
  title: string
  cover: string
  price: number
  quantity: number
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
  logisticsNo?: string
  logisticsCompany?: string
  buyerId: string
  buyerName: string
  buyerPhone: string
}

// === 购物车 ===
export interface CartItem {
  productId: string
  title: string
  cover: string
  price: number
  quantity: number
  checked: boolean
  addTime: string
}

// === 收藏 ===
export interface Favorite {
  productId: string
  title: string
  cover: string
  price: number
  addTime: string
}

// === 用户偏好 ===
export interface UserPreferences {
  favoriteCategories: string[]
  favoriteMaterials: string[]
  priceRange: { min: number; max: number } | null
  stylePreference: string[]
  giftScenes: string[]
  browseHistory: string[]
}

// === 客户管理 ===
export interface Customer {
  id: string
  name: string
  avatar: string
  phone: string
  lastMessage: string
  lastTime: string
  source: string
  tags: string[]
  status: string
  views: number
  inquiries: number
  notes: string
  /** 成交概率 0-100 */
  conversionProbability?: number
  conversation?: Array<{ role: string; content: string; time: string }>
}

// === 转化漏斗 ===
export interface ConversionFunnel {
  views: number
  inquiries: number
  orders: number
  completed: number
  viewToInquiryRate: number
  inquiryToOrderRate: number
  orderToCompleteRate: number
}

// === 商家端权限 ===
export type MerchantRole = 'owner' | 'manager' | 'staff'
export type PermissionKey = 'product:manage' | 'order:manage' | 'customer:view' | 'analytics:view' | 'settings:manage'

export interface MerchantPermission {
  role: MerchantRole
  label: string
  permissions: PermissionKey[]
}

// === 数据统计 ===
export interface OrderStats {
  total: number
  pending: number
  shipped: number
  completed: number
  refunding: number
}

export interface RevenueStats {
  today: number
  week: number
  month: number
  total: number
}

export interface DashboardStats {
  todayViews: number
  inquiries: number
  orders: OrderStats
  revenue: RevenueStats
  products: number
  customers: number
  recentMessages: Array<{
    id: string
    name: string
    avatar: string
    lastMessage: string
    time: string
    unread: number
  }>
}