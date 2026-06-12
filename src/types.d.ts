export interface Product {
  id: string
  title: string
  price: number
  originalPrice?: number
  cover: string
  images?: string[]
  category?: string
  material?: string
  size?: string
  weight?: string
  style?: string
  certificate?: string
  description?: string
  status?: 'active' | 'sold' | 'offline'
  createTime?: string
  views?: number
  inquiries?: number
}

export interface UserInfo {
  id: string
  name: string
  phone: string
  avatar: string
  role: 'user' | 'merchant'
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
  usage: string | null
  size: string | null
  giftScene: string | null
  keywords: string[]
}

export interface MatchResult {
  product: Product
  score: number
  reasons: string[]
}