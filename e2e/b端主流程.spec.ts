import { test, expect } from '@playwright/test'

test.describe('B端主流程', () => {
  test('商家登录', async ({ page }) => {
    await page.goto('http://localhost:5173/#/merchant/login')
    await expect(page.locator('.login-page, .van-form')).toBeVisible()
    // Fill login form
    await page.locator('input[type="tel"], input[placeholder*="手机"]').fill('13800001111')
    await page.locator('input[type="number"], input[placeholder*="验证码"]').fill('1234')
    // Click login
    await page.locator('button:has-text("登录"), .van-button--primary').click()
    await page.waitForTimeout(1000)
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/)
  })

  test('数据看板', async ({ page }) => {
    await page.goto('http://localhost:5173/#/merchant/login')
    await page.locator('input[type="tel"], input[placeholder*="手机"]').fill('13800001111')
    await page.locator('input[type="number"], input[placeholder*="验证码"]').fill('1234')
    await page.locator('button:has-text("登录"), .van-button--primary').click()
    await page.waitForTimeout(1000)
    await expect(page.locator('.dashboard-page, .stat-card')).toBeVisible()
  })

  test('商品管理', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/#/merchant/login')
    await page.locator('input[type="tel"], input[placeholder*="手机"]').fill('13800001111')
    await page.locator('input[type="number"], input[placeholder*="验证码"]').fill('1234')
    await page.locator('button:has-text("登录"), .van-button--primary').click()
    await page.waitForTimeout(1000)
    // Navigate to products
    await page.goto('http://localhost:5173/#/merchant/products')
    await expect(page.locator('.page-container')).toBeVisible()
  })
})
