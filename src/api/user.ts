import type { UserInfo } from '@/types'

function delay(ms = 200): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function loginApi(
  phone: string,
  code: string
): Promise<{ success: boolean; user?: UserInfo }> {
  await delay(500)
  if (code === '1234') {
    return {
      success: true,
      user: { id: 'M001', name: '张商家', phone, avatar: '', role: 'merchant' }
    }
  }
  return { success: false }
}

export async function sendSmsCode(phone: string): Promise<{ code: string }> {
  await delay(300)
  return { code: String(Math.floor(1000 + Math.random() * 9000)) }
}
