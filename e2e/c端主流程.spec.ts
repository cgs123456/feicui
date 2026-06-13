import { test, expect } from '@playwright/test'

test.describe('C端主流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/#/')
  })

  test('首页加载正常', async ({ page }) => {
    await expect(page.locator('.home-page')).toBeVisible()
  })

  test('AI对话功能', async ({ page }) => {
    // Click AI找货 tab
    await page.locator('.van-tab').first().click()
    // Type a message
    await page.locator('textarea').fill('预算5万以内的手镯')
    // Click send or press Enter
    await page.locator('textarea').press('Enter')
    // Wait for AI response
    await page.waitForTimeout(1000)
    // Should see response in chat
    const chatBubbles = page.locator('.chat-bubble, .message-item, .van-cell')
    await expect(chatBubbles.first()).toBeVisible()
  })

  test('商品列表页', async ({ page }) => {
    await page.goto('http://localhost:5173/#/products')
    await expect(page.locator('.page-container')).toBeVisible()
    // Should have product cards
    const cards = page.locator('.product-card, .van-swipe-cell')
    await expect(cards.first()).toBeVisible()
  })

  test('商品详情页', async ({ page }) => {
    await page.goto('http://localhost:5173/#/products/P001')
    await expect(page.locator('.product-detail-page')).toBeVisible()
    // Should show price
    await expect(page.locator('.current-price')).toBeVisible()
  })

  test('购物车页面', async ({ page }) => {
    await page.goto('http://localhost:5173/#/cart')
    await expect(page.locator('.cart-page, .van-empty')).toBeVisible()
  })

  test('个人中心', async ({ page }) => {
    await page.goto('http://localhost:5173/#/profile')
    await expect(page.locator('.profile-page')).toBeVisible()
  })
})
