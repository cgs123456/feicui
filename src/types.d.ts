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
  status?: string
  createTime?: string
}

export interface UserInfo {
  id: string
  name: string
  phone: string
  avatar: string
  role: 'user' | 'merchant'
}
