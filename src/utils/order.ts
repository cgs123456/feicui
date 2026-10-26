import type { Order, OrderItem, Product } from '../types/models'
import { DEFAULT_MERCHANT_ID } from '../data/merchants'

export function getTotalQuantity(order: Pick<Order, 'items'>): number {
  return order.items.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0)
}

/** 商品ID -> 归属商户ID 索引（一次构建 O(products)，查询 O(1)，替代逐条 find） */
export function buildMerchantIndex(products: Product[]): Map<string, string> {
  const index = new Map<string, string>()
  for (const p of products) index.set(p.id, p.merchantId || DEFAULT_MERCHANT_ID)
  return index
}

/** 订单是否属于指定商户（配合 buildMerchantIndex 使用） */
export function orderBelongsToMerchant(
  order: Pick<Order, 'items'>,
  merchantId: string,
  index: Map<string, string>
): boolean {
  return order.items.some(item => index.get(item.productId) === merchantId)
}
