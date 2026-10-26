import type { Page } from '@playwright/test'

/** 买家测试账号：任意手机号 + 万能码 1234（登录即注册，后端 dev 语义） */
export const BUYER_PHONE = ['139', '0000', '0001'].join('')

/**
 * 买家登录：复用商家登录页（单一登录页，双角色），万能码直填免发码。
 * 登录成功后统一跳转 merchant/dashboard（router.push('/merchant/dashboard')）。
 */
export async function buyerLogin(page: Page): Promise<void> {
  await page.goto('/#/merchant/login')
  await page.locator('input[placeholder="请输入手机号"]').fill(BUYER_PHONE)
  await page.locator('input[placeholder="请输入验证码"]').fill('1234')
  await page.locator('.van-checkbox').click()
  await page.locator('button:has-text("登录")').click()
  await page.waitForURL(/dashboard/, { timeout: 10000 })
}
