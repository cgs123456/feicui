import { test, expect } from '@playwright/test'

test.describe('首页', () => {
  test('首页正常加载', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.van-nav-bar__title')).toBeVisible()
  })

  test('TabBar 导航可见', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.van-tabbar')).toBeVisible()
  })

  test('搜索输入框存在', async ({ page }) => {
    await page.goto('/')
    const search = page.locator('input[placeholder*="搜索"], input[placeholder*="关键词"], .van-search input')
    await expect(search.first()).toBeVisible()
  })
})
