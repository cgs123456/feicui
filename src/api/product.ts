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
  // 与真实后端 404 语义对齐：查无商品时返回非 0 code（http 层统一抛 ApiError）
  const res = await http.get<Product>(
    `/products/${id}`,
    async () => {
      await delay(300)
      const product = (mockProducts as Product[]).find(p => p.id === id)
      if (!product) {
        return { code: 404, data: undefined as unknown as Product, message: '商品不存在' }
      }
      return { code: 0, data: product, message: 'ok' }
    },
    { showError: false }
  )
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

export async function updateProduct(_id: string, _data: Partial<Product>): Promise<Product> {
  // 契约：PUT /products/:id 响应更新后的 Product
  const res = await http.put<Product>(`/products/${_id}`, _data, async () => {
    await delay()
    return {
      code: 0,
      data: { ...mockProducts.find(p => p.id === _id), ..._data, id: _id } as Product,
      message: 'ok'
    }
  })
  return res.data
}

export async function deleteProduct(_id: string): Promise<{ success: boolean }> {
  // 契约：DELETE /products/:id 响应 { success }
  const res = await http.delete<{ success: boolean }>(`/products/${_id}`, async () => {
    await delay()
    return { code: 0, data: { success: true }, message: 'ok' }
  })
  return res.data
}
