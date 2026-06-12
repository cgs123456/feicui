import { test, expect } from '@playwright/test'

test.describe('登录页', () => {
  test('登录页正常加载', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('.van-nav-bar__title')).toBeVisible()
  })

  test('手机号输入框存在', async ({ page }) => {
    await page.goto('/login')
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="手机"], input[placeholder*="phone"]')
    await expect(phoneInput.first()).toBeVisible()
  })

  test('发送验证码按钮存在', async ({ page }) => {
    await page.goto('/login')
    const btn = page.locator('button, .van-button').filter({ hasText: /验证码|获取|发送/i })
    await expect(btn.first()).toBeVisible()
  })
})
