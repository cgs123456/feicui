import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, OrderItem, Address, OrderStatus } from '@/types'

const STORAGE_KEY = 'jadeite_orders'

function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveOrders(orders: Order[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch { /* ignore */ }
}

function generateOrderNo(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `ORD${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>(loadOrders())

  const getOrdersByUser = computed(() => {
    return (userId: string) => orders.value.filter(o => o.buyerId === userId)
  })

  const getAllOrders = computed(() => orders.value)

  function createOrder(params: {
    items: OrderItem[]
    totalPrice: number
    address: Address
    remark: string
    buyerId: string
    buyerName: string
    buyerPhone: string
  }): Order {
    const order: Order = {
      id: `O${Date.now()}`,
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
    return order
  }

  function payOrder(orderId: string): boolean {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'pending') return false
    order.status = 'paid'
    order.payTime = new Date().toISOString()
    saveOrders(orders.value)
    return true
  }

  function shipOrder(orderId: string, logisticsNo?: string, logisticsCompany?: string): boolean {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'paid') return false
    order.status = 'shipped'
    order.shipTime = new Date().toISOString()
    order.logisticsNo = logisticsNo || `SF${Date.now()}`
    order.logisticsCompany = logisticsCompany || '顺丰速运'
    saveOrders(orders.value)
    return true
  }

  function completeOrder(orderId: string): boolean {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'shipped') return false
    order.status = 'completed'
    order.completeTime = new Date().toISOString()
    saveOrders(orders.value)
    return true
  }

  function requestRefund(orderId: string, reason: string): boolean {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || (order.status !== 'shipped' && order.status !== 'completed')) return false
    order.status = 'refunding'
    order.refundReason = reason
    order.refundTime = new Date().toISOString()
    saveOrders(orders.value)
    return true
  }

  function approveRefund(orderId: string): boolean {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'refunding') return false
    order.status = 'refunded'
    order.refundTime = new Date().toISOString()
    saveOrders(orders.value)
    return true
  }

  function rejectRefund(orderId: string, reason?: string): boolean {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'refunding') return false
    order.status = 'shipped'
    order.refundReason = undefined
    saveOrders(orders.value)
    return true
  }

  function confirmPayment(orderId: string): boolean {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'pending') return false
    order.status = 'paid'
    order.payTime = new Date().toISOString()
    saveOrders(orders.value)
    return true
  }

  function cancelOrder(orderId: string): boolean {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'pending') return false
    order.status = 'cancelled'
    saveOrders(orders.value)
    return true
  }

  function getOrderById(id: string): Order | undefined {
    return orders.value.find(o => o.id === id)
  }

  /** 商家端：按状态筛选 */
  function getOrdersByStatus(status: OrderStatus): Order[] {
    return orders.value.filter(o => o.status === status)
  }

  function clearOrders() {
    orders.value = []
    saveOrders([])
  }

  return {
    orders,
    getAllOrders,
    getOrdersByUser,
    getOrdersByStatus,
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