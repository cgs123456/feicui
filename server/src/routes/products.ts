import { Router } from 'express'
import { db, now, rowToProduct, type Product } from '../db.js'
import { CODE, ApiError } from '../types.js'
import { requireOwner, type AuthedRequest } from '../middleware/auth.js'

export const productsRouter = Router()

export function findProductOrThrow(id: string): Product {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined
  if (!row) throw new ApiError(CODE.NOT_FOUND, '商品不存在或已删除')
  return rowToProduct(row)
}

productsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY id').all() as Record<string, unknown>[]
  res.json({ code: CODE.OK, data: rows.map(rowToProduct), message: 'ok' })
})

productsRouter.get('/:id', (req, res) => {
  const product = findProductOrThrow(String(req.params.id))
  res.json({ code: CODE.OK, data: product, message: 'ok' })
})

productsRouter.post('/', requireOwner, (req, res) => {
  const user = (req as AuthedRequest).user!
  const b = req.body ?? {}
  const title = String(b.title ?? '').trim()
  const price = Number(b.price)
  if (!title || !Number.isFinite(price) || price <= 0) {
    throw new ApiError(CODE.BAD_PARAM, '标题与价格（>0）必填')
  }
  const id = `P${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)}`
  db.prepare(
    `INSERT INTO products
      (id, merchant_id, merchant_name, title, category, price, original_price, cover, images,
       description, material, water_grade, color, size, style, weight, stock, status, views, popularity, inquiries,
       cert_no, cert_org, cert_date, cert_grade, certificate, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, 0, 0, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    user.id,
    b.merchantName ?? '',
    title,
    String(b.category ?? ''),
    price,
    Number.isFinite(Number(b.originalPrice)) && Number(b.originalPrice) > 0
      ? Number(b.originalPrice)
      : null,
    String(b.cover ?? ''),
    JSON.stringify(Array.isArray(b.images) ? b.images : []),
    String(b.description ?? ''),
    String(b.material ?? ''),
    String(b.waterGrade ?? ''),
    String(b.color ?? ''),
    String(b.size ?? ''),
    String(b.style ?? ''),
    String(b.weight ?? ''),
    Number.isFinite(Number(b.stock)) ? normalizeStock(Number(b.stock)) : null,
    b.certNo == null ? null : String(b.certNo),
    b.certOrg == null ? null : String(b.certOrg),
    b.certDate == null ? null : String(b.certDate),
    b.certGrade == null ? null : String(b.certGrade),
    JSON.stringify(Array.isArray(b.certificate) ? b.certificate : []),
    now(),
    now()
  )
  res.json({ code: CODE.OK, data: findProductOrThrow(id), message: 'ok' })
})

productsRouter.put('/:id', requireOwner, (req, res) => {
  const user = (req as AuthedRequest).user!
  findProductOrThrow(String(req.params.id))
  const b = req.body ?? {}
  const fields: string[] = []
  const values: unknown[] = []

  const setField = (column: string, value: unknown): void => {
    fields.push(`${column} = ?`)
    values.push(value)
  }

  if (b.title !== undefined) {
    const t = String(b.title).trim()
    if (!t) throw new ApiError(CODE.BAD_PARAM, '标题不能为空')
    setField('title', t)
  }
  if (b.price !== undefined) {
    const p = Number(b.price)
    if (!Number.isFinite(p) || p <= 0) throw new ApiError(CODE.BAD_PARAM, '价格必须大于 0')
    setField('price', p)
  }
  if (b.originalPrice !== undefined) {
    const op = Number(b.originalPrice)
    setField('original_price', Number.isFinite(op) && op > 0 ? op : null)
  }
  for (const key of [
    'category',
    'cover',
    'description',
    'material',
    'waterGrade',
    'color',
    'size',
    'style',
    'weight',
    'certNo',
    'certOrg',
    'certDate',
    'certGrade'
  ] as const) {
    if (b[key] !== undefined) setField(camelToSnake(key), String(b[key]))
  }
  if (b.images !== undefined)
    setField('images', JSON.stringify(Array.isArray(b.images) ? b.images : []))
  if (b.certificate !== undefined)
    setField('certificate', JSON.stringify(Array.isArray(b.certificate) ? b.certificate : []))
  if (b.stock !== undefined)
    setField('stock', Number.isFinite(Number(b.stock)) ? normalizeStock(Number(b.stock)) : null)
  if (b.status !== undefined) {
    if (!['active', 'sold', 'offline'].includes(String(b.status))) {
      throw new ApiError(CODE.BAD_PARAM, '非法商品状态')
    }
    setField('status', String(b.status))
  }

  if (fields.length > 0) {
    setField('updated_at', now())
    values.push(String(req.params.id), user.id)
    const info = db
      .prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ? AND merchant_id = ?`)
      .run(...values)
    if (info.changes === 0) throw new ApiError(CODE.FORBIDDEN, '商品不存在或非本店商品')
  }
  res.json({ code: CODE.OK, data: findProductOrThrow(String(req.params.id)), message: 'ok' })
})

productsRouter.delete('/:id', requireOwner, (req, res) => {
  const user = (req as AuthedRequest).user!
  const info = db
    .prepare('DELETE FROM products WHERE id = ? AND merchant_id = ?')
    .run(String(req.params.id), user.id)
  if (info.changes === 0) throw new ApiError(CODE.FORBIDDEN, '商品不存在或非本店商品')
  res.json({ code: CODE.OK, data: { success: true }, message: 'ok' })
})

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)
}

/** 库存归一：对齐前端语义（-1 = 不限库存；其余负数归 0） */
function normalizeStock(n: number): number {
  return n === -1 ? -1 : Math.max(0, Math.floor(n))
}
