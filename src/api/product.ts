/**
 * 商品接口层：与 server/src/routes/products.ts 契约一一对应。
 */
import type { Product } from '@/types'
import { http } from './http'

export async function fetchProducts(): Promise<Product[]> {
  const res = await http.get<Product[]>('/products')
  return res.data
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  // 后端 404 语义：查无商品时 http 层统一抛 ApiError，此处静默返回 undefined
  const res = await http.get<Product>(`/products/${id}`, { showError: false })
  return res.data
}

export async function createProduct(product: Product): Promise<Product> {
  const res = await http.post<Product>('/products', product)
  return res.data
}

export async function updateProduct(_id: string, _data: Partial<Product>): Promise<Product> {
  // 契约：PUT /products/:id 响应更新后的 Product
  const res = await http.put<Product>(`/products/${_id}`, _data)
  return res.data
}

export async function deleteProduct(_id: string): Promise<{ success: boolean }> {
  // 契约：DELETE /products/:id 响应 { success }
  const res = await http.delete<{ success: boolean }>(`/products/${_id}`)
  return res.data
}
