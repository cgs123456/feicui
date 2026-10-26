import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../stores/cart'
import { useProductStore } from '../stores/product'
import type { Product } from '../types'

/** cart.addToCart 校验商品必须存在于镜像且 status==='active'，先种商品再测购物车行为 */
function seedProducts() {
  const productStore = useProductStore()
  productStore.products = [
    {
      id: 'P001',
      title: 'A',
      price: 100,
      cover: '',
      images: [],
      status: 'active',
      stock: 1,
      createTime: ''
    },
    {
      id: 'P002',
      title: 'B',
      price: 200,
      cover: '',
      images: [],
      status: 'active',
      stock: 99,
      createTime: ''
    },
    { id: 'P003', title: 'C', price: 100, cover: '', images: [], status: 'active', createTime: '' }
  ] as Product[]
}

describe('cartStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    seedProducts()
  })

  it('初始购物车为空', () => {
    const store = useCartStore()
    expect(store.items.length).toBe(0)
    expect(store.totalCount).toBe(0)
  })

  it('addToCart 添加新商品', () => {
    const store = useCartStore()
    store.addToCart({ productId: 'P001', title: '测试', cover: '', price: 100 })
    expect(store.items.length).toBe(1)
    expect(store.totalCount).toBe(1)
    expect(store.items[0].checked).toBe(true)
  })

  it('addToCart 重复商品累加数量', () => {
    const store = useCartStore()
    // P003 无 stock 字段（不限购），P001 stock:1 会被库存上限 clamp
    store.addToCart({ productId: 'P003', title: '测试', cover: '', price: 100 })
    store.addToCart({ productId: 'P003', title: '测试', cover: '', price: 100 })
    expect(store.items.length).toBe(1)
    expect(store.totalCount).toBe(2)
  })

  it('addToCart 价格<=0 不添加', () => {
    const store = useCartStore()
    store.addToCart({ productId: 'P001', title: '测试', cover: '', price: 0 })
    expect(store.items.length).toBe(0)
    store.addToCart({ productId: 'P002', title: '测试', cover: '', price: -10 })
    expect(store.items.length).toBe(0)
  })

  it('removeFromCart 移除商品', () => {
    const store = useCartStore()
    store.addToCart({ productId: 'P001', title: '测试', cover: '', price: 100 })
    store.removeFromCart('P001')
    expect(store.items.length).toBe(0)
  })

  it('updateQuantity 更新数量', () => {
    const store = useCartStore()
    store.addToCart({ productId: 'P003', title: '测试', cover: '', price: 100 })
    store.updateQuantity('P003', 5)
    expect(store.items[0].quantity).toBe(5)
  })

  it('updateQuantity 超库存时被 clamp（P001 stock:1）', () => {
    const store = useCartStore()
    store.addToCart({ productId: 'P001', title: '测试', cover: '', price: 100 })
    store.updateQuantity('P001', 5)
    expect(store.items[0].quantity).toBe(1)
  })

  it('updateQuantity 数量<=0 自动移除', () => {
    const store = useCartStore()
    store.addToCart({ productId: 'P001', title: '测试', cover: '', price: 100 })
    store.updateQuantity('P001', 0)
    expect(store.items.length).toBe(0)
  })

  it('toggleCheck 切换选中状态', () => {
    const store = useCartStore()
    store.addToCart({ productId: 'P001', title: '测试', cover: '', price: 100 })
    expect(store.items[0].checked).toBe(true)
    store.toggleCheck('P001')
    expect(store.items[0].checked).toBe(false)
  })

  it('totalPrice 只计算选中商品', () => {
    const store = useCartStore()
    store.addToCart({ productId: 'P001', title: 'A', cover: '', price: 100 })
    store.addToCart({ productId: 'P002', title: 'B', cover: '', price: 200 })
    expect(store.totalPrice).toBe(300)
    store.toggleCheck('P001')
    expect(store.totalPrice).toBe(200)
  })

  it('isInCart 判断商品是否在购物车', () => {
    const store = useCartStore()
    expect(store.isInCart('P001')).toBe(false)
    store.addToCart({ productId: 'P001', title: '测试', cover: '', price: 100 })
    expect(store.isInCart('P001')).toBe(true)
  })

  it('clearCart 清空购物车', () => {
    const store = useCartStore()
    store.addToCart({ productId: 'P001', title: '测试', cover: '', price: 100 })
    store.clearCart()
    expect(store.items.length).toBe(0)
  })

  it('toggleCheckAll 全选/取消全选', () => {
    const store = useCartStore()
    store.addToCart({ productId: 'P001', title: 'A', cover: '', price: 100 })
    store.addToCart({ productId: 'P002', title: 'B', cover: '', price: 200 })
    // 默认全选
    expect(store.checkedItems.length).toBe(2)
    // 取消全选
    store.toggleCheckAll()
    expect(store.checkedItems.length).toBe(0)
    // 再次全选
    store.toggleCheckAll()
    expect(store.checkedItems.length).toBe(2)
  })

  it('localStorage 写入失败时派发 storage-error 事件', () => {
    const store = useCartStore()
    const eventSpy = vi.fn()
    window.addEventListener('storage-error', eventSpy)

    // 模拟 localStorage 写入失败
    const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    store.addToCart({ productId: 'P001', title: '测试', cover: '', price: 100 })

    expect(eventSpy).toHaveBeenCalled()

    // 恢复
    setItemSpy.mockRestore()
    window.removeEventListener('storage-error', eventSpy)
  })
})
