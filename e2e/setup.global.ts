import { test as setup, expect } from '@playwright/test'
import { buyerLogin, BUYER_PHONE } from './helpers'

const STATE_FILE = 'e2e/.auth/buyer.json'

/**
 * 订单流前置：UI 登录拿到真实 token（沿用前端 setToken 编码格式），
 * 再用 token 调后端建默认收货地址；storageState 供 buyer 项目全体用例复用。
 */
setup('买家登录并创建默认收货地址', async ({ page, request }) => {
  await buyerLogin(page)

  // 前端 setToken 存的是 btoa(encodeURIComponent(jwt))，此处反解出原始 token
  const token = decodeURIComponent(
    atob(await page.evaluate(() => localStorage.getItem('jadeite_token') ?? ''))
  )
  expect(token).not.toBe('')

  const res = await request.post('/api/addresses', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: '张三',
      phone: BUYER_PHONE,
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detail: '建国路88号院',
      isDefault: true
    }
  })
  expect(res.ok()).toBeTruthy()

  await page.context().storageState({ path: STATE_FILE })
})
