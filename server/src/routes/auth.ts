import { Router } from 'express'
import { db, now } from '../db.js'
import { CODE, ApiError, type ApiResponse, type UserPayload } from '../types.js'
import { signToken, type AuthedRequest } from '../middleware/auth.js'

export const authRouter = Router()

/** demo 语义：万能验证码 1234（对齐前端 mock 登录），其余走短信表校验 */
const MASTER_CODE = '1234'
const SMS_TTL_MS = 5 * 60 * 1000
/** 发送限流：同号 60s 一次（内存级，防短信轰炸；多实例部署应换集中存储） */
const smsSendAt = new Map<string, number>()

authRouter.post('/sms', (req, res) => {
  const phone = String(req.body?.phone ?? '')
  if (!/^1\d{10}$/.test(phone)) {
    throw new ApiError(CODE.BAD_PARAM, '手机号格式不正确')
  }
  const last = smsSendAt.get(phone) ?? 0
  if (Date.now() - last < 60 * 1000) {
    throw new ApiError(CODE.BAD_PARAM, '发送过于频繁，请稍后再试')
  }
  smsSendAt.set(phone, Date.now())
  const code = String(Math.floor(100000 + Math.random() * 900000))
  db.prepare(
    `INSERT INTO sms_codes (phone, code, expires_at) VALUES (?, ?, ?)
     ON CONFLICT(phone) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at`
  ).run(phone, code, Date.now() + SMS_TTL_MS)
  // 仅非生产环境回传验证码便于联调；生产接入真实短信通道后必须从响应中剔除
  const payload = process.env.NODE_ENV === 'production' ? {} : { code }
  res.json({ code: CODE.OK, data: payload, message: 'ok' } satisfies ApiResponse)
})

authRouter.post('/login', (req, res) => {
  const phone = String(req.body?.phone ?? '')
  const smsCode = String(req.body?.code ?? '')
  if (!/^1\d{10}$/.test(phone)) {
    throw new ApiError(CODE.BAD_PARAM, '手机号格式不正确')
  }
  if (smsCode !== MASTER_CODE) {
    const row = db.prepare('SELECT code, expires_at FROM sms_codes WHERE phone = ?').get(phone) as
      | { code: string; expires_at: number }
      | undefined
    if (!row || row.code !== smsCode || row.expires_at < Date.now()) {
      throw new ApiError(CODE.BAD_SMS, '验证码错误或已过期')
    }
  }

  // 登录即注册（对齐前端"任意 11 位手机号可登录"的 demo 语义）；
  // 商家手机号命中已 seed 的 M001 owner 账号
  const existing = db
    .prepare('SELECT id, phone, role, nickname FROM users WHERE phone = ?')
    .get(phone) as { id: string; phone: string; role: string; nickname: string | null } | undefined
  let user = existing
  if (!user) {
    const id = `U${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
    db.prepare(
      'INSERT INTO users (id, phone, role, nickname, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, phone, 'buyer', null, now())
    user = { id, phone, role: 'buyer', nickname: null }
  }

  const payload: UserPayload = {
    id: user.id,
    phone: user.phone,
    role: user.role as UserPayload['role'],
    nickname: user.nickname ?? undefined
  }
  const token = signToken(payload)
  // 一次性消费：用后即删，防止 5 分钟窗口内重放
  db.prepare('DELETE FROM sms_codes WHERE phone = ?').run(phone)
  ;(req as AuthedRequest).user = payload
  res.json({
    code: CODE.OK,
    data: { success: true, user: payload, token },
    message: 'ok'
  } satisfies ApiResponse)
})
