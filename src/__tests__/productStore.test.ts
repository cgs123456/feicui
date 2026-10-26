import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductStore } from '../stores/product'
import type { Product } from '../types'

vi.mock('../api/product', () => ({
  fetchProducts: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn()
}))

import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../api/product'

const mockedFetch = vi.mocked(fetchProducts)
const mockedCreate = vi.mocked(createProduct)
const mockedUpdate = vi.mocked(updateProduct)
const mockedDelete = vi.mocked(deleteProduct)

function makeProduct(over: Partial<Product> = {}): Product {
  return {
    id: 'P001',
    title: '冰种翡翠手镯',
    price: 1000,
    cover: 'https://cdn.example.com/p001.jpg',
    images: [],
    category: '手镯',
    status: 'active',
    stock: 5,
    createTime: '2026-01-01T00:00:00.000Z',
    ...over
  } as Product
}

describe('productStore（server 模式：后端为唯一数据源）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('syncFromServer 拉取后端全量覆盖镜像', async () => {
    const store = useProductStore()
    mockedFetch.mockResolvedValue([makeProduct(), makeProduct({ id: 'P002' })])

    await store.syncFromServer()

    expect(mockedFetch).toHaveBeenCalledTimes(1)
    expect(store.products).toHaveLength(2)
    expect(store.products[1].id).toBe('P002')
  })

  it('addProduct 调 createProduct 并把服务端返回的新商品前置插入', async () => {
    const store = useProductStore()
    store.products = [makeProduct()]
    const created = makeProduct({ id: 'P999', title: '新发布商品' })
    mockedCreate.mockResolvedValue(created)

    await store.addProduct({ ...created, id: '' } as Product)

    expect(mockedCreate).toHaveBeenCalledTimes(1)
    expect(store.products[0].id).toBe('P999')
    expect(store.products).toHaveLength(2)
  })

  it('updateProductInStore 以服务端权威值原位替换，不本地合并', async () => {
    const store = useProductStore()
    store.products = [makeProduct({ price: 1000 })]
    // 服务端返回值故意与本地不同：本地镜像必须让位于服务端
    mockedUpdate.mockResolvedValue(makeProduct({ price: 888 }))

    await store.updateProduct('P001', { price: 777 })

    expect(mockedUpdate).toHaveBeenCalledWith('P001', { price: 777 })
    expect(store.products[0].price).toBe(888)
  })

  it('deleteProductById 调 deleteProduct 并从镜像移除', async () => {
    const store = useProductStore()
    store.products = [makeProduct()]
    mockedDelete.mockResolvedValue({ success: true })

    await store.deleteProduct('P001')

    expect(mockedDelete).toHaveBeenCalledWith('P001')
    expect(store.products).toHaveLength(0)
  })

  it('decreaseStock 镜像扣减；-1 不限库存恒成功；库存不足返回 false', () => {
    const store = useProductStore()
    store.products = [makeProduct({ id: 'A', stock: 3 }), makeProduct({ id: 'B', stock: -1 })]

    expect(store.decreaseStock('A', 2)).toBe(true)
    expect(store.getProductById('A')?.stock).toBe(1)
    expect(store.decreaseStock('A', 2)).toBe(false)
    expect(store.decreaseStock('B', 999)).toBe(true)
    expect(store.decreaseStock('C', 1)).toBe(false)
  })

  it('getFilteredProducts 关键词匹配标题/材质并支持价格排序', () => {
    const store = useProductStore()
    store.products = [
      makeProduct({ id: 'A', title: '冰种手镯', material: '翡翠', price: 3000 }),
      makeProduct({ id: 'B', title: '糯种吊坠', material: '翡翠', price: 800 }),
      makeProduct({ id: 'C', title: '和田玉牌', material: '和田玉', price: 1500 })
    ]

    const byKw = store.getFilteredProducts({ keyword: '翡翠' })
    expect(byKw.map(p => p.id)).toEqual(['A', 'B'])

    const byPrice = store.getFilteredProducts({ sort: 'price-asc' })
    expect(byPrice.map(p => p.id)).toEqual(['B', 'C', 'A'])
  })

  it('batchUpdateStatus 逐个调用 updateProduct 并替换镜像', async () => {
    const store = useProductStore()
    store.products = [makeProduct({ id: 'A' }), makeProduct({ id: 'B' })]
    mockedUpdate.mockImplementation((_id, data) =>
      Promise.resolve(makeProduct({ id: _id, ...data }))
    )

    await store.batchUpdateStatus(['A', 'B'], 'offline')

    expect(mockedUpdate).toHaveBeenCalledTimes(2)
    expect(store.products.every((p: Product) => p.status === 'offline')).toBe(true)
  })
})
