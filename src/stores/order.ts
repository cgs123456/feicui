import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, OrderItem, Address, OrderStatus } from '@/types'
import { useProductStore } from './product'
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

export const useOrderStore = defineStore('order', () => {
  // 后端是唯一数据源：内存列表仅是镜像，进入页面时通过 syncFromServer 拉取
  const orders = ref<Order[]>([])
  const productStore = useProductStore()

  /** 异步下单进行中标记（防重复提交主要依赖 idempotentKey） */
  const isCreatingOrder = ref(false)

  /** 幂等缓存：idempotentKey → 订单。仅内存生效；调用方在「一次购买意图」内保持键稳定（如进入确认页时生成的 uuid） */
  const idempotentOrders = new Map<string, Order>()

  function getOrdersByUser(userId: string): Order[] {
    return orders.value.filter((o: Order) => o.buyerId === userId)
  }

  const getAllOrders = computed(() => orders.value)

  /** 从后端拉取订单覆盖内存镜像（buyer=我的订单；merchant=本店订单） */
  async function syncFromServer(scope: 'buyer' | 'merchant' = 'buyer') {
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

  function createOrder(params: {
    items: OrderItem[]
    address: Address
    /** 后端按地址 id 落快照 */
    addressId?: string
    remark: string
    /** 客户端幂等键：同键重复提交返回首次创建的订单 */
    idempotentKey?: string
  }): Promise<Order | null> {
    // 防重复提交
    if (isCreatingOrder.value) return Promise.resolve(null)

    // 幂等检查放在最前：重复提交直接返回首单，不受库存变化影响（后端幂等表 UNIQUE(buyer_id,idempotent_key) 兜底）
    if (params.idempotentKey) {
      const existing = idempotentOrders.get(params.idempotentKey)
      if (existing) return Promise.resolve(existing)
    }

    // 商品存在性/状态/库存由后端权威判定（业务失败以 ApiError 抛出，页面 toast 展示具体原因）
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
        // 同步扣减本地商品镜像，下单后详情/列表立即反映新库存
        for (const item of params.items) {
          productStore.decreaseStock(item.productId, item.quantity)
        }
        if (params.idempotentKey) idempotentOrders.set(params.idempotentKey, created)
        return created
      })
      .finally(() => {
        isCreatingOrder.value = false
      })
  }

  async function payOrder(orderId: string): Promise<boolean> {
    replaceOrder(await payOrderApi(orderId))
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
    replaceOrder(await shipOrderApi(orderId, { logisticsNo, logisticsCompany }))
    return true
  }

  async function completeOrder(orderId: string): Promise<boolean> {
    replaceOrder(await completeOrderApi(orderId))
    return true
  }

  const REFUNDABLE_STATUSES: OrderStatus[] = ['paid', 'shipped', 'completed']

  async function requestRefund(orderId: string, reason: string): Promise<boolean> {
    replaceOrder(await refundOrderApi(orderId, { action: 'apply', reason }))
    return true
  }

  async function approveRefund(orderId: string): Promise<boolean> {
    // 后端批准退款时已回补库存，这里仅同步订单镜像
    replaceOrder(await refundOrderApi(orderId, { action: 'approve' }))
    return true
  }

  async function rejectRefund(orderId: string): Promise<boolean> {
    replaceOrder(await refundOrderApi(orderId, { action: 'reject' }))
    return true
  }

  async function cancelOrder(orderId: string): Promise<boolean> {
    // 后端取消时已回补库存，这里仅同步订单镜像
    replaceOrder(await cancelOrderApi(orderId))
    return true
  }

  function getOrderById(id: string): Order | undefined {
    return orders.value.find((o: Order) => o.id === id)
  }

  function getOrdersByStatus(status: OrderStatus): Order[] {
    return orders.value.filter((o: Order) => o.status === status)
  }

  return {
    orders,
    isCreatingOrder,
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
    replaceOrder,
    syncFromServer
  }
})
