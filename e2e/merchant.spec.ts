import { test, expect } from '@playwright/test'

// 商家登录辅助函数
async function merchantLogin(page: import('@playwright/test').Page) {
  await page.goto('/#/merchant/login')
  await page.waitForTimeout(600)
  // 填写手机号
  const phoneInput = page.locator('input[placeholder*="手机"]')
  await phoneInput.fill('13800001111')
  // 点击发送验证码
  const sendBtn = page.locator('button:has-text("发送验证码")')
  await sendBtn.click()
  await page.waitForTimeout(500)
  // 弹窗中点击"自动填入"
  const autoFillBtn = page.locator('button:has-text("自动填入")')
  await autoFillBtn.click()
  await page.waitForTimeout(500)
  // 勾选协议
  const agreeCheckbox = page.locator('.van-checkbox')
  await agreeCheckbox.click()
  await page.waitForTimeout(300)
  // 点击登录
  const loginBtn = page.locator('button:has-text("登录")')
  await loginBtn.click()
  await page.waitForTimeout(1500)
}

test.describe('商家登录', () => {
  test('登录页正常加载，显示标题', async ({ page }) => {
    await page.goto('/#/merchant/login')
    await page.waitForTimeout(600)
    await expect(page.locator('.van-nav-bar__title')).toContainText('商家登录')
  })

  test('手机号输入框和验证码输入框可见', async ({ page }) => {
    await page.goto('/#/merchant/login')
    await page.waitForTimeout(600)
    await expect(page.locator('input[placeholder*="手机"]')).toBeVisible()
    await expect(page.locator('input[placeholder*="验证码"]')).toBeVisible()
  })

  test('发送验证码按钮可见', async ({ page }) => {
    await page.goto('/#/merchant/login')
    await page.waitForTimeout(600)
    await expect(page.locator('button:has-text("发送验证码")')).toBeVisible()
  })

  test('完整登录流程：发送验证码→自动填入→勾选协议→登录', async ({ page }) => {
    await merchantLogin(page)
    // 应该跳转到 dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
  })

  test('未登录访问商家页面被重定向到登录页', async ({ page }) => {
    await page.goto('/#/merchant/dashboard')
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/login/)
  })
})

test.describe('商家数据看板', () => {
  test('登录后看板页面正常显示', async ({ page }) => {
    await merchantLogin(page)
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
    // 看板应该可见
    await expect(page.locator('.dashboard-content')).toBeVisible({ timeout: 10000 })
  })

  test('看板显示统计卡片', async ({ page }) => {
    await merchantLogin(page)
    await expect(page.locator('.dashboard-content')).toBeVisible({ timeout: 10000 })
    const statItems = page.locator('.stat-item')
    await expect(statItems.first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('商家商品管理', () => {
  test('商品管理页面显示商品列表', async ({ page }) => {
    await merchantLogin(page)
    await page.goto('/#/merchant/products')
    await page.waitForTimeout(1000)
    await expect(page.locator('.page-container')).toBeVisible()
    const cards = page.locator('.product-card')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
  })

  test('批量管理模式', async ({ page }) => {
    await merchantLogin(page)
    await page.goto('/#/merchant/products')
    await page.waitForTimeout(1000)
    const batchBtn = page.locator('button:has-text("批量管理")')
    if (await batchBtn.isVisible()) {
      await batchBtn.click()
      await page.waitForTimeout(300)
      await expect(page.locator('.batch-bar')).toBeVisible()
    }
  })
})

test.describe('商家订单管理', () => {
  test('订单管理页面正常加载', async ({ page }) => {
    await merchantLogin(page)
    await page.goto('/#/merchant/orders')
    await page.waitForTimeout(1000)
    await expect(page.locator('.merchant-orders-page, .page-container')).toBeVisible()
  })
})

test.describe('商家客户管理', () => {
  test('客户列表页面正常加载', async ({ page }) => {
    await merchantLogin(page)
    await page.goto('/#/merchant/customers')
    await page.waitForTimeout(1000)
    await expect(page.locator('.customer-list-page, .page-container')).toBeVisible()
  })
})

test.describe('商家账号管理', () => {
  test('账号页面正常加载', async ({ page }) => {
    await merchantLogin(page)
    await page.goto('/#/merchant/account')
    await page.waitForTimeout(1000)
    await expect(page.locator('.account-page, .page-container')).toBeVisible()
  })
})
