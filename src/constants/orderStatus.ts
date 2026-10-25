import type { OrderStatus } from '../types/models'

export type StatusTagType = 'warning' | 'primary' | 'success' | 'default' | 'danger'

export interface StatusTag {
  text: string
  type: StatusTagType
}

/** C 端买家视角（收货视角：paid=待发货、shipped=待收货） */
export const BUYER_STATUS_TAG: Record<OrderStatus, StatusTag> = {
  pending: { text: '待付款', type: 'warning' },
  paid: { text: '待发货', type: 'primary' },
  shipped: { text: '待收货', type: 'success' },
  completed: { text: '已完成', type: 'default' },
  refunding: { text: '退款中', type: 'danger' },
  refunded: { text: '已退款', type: 'default' },
  cancelled: { text: '已取消', type: 'default' }
}

/** B 端商家视角（发货视角：paid=待发货、shipped=已发货） */
export const MERCHANT_STATUS_TAG: Record<OrderStatus, StatusTag> = {
  pending: { text: '待付款', type: 'default' },
  paid: { text: '待发货', type: 'primary' },
  shipped: { text: '已发货', type: 'warning' },
  completed: { text: '已完成', type: 'success' },
  cancelled: { text: '已取消', type: 'default' },
  refunding: { text: '退款中', type: 'danger' },
  refunded: { text: '已退款', type: 'default' }
}

/** 订单状态文案+标签色统一出口；未知状态兜底原样显示 */
export function getStatusTag(
  status: OrderStatus,
  perspective: 'buyer' | 'merchant' = 'buyer'
): StatusTag {
  const map = perspective === 'merchant' ? MERCHANT_STATUS_TAG : BUYER_STATUS_TAG
  return map[status] ?? { text: String(status), type: 'default' }
}
