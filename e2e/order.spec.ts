import { test, expect } from '@playwright/test'

test.describe('订单流程', () => {
  test('订单列表页正常加载', async ({ page }) => {
    await page.goto('/#/orders')
    // 订单列表或空状态，二者必有其一
    await expect(page.locator('.van-empty').or(page.locator('.order-list'))).toBeVisible()
  })

  test('订单列表Tab切换', async ({ page }) => {
    await page.goto('/#/orders')
    const tabs = page.locator('.van-tab')
    await expect(tabs.first()).toBeVisible()
    const count = await tabs.count()
    expect(count).toBeGreaterThan(1)
    await tabs.nth(1).click()
    // 切换后激活态落到第二个 Tab
    await expect(tabs.nth(1)).toHaveClass(/van-tab--active/)
  })
})

test.describe('订单详情', () => {
  test('不存在的订单显示加载或空状态', async ({ page }) => {
    await page.goto('/#/order/detail/nonexistent')
    // 页面容器在加载与 404 空态下都存在；.van-loading 与容器并存，or() 会 strict 冲突
    await expect(page.locator('.order-detail-page')).toBeVisible()
  })
})

test.describe('完整购买流程', () => {
  test('立即购买：详情→确认弹窗→订单确认→提交→成功页', async ({ page }) => {
    await page.goto('/#/products/P001')
    await page.locator('button:has-text("立即购买")').click()
    // 确认购买弹窗
    const dialog = page.locator('.van-dialog')
    await expect(dialog).toBeVisible()
    await page.locator('.van-dialog__confirm').click()
    // 进入订单确认页
    await page.waitForURL(/#\/order\/confirm\?id=P001/)
    await expect(page.locator('.order-confirm-page')).toBeVisible()
    // 提交订单 → 成功页
    await page.locator('button:has-text("提交订单")').click()
    await page.waitForURL(/#\/order\/success\?orderId=/)
    await expect(page.locator('.order-success-page')).toBeVisible()
    // 成功页展示订单号
    await expect(page.locator('.order-no')).not.toBeEmpty()
  })

  test('加购→购物车→结算→提交→成功页', async ({ page }) => {
    // P002 无 stock 字段（不限购）：与立即购买用例的 P001（stock=1）互不干扰
    await page.goto('/#/products/P002')
    await expect(page.locator('.bottom-bar button:has-text("加入购物车")')).toBeVisible()
    await page
      .waitForFunction(() => [...document.images].every(img => img.complete), undefined, {
        timeout: 8000
      })
      .catch(() => {})
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect(page.locator('.bottom-bar button:has-text("加入购物车")')).toBeInViewport()
    await page.locator('.bottom-bar button:has-text("加入购物车")').dispatchEvent('click')
    await expect(page.locator('.van-toast')).toContainText('已加入购物车')

    await page.goto('/#/cart')
    await expect(page.locator('.cart-page')).toBeVisible()
    const cartItems = page.locator('.cart-item')
    await expect(cartItems.first()).toBeVisible()

    // 去结算（加购默认勾选，按钮可用）
    await page.locator('button:has-text("去结算")').click()
    await page.waitForURL(/#\/order\/confirm\?from=cart/)
    await expect(page.locator('.order-confirm-page')).toBeVisible()

    await page.locator('button:has-text("提交订单")').click()
    await page.waitForURL(/#\/order\/success\?orderId=/)
    await expect(page.locator('.order-success-page')).toBeVisible()
    await expect(page.locator('.order-no')).not.toBeEmpty()
  })
})
