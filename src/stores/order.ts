import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, OrderItem, Address, OrderStatus } from '@/types'
import { useProductStore } from './product'
import { USE_MOCK } from '../utils/env'
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
  if (!USE_MOCK) return // server 模式下持久化在后端，内存仅是镜像
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch {
    // localStorage 写入失败时通知用户
    window.dispatchEvent(
      new CustomEvent('storage-error', {
        detail: { message: '本地存储写入失败，请检查浏览器设置' }
      })
    )
  }
}

let orderCounter = 0

function generateOrderNo(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ORD${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${String(now.getMilliseconds()).padStart(3, '0')}${rand}`
}

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>(loadOrders())
  const productStore = useProductStore()

  /** 异步下单进行中标记（当前为同步创建，返回前即复位；防重复提交主要依赖 idempotentKey） */
  const isCreatingOrder = ref(false)

  /** 幂等缓存：idempotentKey → 订单。仅内存生效；调用方在「一次购买意图」内保持键稳定（如进入确认页时生成的 uuid） */
  const idempotentOrders = new Map<string, Order>()

  function getOrdersByUser(userId: string): Order[] {
    return orders.value.filter((o: Order) => o.buyerId === userId)
  }

  const getAllOrders = computed(() => orders.value)

  /** server 模式：从后端拉取订单覆盖内存镜像（buyer=我的订单；merchant=本店订单） */
  async function syncFromServer(scope: 'buyer' | 'merchant' = 'buyer') {
    if (USE_MOCK) return
    if (scope === 'merchant') {
      orders.value = await fetchMerchantOrders()
    } else {
      const page = await fetchOrders({ page: 1, pageSize: 100 })
      orders.value = page.list
    }
  }

  /** 用后端返回的订单替换内存中的同 id 条目（状态迁移后保持镜像一致） */
  function replaceOrder(updated: Order) {
    const idx = orders.value.findIndex((o: Order) => o.id === updated.id)
    if (idx !== -1) orders.value[idx] = updated
    else orders.value.unshift(updated)
  }

  /** 下单前校验（含商品存在性、状态与库存） */
  function validateOrderItems(items: OrderItem[]): string | null {
    if (!items || items.length === 0) return '订单商品不能为空'
    for (const item of items) {
      if (item.price <= 0) return `商品「${item.title}」价格异常`
      if (item.quantity <= 0) return `商品「${item.title}」数量不能为0`
      const product = productStore.getProductById(item.productId)
      if (!product) return `商品「${item.title}」不存在或已删除`
      if (product.status !== 'active') return `商品「${item.title}」已下架或已售出`
      if (product.stock !== undefined && product.stock !== -1 && product.stock < item.quantity) {
        return `商品「${item.title}」库存不足（仅剩 ${product.stock} 件）`
      }
    }
    return null
  }

  function createOrder(params: {
    items: OrderItem[]
    totalPrice: number
    address: Address
    /** server 模式必传：后端按地址 id 落快照 */
    addressId?: string
    remark: string
    buyerId: string
    buyerName: string
    buyerPhone: string
    /** 客户端幂等键：同键重复提交返回首次创建的订单 */
    idempotentKey?: string
  }): Promise<Order | null> {
    // 防重复提交
    if (isCreatingOrder.value) return Promise.resolve(null)

    // 幂等检查放在校验之前：重复提交直接返回首单，不受库存变化影响（server 模式由后端幂等表兜底）
    if (params.idempotentKey) {
      const existing = idempotentOrders.get(params.idempotentKey)
      if (existing) return Promise.resolve(existing)
    }

    // 仅 mock 模式做本地镜像校验；server 模式镜像可能滞后于后端，
    // 交给后端权威判定（业务失败以 ApiError 抛出，页面 toast 展示具体原因）
    if (USE_MOCK) {
      const validationError = validateOrderItems(params.items)
      if (validationError) return Promise.resolve(null)
    }

    if (!USE_MOCK) {
      isCreatingOrder.value = true
      return createOrderApi({
        items: params.items.map((item: OrderItem) => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        addressId: params.addressId ?? params.address.id,
        remark: params.remark,
        idempotentKey: params.idempotentKey
      })
        .then(created => {
          orders.value.unshift(created)
          // 同步扣减本地商品镜像，下单后详情/列表立即反映新库存（server 模式 saveProducts 为 no-op）
          for (const item of params.items) {
            productStore.decreaseStock(item.productId, item.quantity, true)
          }
          if (params.idempotentKey) idempotentOrders.set(params.idempotentKey, created)
          return created
        })
        .finally(() => {
          isCreatingOrder.value = false
        })
    }

    isCreatingOrder.value = true
    return Promise.resolve()
      .then(() => {
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

        if (params.idempotentKey) {
          idempotentOrders.set(params.idempotentKey, order)
        }

        // 批量扣减库存（skipPersist 逐项跳过，最后统一落盘一次）
        for (const item of params.items) {
          productStore.decreaseStock(item.productId, item.quantity, true)
        }
        productStore.saveProducts()

        return order
      })
      .finally(() => {
        isCreatingOrder.value = false
      })
  }

  async function payOrder(orderId: string): Promise<boolean> {
    if (!USE_MOCK) {
      replaceOrder(await payOrderApi(orderId))
      return true
    }
    const order = orders.value.find((o: Order) => o.id === orderId)
    if (!order || order.status !== 'pending') return false
    order.status = 'paid'
    order.payTime = new Date().toISOString()
    saveOrders(orders.value)
    return true
  }

  /** 商家确认收款（B 端入口），状态迁移与买家支付一致 */
  function confirmPayment(orderId: string): Promise<boolean> {
    return payOrder(orderId)
  }

  async function shipOrder(
    orderId: string,
    logisticsNo?: string,
    logisticsCompany?: string
  ): Promise<boolean> {
    if (!USE_MOCK) {
      replaceOrder(await shipOrderApi(orderId, { logisticsNo, logisticsCompany }))
      return true
    }
    const order = orders.value.find((o: Order) => o.id === orderId)
    if (!order || order.status !== 'paid') return false
    order.status = 'shipped'
    order.shipTime = new Date().toISOString()
    order.logisticsNo = logisticsNo || `SF${Date.now()}`
    order.logisticsCompany = logisticsCompany || '顺丰速运'
    saveOrders(orders.value)
    return true
  }

  async function completeOrder(orderId: string): Promise<boolean> {
    if (!USE_MOCK) {
      replaceOrder(await completeOrderApi(orderId))
      return true
    }
    const order = orders.value.find((o: Order) => o.id === orderId)
    if (!order || order.status !== 'shipped') return false
    order.status = 'completed'
    order.completeTime = new Date().toISOString()
    saveOrders(orders.value)
    return true
  }

  const REFUNDABLE_STATUSES: OrderStatus[] = ['paid', 'shipped', 'completed']

  async function requestRefund(orderId: string, reason: string): Promise<boolean> {
    if (!USE_MOCK) {
      replaceOrder(await refundOrderApi(orderId, { action: 'apply', reason }))
      return true
    }
    const order = orders.value.find((o: Order) => o.id === orderId)
    if (!order || !REFUNDABLE_STATUSES.includes(order.status)) return false
    // 记录发起退款时的状态，拒绝退款时回退到原状态
    order.refundFromStatus = order.status
    order.status = 'refunding'
    order.refundReason = reason
    order.refundTime = new Date().toISOString()
    saveOrders(orders.value)
    return true
  }

  async function approveRefund(orderId: string): Promise<boolean> {
    if (!USE_MOCK) {
      replaceOrder(await refundOrderApi(orderId, { action: 'approve' }))
      return true
    }
    const order = orders.value.find((o: Order) => o.id === orderId)
    if (!order || order.status !== 'refunding') return false
    order.status = 'refunded'
    order.refundTime = new Date().toISOString()
    // 退款成交 → 回补库存（与 createOrder 的扣减对称）
    order.items.forEach((item: OrderItem) => {
      productStore.increaseStock(item.productId, item.quantity)
    })
    saveOrders(orders.value)
    return true
  }

  async function rejectRefund(orderId: string): Promise<boolean> {
    if (!USE_MOCK) {
      replaceOrder(await refundOrderApi(orderId, { action: 'reject' }))
      return true
    }
    const order = orders.value.find((o: Order) => o.id === orderId)
    if (!order || order.status !== 'refunding') return false
    order.status = order.refundFromStatus ?? 'shipped'
    order.refundFromStatus = undefined
    order.refundReason = undefined
    saveOrders(orders.value)
    return true
  }

  async function cancelOrder(orderId: string): Promise<boolean> {
    if (!USE_MOCK) {
      replaceOrder(await cancelOrderApi(orderId))
      return true
    }
    const order = orders.value.find((o: Order) => o.id === orderId)
    if (!order || order.status !== 'pending') return false
    order.status = 'cancelled'
    // 取消未支付订单 → 回补库存（createOrder 已扣减）
    order.items.forEach((item: OrderItem) => {
      productStore.increaseStock(item.productId, item.quantity)
    })
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
    replaceOrder,
    syncFromServer,
    clearOrders
  }
})
