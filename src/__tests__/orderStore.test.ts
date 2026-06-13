import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOrderStore } from '../stores/order'

const mockAddress = {
  id: 'ADDR001', name: '张三', phone: '13800001111',
  province: '北京', city: '北京', district: '朝阳区',
  detail: '建国路88号', fullAddress: '北京市朝阳区建国路88号', isDefault: true
}

describe('orderStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('初始订单列表为空', () => {
    const store = useOrderStore()
    expect(store.orders.length).toBe(0)
  })

  it('createOrder 创建订单', () => {
    const store = useOrderStore()
    const order = store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    expect(order).not.toBeNull()
    expect(order!.status).toBe('pending')
    expect(store.orders.length).toBe(1)
  })

  it('createOrder 空商品返回 null', () => {
    const store = useOrderStore()
    const order = store.createOrder({
      items: [],
      totalPrice: 0,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    expect(order).toBeNull()
  })

  it('createOrder 价格异常返回 null', () => {
    const store = useOrderStore()
    const order = store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: -10, quantity: 1 }],
      totalPrice: -10,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    expect(order).toBeNull()
  })

  it('订单状态完整流转：pending → paid → shipped → completed', () => {
    const store = useOrderStore()
    const order = store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id

    expect(store.payOrder(id)).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('paid')

    expect(store.shipOrder(id)).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('shipped')
    expect(store.getOrderById(id)!.logisticsNo).toBeDefined()

    expect(store.completeOrder(id)).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('completed')
  })

  it('重复支付返回 false', () => {
    const store = useOrderStore()
    const order = store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id
    expect(store.payOrder(id)).toBe(true)
    expect(store.payOrder(id)).toBe(false) // 重复支付
  })

  it('重复发货返回 false', () => {
    const store = useOrderStore()
    const order = store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id
    store.payOrder(id)
    expect(store.shipOrder(id)).toBe(true)
    expect(store.shipOrder(id)).toBe(false) // 重复发货
  })

  it('退款流程：shipped → refunding → refunded', () => {
    const store = useOrderStore()
    const order = store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id
    store.payOrder(id)
    store.shipOrder(id)

    expect(store.requestRefund(id, '不想要了')).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('refunding')

    expect(store.approveRefund(id)).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('refunded')
  })

  it('拒绝退款：refunding → shipped', () => {
    const store = useOrderStore()
    const order = store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id
    store.payOrder(id)
    store.shipOrder(id)
    store.requestRefund(id, '不想要了')

    expect(store.rejectRefund(id)).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('shipped')
  })

  it('取消订单：pending → cancelled', () => {
    const store = useOrderStore()
    const order = store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id
    expect(store.cancelOrder(id)).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('cancelled')
  })

  it('已支付订单不能取消', () => {
    const store = useOrderStore()
    const order = store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id
    store.payOrder(id)
    expect(store.cancelOrder(id)).toBe(false)
  })

  it('商家确认付款：pending → paid', () => {
    const store = useOrderStore()
    const order = store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id
    expect(store.confirmPayment(id)).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('paid')
  })

  it('getOrdersByStatus 按状态筛选', () => {
    const store = useOrderStore()
    store.createOrder({
      items: [{ productId: 'P001', title: 'A', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100, address: mockAddress, remark: '',
      buyerId: 'U001', buyerName: '用户', buyerPhone: '13800001111'
    })
    store.createOrder({
      items: [{ productId: 'P002', title: 'B', cover: '', price: 200, quantity: 1 }],
      totalPrice: 200, address: mockAddress, remark: '',
      buyerId: 'U001', buyerName: '用户', buyerPhone: '13800001111'
    })
    expect(store.getOrdersByStatus('pending').length).toBe(2)
    expect(store.getOrdersByStatus('paid').length).toBe(0)
  })

  it('validateOrderItems 校验', () => {
    const store = useOrderStore()
    expect(store.validateOrderItems([])).toBe('订单商品不能为空')
    expect(store.validateOrderItems([{ productId: 'P001', title: '测试', cover: '', price: 0, quantity: 1 }])).toContain('价格异常')
    expect(store.validateOrderItems([{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 0 }])).toContain('数量不能为0')
    expect(store.validateOrderItems([{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }])).toBeNull()
  })
})