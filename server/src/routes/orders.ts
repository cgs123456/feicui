import { Router } from 'express'
import { db, now, rowToOrder, rowToAddress, type Order } from '../db.js'
import { CODE, ApiError, type OrderStatus, type Address, type OrderItem } from '../types.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'

export const ordersRouter = Router()

/** 状态机：镜像前端 store 语义（src/stores/order.ts） */
const TRANSITIONS: Record<string, { from: OrderStatus[]; to?: OrderStatus }> = {
  pay: { from: ['pending'], to: 'paid' },
  ship: { from: ['paid'], to: 'shipped' },
  complete: { from: ['shipped'], to: 'completed' }
}

export function findOrderOrThrow(id: string): Order {
  const row = db.prepare('SELECT * FROM orders WHERE id = ? OR order_no = ?').get(id, id) as
    | Record<string, unknown>
    | undefined
  if (!row) throw new ApiError(CODE.NOT_FOUND, '订单不存在')
  return rowToOrder(row)
}

function assertVisible(order: Order, userId: string, role: string): void {
  if (order.buyerId === userId) return
  if (role === 'owner' && merchantIdsOfOrder(order).includes(userId)) return
  throw new ApiError(CODE.FORBIDDEN, '无权查看该订单')
}

export function merchantIdsOfOrder(order: Order): string[] {
  const items = (order.items ?? []) as { productId: string }[]
  const ids = new Set<string>()
  const q = db.prepare('SELECT merchant_id FROM products WHERE id = ?')
  for (const item of items) {
    const row = q.get(item.productId) as { merchant_id: string } | undefined
    if (row) ids.add(row.merchant_id)
  }
  return [...ids]
}

ordersRouter.use(requireAuth)

ordersRouter.get('/', (req, res) => {
  const user = (req as AuthedRequest).user!
  const status = typeof req.query.status === 'string' ? req.query.status : ''
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20))

  const where = status ? 'WHERE buyer_id = ? AND status = ?' : 'WHERE buyer_id = ?'
  const args = status ? [user.id, status] : [user.id]
  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM orders ${where}`).get(...args) as { c: number }
  ).c
  const rows = db
    .prepare(`SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...args, pageSize, (page - 1) * pageSize) as Record<string, unknown>[]
  res.json({
    code: CODE.OK,
    data: { list: rows.map(rowToOrder), total, page, pageSize },
    message: 'ok'
  })
})

/** 本店售出订单（B 端）：join items[].productId → products.merchant_id 过滤 */
ordersRouter.get('/merchant', (req, res) => {
  const user = (req as AuthedRequest).user!
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as Record<
    string,
    unknown
  >[]
  const list = rows.map(rowToOrder).filter(o => merchantIdsOfOrder(o).includes(user.id))
  res.json({
    code: CODE.OK,
    data: { list, total: list.length, page: 1, pageSize: list.length },
    message: 'ok'
  })
})

ordersRouter.get('/:id', (req, res) => {
  const user = (req as AuthedRequest).user!
  const order = findOrderOrThrow(String(req.params.id))
  assertVisible(order, user.id, user.role)
  res.json({ code: CODE.OK, data: order, message: 'ok' })
})

