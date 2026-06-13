import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, OrderItem, Address, OrderStatus } from '@/types'
import { useProductStore } from './product'

const STORAGE_KEY = 'jadeite_orders'

function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch {
    // localStorage 写入失败时通知用户
    window.dispatchEvent(new CustomEvent('storage-error', {
      detail: { message: '本地存储写入失败，请检查浏览器设置' }
    }))
  }
}

let orderCounter = 0

function generateOrderNo(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `ORD${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>(loadOrders())

  /** 防止重复提交 */
  const isCreatingOrder = ref(false)

  /** 幂等Key缓存：避免短时间内重复创建相同订单 */
  const lastIdempotentKey = ref<string | null>(null)
  const lastIdempotentOrder = ref<Order | null>(null)

  /**
   * 生成幂等Key：基于 商品ID排序+用户ID+10秒级时间戳
   * 同一用户、同一组商品、10秒内，只允许创建一次订单
   */
  function generateIdempotentKey(items: OrderItem[], buyerId: string): string {
    const sortedIds = items.map(i => i.productId).sort().join(',')
    const now = new Date()
    const tenSecondSlot = Math.floor(now.getSeconds() / 10)
    const timeKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-${tenSecondSlot}`
    return `${buyerId}:${sortedIds}:${timeKey}`
  }

  function getOrdersByUser(userId: string): Order[] {
    return orders.value.filter((o: Order) => o.buyerId === userId)
  }

  const getAllOrders = computed(() => orders.value)

  /** 下单前校验 */
  function validateOrderItems(items: OrderItem[]): string | null {
    if (!items || items.length === 0) return '订单商品不能为空'
    for (const item of items) {
      if (item.price <= 0) return `商品「${item.title}」价格异常`
      if (item.quantity <= 0) return `商品「${item.title}」数量不能为0`
    }
    return null
  }

  function createOrder(params: {
    items: OrderItem[]
    totalPrice: number
    address: Address
    remark: string
    buyerId: string
    buyerName: string
    buyerPhone: string
  }): Order | null {
    // 防重复提交
    if (isCreatingOrder.value) return null

    // 校验
    const validationError = validateOrderItems(params.items)
    if (validationError) return null

    // 幂等性检查：同一用户+同一组商品+同一分钟内，返回上次订单
    const idempotentKey = generateIdempotentKey(params.items, params.buyerId)
    if (lastIdempotentKey.value === idempotentKey && lastIdempotentOrder.value) {
      return lastIdempotentOrder.value
    }

    isCreatingOrder.value = true
    try {
      const order: Order = {
        id: `O${Date.now()}_${++orderCounter}`,
        orderNo: generateOrderNo(),
        items: params.items,
        totalPrice: params.totalPrice,
        status: 'pending',
        address: params.address,
        remark: params.remark,
        createTime: new Date().toISOString(),
        buyerId: params.buyerId,
        buyerName: params.buyerName,
        buyerPhone: params.buyerPhone
      }
      orders.value.unshift(order)
      saveOrders(orders.value)

      // 缓存幂等Key和订单
      lastIdempotentKey.value = idempotentKey
      lastIdempotentOrder.value = order

      return order
    } finally {
      isCreatingOrder.value = false
    }
  }

  function payOrder(orderId: string): boolean {
    const order = orders.value.find((o: Order) => o.id === orderId)
    if (!order || order.status !== 'pending') return false
    order.status = 'paid'
    order.payTime = new Date().toISOString()
    saveOrders(orders.value)
    return true
  }

  function confirmPayment(orderId: string): boolean {
    const order = orders.value.find((o: Order) => o.id === orderId)
    if (!order || order.status !== 'pending') return false
    order.status = 'paid'
    order.payTime = new Date().toISOString()
    saveOrders(orders.value)
    return true
  }

  function shipOrder(orderId: string, logisticsNo?: string, logisticsCompany?: string): boolean {
    const order = orders.value.find((o: Order) => o.id === orderId)
    if (!order || order.status !== 'paid') return false
    order.status = 'shipped'
    order.shipTime = new Date().toISOString()
    order.logisticsNo = logisticsNo || `SF${Date.now()}`
    order.logisticsCompany = logisticsCompany || '顺丰速运'
    saveOrders(orders.value)
    return true
  }

  function completeOrder(orderId: string): boolean {
    const order = orders.value.find((o: Order) => o.id === orderId)
    if (!order || order.status !== 'shipped') return false
    order.status = 'completed'
    order.completeTime = new Date().toISOString()
    saveOrders(orders.value)
    return true
  }

  function requestRefund(orderId: string, reason: string): boolean {
    const order = orders.value.find((o: Order) => o.id === orderId)
    if (!order || (order.status !== 'shipped' && order.status !== 'completed')) return false
    order.status = 'refunding'
    order.refundReason = reason
    order.refundTime = new Date().toISOString()
    saveOrders(orders.value)
    return true
  }

  function approveRefund(orderId: string): boolean {
    const order = orders.value.find((o: Order) => o.id === orderId)
    if (!order || order.status !== 'refunding') return false
    order.status = 'refunded'
    order.refundTime = new Date().toISOString()
    saveOrders(orders.value)
    return true
  }

  function rejectRefund(orderId: string): boolean {
    const order = orders.value.find((o: Order) => o.id === orderId)
    if (!order || order.status !== 'refunding') return false
    order.status = 'shipped'
    order.refundReason = undefined
    saveOrders(orders.value)
    return true
  }

  function cancelOrder(orderId: string): boolean {
    const order = orders.value.find((o: Order) => o.id === orderId)
    if (!order || order.status !== 'pending') return false
    order.status = 'cancelled'
    saveOrders(orders.value)
    return true
  }

  function getOrderById(id: string): Order | undefined {
    return orders.value.find((o: Order) => o.id === id)
  }

  function getOrdersByStatus(status: OrderStatus): Order[] {
    return orders.value.filter((o: Order) => o.status === status)
  }

  function clearOrders() {
    orders.value = []
    saveOrders([])
  }

  return {
    orders,
    isCreatingOrder,
    getAllOrders,
    getOrdersByUser,
    getOrdersByStatus,
    validateOrderItems,
    createOrder,
    payOrder,
    confirmPayment,
    shipOrder,
    completeOrder,
    requestRefund,
    approveRefund,
    rejectRefund,
    cancelOrder,
    getOrderById,
    clearOrders
  }
})
