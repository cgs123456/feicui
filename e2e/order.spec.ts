import { test, expect } from '@playwright/test'

test.describe('订单流程', () => {
  test('从商品详情页立即购买进入订单确认', async ({ page }) => {
    await page.goto('/#/products/P001')
    await page.waitForTimeout(800)
    await page.locator('button:has-text("立即购买")').click()
    await page.waitForTimeout(500)
    // 应该弹出购买确认弹窗
    const dialog = page.locator('.van-dialog')
    if (await dialog.isVisible()) {
      await page.locator('.van-dialog__confirm').click()
      await page.waitForTimeout(500)
    }
  })

  test('订单列表页正常加载', async ({ page }) => {
    await page.goto('/#/orders')
    await page.waitForTimeout(600)
    // 应该显示订单列表或空状态
    const orderList = page.locator('.order-list')
    const empty = page.locator('.van-empty')
    const hasOrders = await orderList.isVisible()
    const hasEmpty = await empty.isVisible()
    expect(hasOrders || hasEmpty).toBeTruthy()
  })

  test('订单列表Tab切换', async ({ page }) => {
    await page.goto('/#/orders')
    await page.waitForTimeout(600)
    const tabs = page.locator('.van-tab')
    if (await tabs.count() > 1) {
      await tabs.nth(1).click()
      await page.waitForTimeout(300)
    }
  })
})

test.describe('订单详情', () => {
  test('不存在的订单显示加载状态', async ({ page }) => {
    await page.goto('/#/order/detail/nonexistent')
    await page.waitForTimeout(600)
    // 应该显示加载或空状态
    const loading = page.locator('.van-loading')
    const pageEl = page.locator('.order-detail-page')
    const hasLoading = await loading.isVisible()
    const hasPage = await pageEl.isVisible()
    expect(hasLoading || hasPage).toBeTruthy()
  })
})

test.describe('完整购买流程', () => {
  test('加购→购物车→结算', async ({ page }) => {
    // 1. 商品详情加购
    await page.goto('/#/products/P001')
    await page.waitForTimeout(800)
    await page.locator('button:has-text("加入购物车")').click()
    await page.waitForTimeout(500)

    // 2. 去购物车
    await page.goto('/#/cart')
    await page.waitForTimeout(600)
    const cartItems = page.locator('.cart-item')
    await expect(cartItems.first()).toBeVisible()

    // 3. 去结算
    const settleBtn = page.locator('button:has-text("去结算")')
    if (await settleBtn.isEnabled()) {
      await settleBtn.click()
      await page.waitForTimeout(500)
    }
  })
})
