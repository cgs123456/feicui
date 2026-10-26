/**
 * 认证接口层：与 server/src/routes/auth.ts 契约一一对应。
 */
import { http } from './http'
import type { LoginResponse } from './types'

/** 契约：POST /auth/login → ApiResponse<LoginResponse>（user 为后端 UserPayload 形状：nickname + role:'owner'|'buyer'） */
export async function loginApi(phone: string, code: string): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>('/auth/login', { phone, code })
  return res.data
}

/** 契约：POST /auth/sms → ApiResponse<SendSmsCodeResponse>（后端仅非生产环境回传验证码） */
export async function sendSmsCode(phone: string): Promise<{ code: string }> {
  const res = await http.post<{ code: string }>('/auth/sms', { phone })
  return res.data
}
