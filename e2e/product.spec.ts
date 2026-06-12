import { test, expect } from '@playwright/test'

test.describe('商品详情页', () => {
  test('商品详情页正常加载', async ({ page }) => {
    await page.goto('/product-detail')
    await expect(page.locator('.van-swipe, .van-nav-bar')).toBeVisible()
  })
})
