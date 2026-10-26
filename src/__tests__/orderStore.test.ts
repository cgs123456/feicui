import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOrderStore } from '../stores/order'
import { useProductStore } from '../stores/product'
import type { Address, Order, OrderItem, Product } from '../types'

vi.mock('../api/order', () => ({
  fetchOrders: vi.fn(),
  fetchMerchantOrders: vi.fn(),
  createOrderApi: vi.fn(),
  payOrderApi: vi.fn(),
  shipOrderApi: vi.fn(),
  completeOrderApi: vi.fn(),
  refundOrderApi: vi.fn(),
  cancelOrderApi: vi.fn()
}))

import {
  fetchOrders,
  fetchMerchantOrders,
  createOrderApi,
  payOrderApi,
  shipOrderApi,
  completeOrderApi,
  refundOrderApi,
  cancelOrderApi
} from '../api/order'

const mockedFetchOrders = vi.mocked(fetchOrders)
const mockedFetchMerchant = vi.mocked(fetchMerchantOrders)
const mockedCreate = vi.mocked(createOrderApi)
const mockedPay = vi.mocked(payOrderApi)
const mockedShip = vi.mocked(shipOrderApi)
const mockedComplete = vi.mocked(completeOrderApi)
const mockedRefund = vi.mocked(refundOrderApi)
const mockedCancel = vi.mocked(cancelOrderApi)

function makeProduct(over: Partial<Product> = {}): Product {
  return {
    id: 'P001',
    title: '测试商品',
    price: 100,
    cover: '',
    images: [],
    status: 'active',
    stock: 10,
    createTime: '2026-01-01T00:00:00.000Z',
    ...over
  } as Product
}

function makeOrder(over: Partial<Order> = {}): Order {
  return {
    id: 'O1',
    orderNo: 'ORD20260101000000000XXXX',
    items: [{ productId: 'P001', title: '测试商品', cover: '', price: 100, quantity: 2 }],
    totalPrice: 200,
    status: 'pending',
    address: { id: 'ADDR001' } as Address,
    remark: '',
    createTime: '2026-01-01T00:00:00.000Z',
    buyerId: 'U1',
    buyerName: '买家',
    buyerPhone: '13800000000',
    ...over
  } as Order
}

function makeParams(over: Record<string, unknown> = {}) {
  return {
    items: [
      { productId: 'P001', title: '测试商品', cover: '', price: 100, quantity: 2 }
    ] as OrderItem[],
    address: { id: 'ADDR001' } as Address,
    remark: '尽快发货',
    idempotentKey: 'key-1',
    ...over
  }
}

describe('orderStore（server 模式：后端为唯一数据源）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('createOrder 调后端创建订单、前置插入镜像并同步扣减商品库存', async () => {
    const orderStore = useOrderStore()
    const productStore = useProductStore()
    productStore.products = [makeProduct({ stock: 10 })]
    const created = makeOrder()
    mockedCreate.mockResolvedValue(created)

    const order = await orderStore.createOrder(makeParams())

    expect(mockedCreate).toHaveBeenCalledWith({
      items: [{ productId: 'P001', quantity: 2 }],
      addressId: 'ADDR001',
      remark: '尽快发货',
      idempotentKey: 'key-1'
    })
    expect(order?.id).toBe('O1')
    expect(orderStore.orders[0].id).toBe('O1')
    expect(productStore.getProductById('P001')?.stock).toBe(8)
  })

  it('createOrder 未传 addressId 时回退 address.id', async () => {
    const orderStore = useOrderStore()
    mockedCreate.mockResolvedValue(makeOrder())

    await orderStore.createOrder(makeParams({ idempotentKey: undefined }))

    expect(mockedCreate.mock.calls[0][0].addressId).toBe('ADDR001')
  })

  it('同 idempotentKey 重复提交直接返回首单，不再调后端', async () => {
    const orderStore = useOrderStore()
    mockedCreate.mockResolvedValue(makeOrder())

    const first = await orderStore.createOrder(makeParams())
    const second = await orderStore.createOrder(makeParams())

    expect(mockedCreate).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })

  it('payOrder/shipOrder/completeOrder 用后端返回值替换镜像', async () => {
    const orderStore = useOrderStore()
    orderStore.orders = [makeOrder()]

    mockedPay.mockResolvedValue(makeOrder({ status: 'paid' }))
    await orderStore.payOrder('O1')
    expect(orderStore.getOrderById('O1')?.status).toBe('paid')

    mockedShip.mockResolvedValue(makeOrder({ status: 'shipped', logisticsNo: 'SF001' }))
    await orderStore.shipOrder('O1', 'SF001', '顺丰速运')
    const shipped = orderStore.getOrderById('O1')
    expect(shipped?.status).toBe('shipped')
    expect(shipped?.logisticsNo).toBe('SF001')

    mockedComplete.mockResolvedValue(makeOrder({ status: 'completed' }))
    await orderStore.completeOrder('O1')
    expect(orderStore.getOrderById('O1')?.status).toBe('completed')
  })

  it('confirmPayment 与 payOrder 走同一后端迁移', async () => {
    const orderStore = useOrderStore()
    orderStore.orders = [makeOrder()]
    mockedPay.mockResolvedValue(makeOrder({ status: 'paid' }))

    await orderStore.confirmPayment('O1')

    expect(mockedPay).toHaveBeenCalledWith('O1')
    expect(orderStore.getOrderById('O1')?.status).toBe('paid')
  })

  it('refund 三动作分别携带 apply/approve/reject 载荷', async () => {
    const orderStore = useOrderStore()
    orderStore.orders = [makeOrder({ status: 'paid' })]

    mockedRefund.mockResolvedValue(makeOrder({ status: 'refunding' }))
    await orderStore.requestRefund('O1', '不想要了')
    expect(mockedRefund).toHaveBeenCalledWith('O1', { action: 'apply', reason: '不想要了' })
    expect(orderStore.getOrderById('O1')?.status).toBe('refunding')

    mockedRefund.mockResolvedValue(makeOrder({ status: 'refunded' }))
    await orderStore.approveRefund('O1')
    expect(mockedRefund).toHaveBeenLastCalledWith('O1', { action: 'approve' })
    expect(orderStore.getOrderById('O1')?.status).toBe('refunded')

    mockedRefund.mockResolvedValue(makeOrder({ status: 'paid' }))
    await orderStore.rejectRefund('O1')
    expect(mockedRefund).toHaveBeenLastCalledWith('O1', { action: 'reject' })
    expect(orderStore.getOrderById('O1')?.status).toBe('paid')
  })

  it('cancelOrder 调后端取消并替换镜像', async () => {
    const orderStore = useOrderStore()
    orderStore.orders = [makeOrder({ status: 'pending' })]
    mockedCancel.mockResolvedValue(makeOrder({ status: 'cancelled' }))

    await orderStore.cancelOrder('O1')

    expect(mockedCancel).toHaveBeenCalledWith('O1')
    expect(orderStore.getOrderById('O1')?.status).toBe('cancelled')
  })

  it('syncFromServer buyer 拉分页 list，merchant 拉本店订单', async () => {
    const orderStore = useOrderStore()

    mockedFetchOrders.mockResolvedValue({ list: [makeOrder()], total: 1, page: 1, pageSize: 100 })
    await orderStore.syncFromServer('buyer')
    expect(orderStore.orders[0].id).toBe('O1')

    mockedFetchMerchant.mockResolvedValue([makeOrder({ id: 'O2' })])
    await orderStore.syncFromServer('merchant')
    expect(orderStore.orders.map((o: Order) => o.id)).toEqual(['O2'])
  })
})
