import type { Product } from '@/types'
import { http } from './http'
import mockProducts from '../mock/products.json'

function delay(ms = 200): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await http.get<Product[]>('/products', async () => {
    await delay()
    return { code: 0, data: [...mockProducts] as Product[], message: 'ok' }
  })
  return res.data
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  const res = await http.get<Product>(`/products/${id}`, async () => {
    await delay(300)
    const product = (mockProducts as Product[]).find(p => p.id === id)
    return { code: 0, data: product as Product, message: 'ok' }
  })
  return res.data
}

export async function createProduct(product: Product): Promise<Product> {
  const res = await http.post<Product>('/products', product, async () => {
    await delay()
    return {
      code: 0,
      data: {
        ...product,
        id: `P${Date.now()}`,
        status: 'active',
        createTime: new Date().toISOString()
      },
      message: 'ok'
    }
  })
  return res.data
}

export async function updateProduct(_id: string, _data: Partial<Product>): Promise<void> {
  await http.put<void>(`/products/${_id}`, _data, async () => {
    await delay()
    return { code: 0, data: undefined as unknown as void, message: 'ok' }
  })
}

export async function deleteProduct(_id: string): Promise<void> {
  await http.delete<void>(`/products/${_id}`, async () => {
    await delay()
    return { code: 0, data: undefined as unknown as void, message: 'ok' }
  })
}
