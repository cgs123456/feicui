import { http } from './http'
import type { LoginResponse } from './types'

function delay(ms = 200): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** 契约：POST /auth/login → ApiResponse<LoginResponse>（user 为后端 UserPayload 形状：nickname + role:'owner'|'buyer'） */
export async function loginApi(phone: string, code: string): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>('/auth/login', { phone, code }, async () => {
    await delay(500)
    if (code === '1234') {
      return {
        code: 0,
        data: {
          success: true,
          user: { id: 'M001', nickname: '张商家', phone, role: 'owner' as const },
          token: `token_${Date.now()}`
        },
        message: 'ok'
      }
    }
    return { code: 1001, data: { success: false }, message: '验证码错误' }
  })
  return res.data
}

/** 契约：POST /auth/sms → ApiResponse<SendSmsCodeResponse> */
export async function sendSmsCode(_phone: string): Promise<{ code: string }> {
  const res = await http.post<{ code: string }>('/auth/sms', { phone: _phone }, async () => {
    await delay(300)
    return {
      code: 0,
      data: { code: String(Math.floor(1000 + Math.random() * 9000)) },
      message: 'ok'
    }
  })
  return res.data
}
