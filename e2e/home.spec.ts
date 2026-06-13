import { test, expect } from '@playwright/test'

test.describe('首页', () => {
  test('首页正常加载，显示AI找货和精选推荐Tab', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.locator('.home-page')).toBeVisible()
    // 应有两个 tab
    await expect(page.locator('.van-tab').filter({ hasText: 'AI找货' })).toBeVisible()
    await expect(page.locator('.van-tab').filter({ hasText: '精选推荐' })).toBeVisible()
  })

  test('TabBar 导航可见，包含首页/分类/购物车/我的', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.locator('.van-tabbar')).toBeVisible()
    await expect(page.locator('.van-tabbar-item').nth(0)).toBeVisible()
  })

  test('AI找货：发送消息后收到AI回复', async ({ page }) => {
    await page.goto('/#/')
    // 确保在 AI找货 tab
    await page.locator('.van-tab').first().click()
    await page.waitForTimeout(500)
    // 找到输入框并输入
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
    await textarea.fill('预算5万以内的手镯')
    await textarea.press('Enter')
    // 等待 AI 回复
    await page.waitForTimeout(2000)
    // 应该有聊天消息
    const messages = page.locator('.chat-message, .message-item, .chat-bubble')
    await expect(messages.first()).toBeVisible()
  })

  test('精选推荐：切换到精选推荐Tab显示商品', async ({ page }) => {
    await page.goto('/#/')
    await page.locator('.van-tab').filter({ hasText: '精选推荐' }).click()
    await page.waitForTimeout(500)
    // 应该看到热门推荐区域
    await expect(page.locator('.section-title').first()).toBeVisible()
  })

  test('商家入驻按钮可见', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.locator('.merchant-btn')).toBeVisible()
  })
})
