import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../stores/cart'

describe('cartStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
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
    store.addToCart({ productId: 'P001', title: '测试', cover: '', price: 100 })
    store.addToCart({ productId: 'P001', title: '测试', cover: '', price: 100 })
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
    store.addToCart({ productId: 'P001', title: '测试', cover: '', price: 100 })
    store.updateQuantity('P001', 5)
    expect(store.items[0].quantity).toBe(5)
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
})