ordersRouter.post('/', (req, res) => {
  const user = (req as AuthedRequest).user!
  const b = req.body ?? {}
  const items: { productId: string; quantity: number }[] = Array.isArray(b.items) ? b.items : []
  if (items.length === 0) throw new ApiError(CODE.BAD_PARAM, '订单商品不能为空')
  const idempotentKey =
    typeof b.idempotentKey === 'string' && b.idempotentKey ? b.idempotentKey : null

  if (idempotentKey) {
    const hit = db
      .prepare('SELECT * FROM orders WHERE buyer_id = ? AND idempotent_key = ?')
      .get(user.id, idempotentKey) as Record<string, unknown> | undefined
    if (hit) {
      res.json({ code: CODE.OK, data: rowToOrder(hit), message: 'ok' })
      return
    }
  }

  const addressRow = db
    .prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
    .get(String(b.addressId ?? ''), user.id) as Record<string, unknown> | undefined
  if (!addressRow) throw new ApiError(CODE.BAD_PARAM, '收货地址不存在')
  const address: Address = rowToAddress(addressRow)

  const order = db.transaction((): Order => {
    const orderItems: OrderItem[] = []
    let total = 0
    const decrease = db.prepare(
      'UPDATE products SET stock = stock - ?, status = CASE WHEN stock IS NOT NULL AND stock != -1 AND stock - ? <= 0 THEN ? ELSE status END WHERE id = ? AND status = ? AND (stock IS NULL OR stock = -1 OR stock >= ?)'
    )
    const select = db.prepare('SELECT * FROM products WHERE id = ?')

    for (const item of items) {
      const qty = Math.floor(Number(item.quantity))
      if (!Number.isFinite(qty) || qty <= 0)
        throw new ApiError(CODE.BAD_PARAM, '商品数量必须为正整数')
      const row = select.get(String(item.productId)) as Record<string, unknown> | undefined
      if (!row) throw new ApiError(CODE.BAD_PARAM, `商品 ${item.productId} 不存在或已删除`)
      if (row.status !== 'active')
        throw new ApiError(CODE.BUSINESS_CONFLICT, `商品「${row.title}」已下架或已售出`)
      const info = decrease.run(qty, qty, 'sold', row.id, 'active', qty)
      if (info.changes === 0) {
        const stockLeft = (row.stock as number) ?? -1
        throw new ApiError(
          CODE.BUSINESS_CONFLICT,
          `商品「${row.title}」库存不足${stockLeft >= 0 ? `（仅剩 ${stockLeft} 件）` : ''}`
        )
      }
      orderItems.push({
        productId: row.id as string,
        title: row.title as string,
        cover: (row.cover as string) || '',
        price: row.price as number,
        quantity: qty
      })
      total += (row.price as number) * qty
    }

    const id = `O${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 10000)}`
    const orderNo = `ORD${orderNoTimestamp()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
    db.prepare(
      `INSERT INTO orders
        (id, order_no, buyer_id, buyer_name, buyer_phone, status, total_price, address, remark, items, idempotent_key, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      orderNo,
      user.id,
      user.nickname ?? '',
      user.phone,
      total,
      JSON.stringify(address),
      String(b.remark ?? ''),
      JSON.stringify(orderItems),
      idempotentKey,
      now(),
      now()
    )
    return rowToOrder(
      db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>
    )
  })()

  res.json({ code: CODE.OK, data: order, message: 'ok' })
})

function orderNoTimestamp(): string {
  const d = new Date()
  const pad = (n: number, w = 2): string => String(n).padStart(w, '0')
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}${pad(d.getMilliseconds(), 3)}`
  )
}

/** 统一状态迁移端点：POST /:id/pay | /:id/ship | /:id/complete */
for (const [action, rule] of Object.entries(TRANSITIONS)) {
  ordersRouter.post(`/:id/${action}`, (req, res) => {
    const user = (req as AuthedRequest).user!
    const order = findOrderOrThrow(String(req.params.id))
    assertVisible(order, user.id, user.role)
    // 角色语义：发货仅商家；付款/确认收货镜像前端入口（买家支付与确认收货 + B 端确认收款），交易双方均可
    if (action === 'ship') {
      if (user.role !== 'owner' || !merchantIdsOfOrder(order).includes(user.id)) {
        throw new ApiError(CODE.FORBIDDEN, '仅商家可执行该操作')
      }
    } else {
      const isBuyer = order.buyerId === user.id
      const isSeller = user.role === 'owner' && merchantIdsOfOrder(order).includes(user.id)
      if (!isBuyer && !isSeller)
        throw new ApiError(CODE.FORBIDDEN, '仅订单本人或本店商家可执行该操作')
    }
    if (!rule.from.includes(order.status as OrderStatus)) {
      throw new ApiError(CODE.BUSINESS_CONFLICT, `当前状态 ${order.status} 不允许${action}`)
    }
    const stampCol =
      action === 'pay' ? 'pay_time' : action === 'ship' ? 'ship_time' : 'complete_time'
    const sets: string[] = [`status = ?`, `${stampCol} = ?`]
    const args: unknown[] = [rule.to!, now()]
    if (action === 'ship') {
      sets.push('logistics_no = ?', 'logistics_company = ?')
      args.push(String(req.body?.logisticsNo ?? ''), String(req.body?.logisticsCompany ?? ''))
    }
    sets.push('updated_at = ?')
    args.push(now(), order.id)
    db.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`).run(...args)
    res.json({ code: CODE.OK, data: findOrderOrThrow(order.id as string), message: 'ok' })
  })
}

