import { test, expect } from '@playwright/test'

test.describe('首页', () => {
  test('首页正常加载，显示AI找货和精选推荐Tab', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.locator('.home-page')).toBeVisible()
    await expect(page.locator('.van-tab').filter({ hasText: 'AI找货' })).toBeVisible()
    await expect(page.locator('.van-tab').filter({ hasText: '精选推荐' })).toBeVisible()
  })

  test('TabBar 导航可见', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.locator('.van-tabbar')).toBeVisible()
    await expect(page.locator('.van-tabbar-item').nth(0)).toBeVisible()
  })

  test('AI找货：发送消息后收到AI回复', async ({ page }) => {
    await page.goto('/#/')
    await page.locator('.van-tab').first().click()
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
    await textarea.fill('预算5万以内的手镯')
    await textarea.press('Enter')
    // AI 回复约 1.5s 后追加，轮询等待消息气泡
    await expect(page.locator('.chat-message, .message-item, .chat-bubble').first()).toBeVisible({
      timeout: 5000
    })
  })

  test('精选推荐：切换到精选推荐Tab显示商品', async ({ page }) => {
    await page.goto('/#/')
    await page.locator('.van-tab').filter({ hasText: '精选推荐' }).click()
    await expect(page.locator('.section-title').first()).toBeVisible()
  })

  test('商家入驻按钮可见', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.locator('.merchant-btn')).toBeVisible()
  })
})
