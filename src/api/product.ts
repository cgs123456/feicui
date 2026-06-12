import type { Product } from '@/types'
import mockProducts from '../mock/products.json'

// 模拟延迟
function delay(ms = 200): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function fetchProducts(): Promise<Product[]> {
  await delay()
  return [...mockProducts] as Product[]
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  await delay(300)
  return (mockProducts as Product[]).find(p => p.id === id)
}

export async function createProduct(product: Product): Promise<Product> {
  await delay()
  return {
    ...product,
    id: `P${Date.now()}`,
    status: 'active',
    createTime: new Date().toISOString()
  }
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await delay()
  // Mock: 实际项目中发送 PUT 请求
}

export async function deleteProduct(id: string): Promise<void> {
  await delay()
  // Mock: 实际项目中发送 DELETE 请求
}