/** 退款：{action: 'apply'|'approve'|'reject', reason}（镜像前端 requestRefund/approveRefund/rejectRefund） */
ordersRouter.post('/:id/refund', (req, res) => {
  const user = (req as AuthedRequest).user!
  const order = findOrderOrThrow(String(req.params.id))
  const action = String(req.body?.action ?? '')
  const REFUNDABLE: OrderStatus[] = ['paid', 'shipped', 'completed']

  if (action === 'apply') {
    if (order.buyerId !== user.id) throw new ApiError(CODE.FORBIDDEN, '仅订单本人可申请退款')
    if (!REFUNDABLE.includes(order.status as OrderStatus)) {
      throw new ApiError(CODE.BUSINESS_CONFLICT, `当前状态 ${order.status} 不支持退款`)
    }
    const reason = String(req.body?.reason ?? '').trim()
    if (!reason) throw new ApiError(CODE.BAD_PARAM, '请填写退款原因')
    db.prepare(
      `UPDATE orders SET status = 'refunding', refund_from_status = ?, refund_reason = ?, refund_time = ?, updated_at = ? WHERE id = ?`
    ).run(order.status, reason, now(), now(), order.id)
  } else if (action === 'approve' || action === 'reject') {
    // 审核是商家行为：须 owner 且本店订单（否则任意买家可批准他人退款并触发库存回补）
    if (user.role !== 'owner' || !merchantIdsOfOrder(order).includes(user.id)) {
      throw new ApiError(CODE.FORBIDDEN, '仅商家可审核退款')
    }
    if (order.status !== 'refunding')
      throw new ApiError(CODE.BUSINESS_CONFLICT, '订单不在退款审核中')
    if (action === 'approve') {
      db.transaction((): void => {
        db.prepare(`UPDATE orders SET status = 'refunded', updated_at = ? WHERE id = ?`).run(
          now(),
          order.id
        )
        const items = (order.items ?? []) as { productId: string; quantity: number }[]
        const back = db.prepare(
          'UPDATE products SET stock = CASE WHEN stock IS NULL THEN stock ELSE stock + ? END, status = CASE WHEN stock IS NULL THEN status ELSE ? END WHERE id = ?'
        )
        for (const item of items) {
          back.run(item.quantity, 'active', item.productId)
        }
      })()
    } else {
      db.prepare(
        `UPDATE orders SET status = ?, refund_from_status = NULL, refund_reason = NULL, refund_time = NULL, updated_at = ? WHERE id = ?`
      ).run((order.refundFromStatus as string) || 'shipped', now(), order.id)
    }
  } else {
    throw new ApiError(CODE.BAD_PARAM, '非法退款操作')
  }
  res.json({ code: CODE.OK, data: findOrderOrThrow(order.id as string), message: 'ok' })
})

/** 买家取消未支付订单（回补库存，镜像前端 cancelOrder） */
ordersRouter.post('/:id/cancel', (req, res) => {
  const user = (req as AuthedRequest).user!
  const order = findOrderOrThrow(String(req.params.id))
  if (order.buyerId !== user.id) throw new ApiError(CODE.FORBIDDEN, '仅订单本人可取消')
  if (order.status !== 'pending') throw new ApiError(CODE.BUSINESS_CONFLICT, '仅待支付订单可取消')
  db.transaction((): void => {
    db.prepare(`UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ?`).run(
      now(),
      order.id
    )
    const items = (order.items ?? []) as { productId: string; quantity: number }[]
    const back = db.prepare(
      'UPDATE products SET stock = CASE WHEN stock IS NULL THEN stock ELSE stock + ? END, status = CASE WHEN stock IS NULL THEN status ELSE ? END WHERE id = ?'
    )
    for (const item of items) {
      back.run(item.quantity, 'active', item.productId)
    }
  })()
  res.json({ code: CODE.OK, data: findOrderOrThrow(order.id as string), message: 'ok' })
})
