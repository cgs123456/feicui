import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductStore } from '../stores/product'

describe('productStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始应加载 mock 商品数据', () => {
    const store = useProductStore()
    expect(store.products.length).toBeGreaterThan(0)
  })

  it('getProductById 能找到存在的商品', () => {
    const store = useProductStore()
    const firstId = store.products[0].id
    const product = store.getProductById(firstId)
    expect(product).toBeDefined()
    expect(product?.id).toBe(firstId)
  })

  it('getProductById 对不存在的 id 返回 undefined', () => {
    const store = useProductStore()
    const product = store.getProductById('non-existent-id')
    expect(product).toBeUndefined()
  })

  it('addProduct 应添加到列表头部', () => {
    const store = useProductStore()
    const oldLength = store.products.length
    store.addProduct({ id: '', title: '测试商品', price: 999, cover: '' })
    expect(store.products.length).toBe(oldLength + 1)
    expect(store.products[0].title).toBe('测试商品')
    expect(store.products[0].status).toBe('active')
  })

  it('updateProduct 应更新已有商品', () => {
    const store = useProductStore()
    const id = store.products[0].id
    store.updateProduct(id, { title: '已更新标题', price: 8888 })
    const updated = store.getProductById(id)
    expect(updated?.title).toBe('已更新标题')
    expect(updated?.price).toBe(8888)
  })

  it('deleteProduct 应删除商品', () => {
    const store = useProductStore()
    const id = store.products[0].id
    const oldLength = store.products.length
    store.deleteProduct(id)
    expect(store.products.length).toBe(oldLength - 1)
    expect(store.getProductById(id)).toBeUndefined()
  })
})
