import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOrderStore } from '../stores/order'
import { useProductStore } from '../stores/product'

const mockAddress = {
  id: 'ADDR001',
  name: '张三',
  phone: '13800001111',
  province: '北京',
  city: '北京',
  district: '朝阳区',
  detail: '建国路88号',
  fullAddress: '北京市朝阳区建国路88号',
  isDefault: true
}

describe('orderStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('初始订单列表为空', async () => {
    const store = useOrderStore()
    expect(store.orders.length).toBe(0)
  })

  it('createOrder 创建订单', async () => {
    const store = useOrderStore()
    const order = await store.createOrder({
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

  it('createOrder 空商品返回 null', async () => {
    const store = useOrderStore()
    const order = await store.createOrder({
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

  it('createOrder 价格异常返回 null', async () => {
    const store = useOrderStore()
    const order = await store.createOrder({
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

  it('订单状态完整流转：pending → paid → shipped → completed', async () => {
    const store = useOrderStore()
    const order = await store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id

    expect(await store.payOrder(id)).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('paid')

    expect(await store.shipOrder(id)).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('shipped')
    expect(store.getOrderById(id)!.logisticsNo).toBeDefined()

    expect(await store.completeOrder(id)).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('completed')
  })

  it('重复支付返回 false', async () => {
    const store = useOrderStore()
    const order = await store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id
    expect(await store.payOrder(id)).toBe(true)
    expect(await store.payOrder(id)).toBe(false) // 重复支付
  })

  it('重复发货返回 false', async () => {
    const store = useOrderStore()
    const order = await store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id
    await store.payOrder(id)
    expect(await store.shipOrder(id)).toBe(true)
    expect(await store.shipOrder(id)).toBe(false) // 重复发货
  })

  it('退款流程：shipped → refunding → refunded', async () => {
    const store = useOrderStore()
    const order = await store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id
    await store.payOrder(id)
    await store.shipOrder(id)

    expect(await store.requestRefund(id, '不想要了')).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('refunding')

    expect(await store.approveRefund(id)).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('refunded')
  })

  it('拒绝退款：refunding → shipped', async () => {
    const store = useOrderStore()
    const order = await store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id
    await store.payOrder(id)
    await store.shipOrder(id)
    await store.requestRefund(id, '不想要了')

    expect(await store.rejectRefund(id)).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('shipped')
  })

  it('取消订单：pending → cancelled', async () => {
    const store = useOrderStore()
    const order = await store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id
    expect(await store.cancelOrder(id)).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('cancelled')
  })

  it('已支付订单不能取消', async () => {
    const store = useOrderStore()
    const order = await store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id
    await store.payOrder(id)
    expect(await store.cancelOrder(id)).toBe(false)
  })

  it('商家确认付款：pending → paid', async () => {
    const store = useOrderStore()
    const order = await store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '测试用户',
      buyerPhone: '13800001111'
    })
    const id = order!.id
    expect(await store.confirmPayment(id)).toBe(true)
    expect(store.getOrderById(id)!.status).toBe('paid')
  })

  it('getOrdersByStatus 按状态筛选', async () => {
    const store = useOrderStore()
    await store.createOrder({
      items: [{ productId: 'P001', title: 'A', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '用户',
      buyerPhone: '13800001111'
    })
    await store.createOrder({
      items: [{ productId: 'P002', title: 'B', cover: '', price: 200, quantity: 1 }],
      totalPrice: 200,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '用户',
      buyerPhone: '13800001111'
    })
    expect(store.getOrdersByStatus('pending').length).toBe(2)
    expect(store.getOrdersByStatus('paid').length).toBe(0)
  })

  it('validateOrderItems 校验', async () => {
    const store = useOrderStore()
    expect(store.validateOrderItems([])).toBe('订单商品不能为空')
    expect(
      store.validateOrderItems([
        { productId: 'P001', title: '测试', cover: '', price: 0, quantity: 1 }
      ])
    ).toContain('价格异常')
    expect(
      store.validateOrderItems([
        { productId: 'P001', title: '测试', cover: '', price: 100, quantity: 0 }
      ])
    ).toContain('数量不能为0')
    expect(
      store.validateOrderItems([
        { productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }
      ])
    ).toBeNull()
  })

  it('幂等性：相同 idempotentKey 重复提交返回首次订单', async () => {
    const store = useOrderStore()
    const params = {
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '用户',
      buyerPhone: '13800001111'
    }
    const order1 = await store.createOrder({ ...params, idempotentKey: 'test-key-1' })
    const order2 = await store.createOrder({ ...params, idempotentKey: 'test-key-1' })
    // 第二次应返回同一个订单
    expect(order2!.id).toBe(order1!.id)
    // 订单列表中只有一个
    expect(store.orders.length).toBe(1)
  })

  it('幂等性：不同 idempotentKey 创建独立订单', async () => {
    const store = useOrderStore()
    const order1 = await store.createOrder({
      items: [{ productId: 'P001', title: 'A', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '用户',
      buyerPhone: '13800001111',
      idempotentKey: 'test-key-1'
    })
    const order2 = await store.createOrder({
      items: [{ productId: 'P002', title: 'B', cover: '', price: 200, quantity: 1 }],
      totalPrice: 200,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '用户',
      buyerPhone: '13800001111',
      idempotentKey: 'test-key-2'
    })
    expect(order2!.id).not.toBe(order1!.id)
    expect(store.orders.length).toBe(2)
  })

  it('幂等性：不同用户相同商品不同键 → 独立订单', async () => {
    const store = useOrderStore()
    const order1 = await store.createOrder({
      items: [{ productId: 'P002', title: 'A', cover: '', price: 200, quantity: 1 }],
      totalPrice: 200,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '用户1',
      buyerPhone: '13800001111',
      idempotentKey: 'test-key-1'
    })
    const order2 = await store.createOrder({
      items: [{ productId: 'P002', title: 'A', cover: '', price: 200, quantity: 1 }],
      totalPrice: 200,
      address: mockAddress,
      remark: '',
      buyerId: 'U002',
      buyerName: '用户2',
      buyerPhone: '13800002222',
      idempotentKey: 'test-key-2'
    })
    expect(order2!.id).not.toBe(order1!.id)
    expect(store.orders.length).toBe(2)
  })

  it('无 idempotentKey 时重复提交创建独立订单', async () => {
    const store = useOrderStore()
    const params = {
      items: [{ productId: 'P002', title: 'A', cover: '', price: 200, quantity: 1 }],
      totalPrice: 200,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '用户',
      buyerPhone: '13800001111'
    }
    const order1 = await store.createOrder({ ...params })
    const order2 = await store.createOrder({ ...params })
    expect(order1).not.toBeNull()
    expect(order2).not.toBeNull()
    expect(order2!.id).not.toBe(order1!.id)
    expect(store.orders.length).toBe(2)
  })

  it('已售商品（sold/stock 0）创建订单返回 null', async () => {
    const store = useOrderStore()
    const order = await store.createOrder({
      items: [{ productId: 'P010', title: '已售商品', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '用户',
      buyerPhone: '13800001111'
    })
    expect(order).toBeNull()
    expect(store.orders.length).toBe(0)
  })

  it('下单成功后扣减库存', async () => {
    const orderStore = useOrderStore()
    const productStore = useProductStore()
    const before = productStore.getProductById('P001')!.stock
    const order = await orderStore.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '用户',
      buyerPhone: '13800000000'
    })
    expect(productStore.getProductById('P001')!.stock).toBe((before as number) - 1)
    // 取消未支付订单 → 库存回补
    await orderStore.cancelOrder(order!.id)
    expect(productStore.getProductById('P001')!.stock).toBe(before as number)
  })

  it('退款成交后回补库存', async () => {
    const orderStore = useOrderStore()
    const productStore = useProductStore()
    // P006 是有限库存商品（stock:1），回补才有可断言的变化
    const before = productStore.getProductById('P006')!.stock
    const order = await orderStore.createOrder({
      items: [{ productId: 'P006', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '用户',
      buyerPhone: '13800000000'
    })
    await orderStore.payOrder(order!.id)
    await orderStore.shipOrder(order!.id)
    await orderStore.requestRefund(order!.id, '不想要了')
    await orderStore.approveRefund(order!.id)
    expect(orderStore.getOrderById(order!.id)!.status).toBe('refunded')
    expect(productStore.getProductById('P006')!.stock).toBe(before as number)
  })

  it('拒绝退款不回补库存（订单继续履行）', async () => {
    const orderStore = useOrderStore()
    const productStore = useProductStore()
    const before = productStore.getProductById('P006')!.stock
    const order = await orderStore.createOrder({
      items: [{ productId: 'P006', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '用户',
      buyerPhone: '13800000000'
    })
    await orderStore.payOrder(order!.id)
    await orderStore.shipOrder(order!.id)
    await orderStore.requestRefund(order!.id, '协商不一致')
    await orderStore.rejectRefund(order!.id)
    expect(orderStore.getOrderById(order!.id)!.status).toBe('shipped')
    expect(productStore.getProductById('P006')!.stock).toBe((before as number) - 1)
  })

  it('isCreatingOrder=true 时 createOrder 直接返回 null', async () => {
    const store = useOrderStore()
    // 手动设置创建中状态
    store.isCreatingOrder = true
    const result = await store.createOrder({
      items: [{ productId: 'P001', title: '测试', cover: '', price: 100, quantity: 1 }],
      totalPrice: 100,
      address: mockAddress,
      remark: '',
      buyerId: 'U001',
      buyerName: '用户',
      buyerPhone: '13800001111'
    })
    expect(result).toBeNull()
    expect(store.orders.length).toBe(0)
  })
})
