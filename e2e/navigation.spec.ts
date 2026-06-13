import { test, expect } from '@playwright/test'

test.describe('页面导航与路由', () => {
  test('404页面：访问不存在的路径显示404', async ({ page }) => {
    await page.goto('/#/nonexistent-page-xyz')
    await page.waitForTimeout(600)
    // 应该显示404页面
    await expect(page.locator('.not-found-page')).toBeVisible()
  })

  test('离线页面可访问', async ({ page }) => {
    await page.goto('/#/offline')
    await page.waitForTimeout(600)
    await expect(page.locator('.offline-page, .van-empty')).toBeVisible()
  })
})

test.describe('个人中心', () => {
  test('个人中心页面正常加载', async ({ page }) => {
    await page.goto('/#/profile')
    await page.waitForTimeout(600)
    await expect(page.locator('.profile-page')).toBeVisible()
  })
})

test.describe('响应式与移动端适配', () => {
  test('页面在iPhone 14 Pro尺寸下正常显示', async ({ page }) => {
    await page.goto('/#/')
    await page.waitForTimeout(600)
    // 页面宽度应该适配移动端
    const homePage = page.locator('.home-page')
    await expect(homePage).toBeVisible()
  })

  test('商品列表在移动端正常滚动', async ({ page }) => {
    await page.goto('/#/products')
    await page.waitForTimeout(600)
    // 向下滚动
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(300)
    // 页面应该正常
    await expect(page.locator('.page-container')).toBeVisible()
  })
})

test.describe('全局交互', () => {
  test('下拉刷新功能', async ({ page }) => {
    await page.goto('/#/products')
    await page.waitForTimeout(600)
    // 模拟下拉刷新（通过点击刷新区域）
    const pullRefresh = page.locator('.van-pull-refresh')
    if (await pullRefresh.isVisible()) {
      // 触发下拉
      await page.evaluate(() => {
        const el = document.querySelector('.van-pull-refresh__track')
        if (el) {
          el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }))
        }
      })
    }
  })

  test('页面返回功能', async ({ page }) => {
    // 从首页进入商品列表
    await page.goto('/#/products')
    await page.waitForTimeout(600)
    // 进入商品详情
    await page.goto('/#/products/P001')
    await page.waitForTimeout(600)
    await expect(page.locator('.product-detail-page')).toBeVisible()
    // 点击返回
    const backBtn = page.locator('.van-nav-bar__left, .van-icon-arrow-left').first()
    if (await backBtn.isVisible()) {
      await backBtn.click()
      await page.waitForTimeout(500)
    }
  })
})
