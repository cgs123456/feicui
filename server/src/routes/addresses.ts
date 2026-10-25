import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { db, now, rowToAddress } from '../db.js'
import { CODE, ApiError, type ApiResponse, type Address } from '../types.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'

export const addressesRouter = Router()
addressesRouter.use(requireAuth)

function buildFull(a: {
  province: string
  city: string
  district: string
  detail: string
}): string {
  return `${a.province}${a.city}${a.district}${a.detail}`
}

interface AddressBody {
  name?: string
  phone?: string
  province?: string
  city?: string
  district?: string
  detail?: string
  isDefault: boolean
}

/** 默认地址互斥：置默认前清掉本人其余默认；删除默认后自动补位到最早一条 */
function ensureDefaultInvariant(userId: string, keepId?: string): void {
  if (keepId) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ? AND id != ?').run(
      userId,
      keepId
    )
    return
  }
  const rows = db
    .prepare('SELECT id FROM addresses WHERE user_id = ? ORDER BY created_at')
    .all(userId) as {
    id: string
  }[]
  if (rows.length > 0) {
    db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').run(rows[0].id)
  }
}

addressesRouter.get('/', (req, res) => {
  const user = (req as AuthedRequest).user!
  const rows = db
    .prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at')
    .all(user.id) as Record<string, unknown>[]
  res.json({ code: CODE.OK, data: rows.map(rowToAddress), message: 'ok' } satisfies ApiResponse<
    Address[]
  >)
})

addressesRouter.post('/', (req, res) => {
  const user = (req as AuthedRequest).user!
  const b = validateAddressBody(req.body, false)
  const isDefault = b.isDefault ? 1 : 0
  const id = randomUUID()
  db.transaction((): void => {
    if (isDefault) db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(user.id)
    db.prepare(
      `INSERT INTO addresses
        (id, user_id, name, phone, province, city, district, detail, full_address, is_default, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      user.id,
      b.name!,
      b.phone!,
      b.province!,
      b.city!,
      b.district!,
      b.detail!,
      buildFull(b as never),
      isDefault,
      now()
    )
    const count = (
      db.prepare('SELECT COUNT(*) AS c FROM addresses WHERE user_id = ?').get(user.id) as {
        c: number
      }
    ).c
    if (count === 1) ensureDefaultInvariant(user.id)
  })()
  const row = db.prepare('SELECT * FROM addresses WHERE id = ?').get(id) as Record<string, unknown>
  res.json({ code: CODE.OK, data: rowToAddress(row), message: 'ok' } satisfies ApiResponse<Address>)
})

addressesRouter.put('/:id', (req, res) => {
  const user = (req as AuthedRequest).user!
  const existing = db
    .prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
    .get(req.params.id, user.id) as Record<string, unknown> | undefined
  if (!existing) throw new ApiError(CODE.NOT_FOUND, '地址不存在')
  const b = validateAddressBody(req.body, true)
  const merged = {
    province: b.province ?? (existing.province as string),
    city: b.city ?? (existing.city as string),
    district: b.district ?? (existing.district as string),
    detail: b.detail ?? (existing.detail as string)
  }
  db.transaction((): void => {
    if (b.isDefault)
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(user.id)
    // isDefault 缺省时保留原标记，避免局部更新意外清掉默认地址
    const nextDefault =
      typeof b.isDefault === 'boolean' ? (b.isDefault ? 1 : 0) : (existing.is_default as number)
    db.prepare(
      `UPDATE addresses SET name = ?, phone = ?, province = ?, city = ?, district = ?,
        detail = ?, full_address = ?, is_default = ? WHERE id = ?`
    ).run(
      b.name ?? (existing.name as string),
      b.phone ?? (existing.phone as string),
      merged.province,
      merged.city,
      merged.district,
      merged.detail,
      buildFull(merged),
      nextDefault,
      req.params.id
    )
  })()
  const row = db.prepare('SELECT * FROM addresses WHERE id = ?').get(req.params.id) as Record<
    string,
    unknown
  >
  res.json({ code: CODE.OK, data: rowToAddress(row), message: 'ok' } satisfies ApiResponse<Address>)
})

/** 设为默认 */
addressesRouter.post('/:id/default', (req, res) => {
  const user = (req as AuthedRequest).user!
  const existing = db
    .prepare('SELECT id FROM addresses WHERE id = ? AND user_id = ?')
    .get(req.params.id, user.id)
  if (!existing) throw new ApiError(CODE.NOT_FOUND, '地址不存在')
  db.transaction((): void => {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(user.id)
    db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').run(req.params.id)
  })()
  res.json({ code: CODE.OK, data: { success: true }, message: 'ok' } satisfies ApiResponse)
})

addressesRouter.delete('/:id', (req, res) => {
  const user = (req as AuthedRequest).user!
  const existing = db
    .prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
    .get(req.params.id, user.id) as Record<string, unknown> | undefined
  if (!existing) throw new ApiError(CODE.NOT_FOUND, '地址不存在')
  db.prepare('DELETE FROM addresses WHERE id = ?').run(req.params.id)
  if (existing.is_default === 1) ensureDefaultInvariant(user.id)
  res.json({ code: CODE.OK, data: { success: true }, message: 'ok' } satisfies ApiResponse)
})

function validateAddressBody(b: unknown, partial: boolean): AddressBody {
  const body = (b ?? {}) as Record<string, unknown>
  const str = (v: unknown): string | undefined => (v === undefined ? undefined : String(v).trim())
  const out: AddressBody = {
    name: str(body.name),
    phone: str(body.phone),
    province: str(body.province),
    city: str(body.city),
    district: str(body.district),
    detail: str(body.detail),
    isDefault: body.isDefault === true
  }
  const required = partial
    ? ([] as (keyof AddressBody)[])
    : (['name', 'phone', 'province', 'city', 'district', 'detail'] as (keyof AddressBody)[])
  for (const key of required) {
    if (!out[key]) throw new ApiError(CODE.BAD_PARAM, `缺少必填字段：${String(key)}`)
  }
  if (out.phone && !/^1\d{10}$/.test(out.phone)) {
    throw new ApiError(CODE.BAD_PARAM, '手机号格式不正确')
  }
  return out
}
