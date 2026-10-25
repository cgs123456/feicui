/**
 * 订单接口层：与 server/src/routes/orders.ts 契约一一对应。
 * 函数均不传 mockFn——仅在 USE_MOCK=false（server 模式）下由 store 调用。
 */
import type { Order, OrderStatus } from '@/types'
import type { PaginatedResponse } from './types'
import { http } from './http'

export type CreateOrderPayload = {
  items: { productId: string; quantity: number }[]
  addressId: string
  remark?: string
  idempotentKey?: string
}

export type RefundPayload = {
  action: 'apply' | 'approve' | 'reject'
  reason?: string
}

export type ShipPayload = {
  logisticsNo?: string
  logisticsCompany?: string
}

export async function fetchOrders(params?: {
  status?: OrderStatus
  page?: number
  pageSize?: number
}): Promise<PaginatedResponse<Order>> {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('pageSize', String(params.pageSize))
  const qs = query.toString()
  const res = await http.get<PaginatedResponse<Order>>(`/orders${qs ? `?${qs}` : ''}`)
  return res.data
}

export async function fetchMerchantOrders(): Promise<Order[]> {
  // 契约：GET /orders/merchant 与 GET /orders 同壳返回 PaginatedResponse<Order>，此处解出 list
  const res = await http.get<PaginatedResponse<Order>>('/orders/merchant')
  return res.data.list
}

export async function fetchOrderById(id: string): Promise<Order> {
  const res = await http.get<Order>(`/orders/${id}`, undefined, { showError: false })
  return res.data
}

export async function createOrderApi(payload: CreateOrderPayload): Promise<Order> {
  const res = await http.post<Order>('/orders', payload)
  return res.data
}

export async function payOrderApi(id: string): Promise<Order> {
  const res = await http.post<Order>(`/orders/${id}/pay`)
  return res.data
}

export async function shipOrderApi(id: string, payload: ShipPayload): Promise<Order> {
  const res = await http.post<Order>(`/orders/${id}/ship`, payload)
  return res.data
}

export async function completeOrderApi(id: string): Promise<Order> {
  const res = await http.post<Order>(`/orders/${id}/complete`)
  return res.data
}

export async function refundOrderApi(id: string, payload: RefundPayload): Promise<Order> {
  const res = await http.post<Order>(`/orders/${id}/refund`, payload)
  return res.data
}

export async function cancelOrderApi(id: string): Promise<Order> {
  const res = await http.post<Order>(`/orders/${id}/cancel`)
  return res.data
}
