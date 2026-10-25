import jwt, { type JwtPayload } from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'
import { CODE, ApiError, type UserPayload } from '../types.js'

/** 生产环境必须显式注入 JWT_SECRET（防离线伪造 token）；开发环境回退到固定 dev 值 */
function getSecret(): string {
  const fromEnv = process.env.JWT_SECRET
  if (fromEnv) return fromEnv
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET 未配置：生产环境必须通过环境变量注入签名密钥')
  }
  return 'jadeite-dev-secret'
}

export interface AuthedRequest extends Request {
  user?: UserPayload
}

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' })
}

function verifyBearer(header: string | undefined): UserPayload {
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(CODE.UNAUTHORIZED, '未登录或 token 缺失')
  }
  try {
    const decoded = jwt.verify(header.slice(7), getSecret()) as JwtPayload
    if (typeof decoded.id !== 'string' || typeof decoded.role !== 'string') {
      throw new Error('bad payload')
    }
    return {
      id: decoded.id,
      phone: decoded.phone,
      role: decoded.role as UserPayload['role'],
      nickname: decoded.nickname
    }
  } catch {
    throw new ApiError(CODE.UNAUTHORIZED, 'token 无效或已过期')
  }
}

/** 必须登录：解析失败直接抛 401 */
export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  try {
    req.user = verifyBearer(req.headers.authorization)
    next()
  } catch (err) {
    next(err)
  }
}

/** 可选登录：有 token 且有效则挂 user，否则匿名放行（商品浏览） */
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  try {
    req.user = verifyBearer(req.headers.authorization)
  } catch {
    req.user = undefined
  }
  next()
}

/** 仅商家（owner）可访问 */
export function requireOwner(req: AuthedRequest, _res: Response, next: NextFunction): void {
  try {
    const user = verifyBearer(req.headers.authorization)
    if (user.role !== 'owner') throw new ApiError(CODE.FORBIDDEN, '仅商家账号可执行此操作')
    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}
