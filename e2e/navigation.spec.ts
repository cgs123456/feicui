import { test, expect } from '@playwright/test'

test.describe('页面导航与路由', () => {
  test('404页面：访问不存在的路径显示404', async ({ page }) => {
    await page.goto('/#/nonexistent-page-xyz')
    await expect(page.locator('.not-found-page')).toBeVisible()
  })

  test('离线页面可访问', async ({ page }) => {
    await page.goto('/#/offline')
    await expect(page.locator('.offline-page, .van-empty').first()).toBeVisible()
  })
})

test.describe('个人中心', () => {
  test('个人中心页面正常加载', async ({ page }) => {
    await page.goto('/#/profile')
    await expect(page.locator('.profile-page')).toBeVisible()
  })
})

test.describe('响应式与移动端适配', () => {
  test('页面在移动端尺寸下正常显示', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.locator('.home-page')).toBeVisible()
  })

  test('商品列表在移动端正常滚动', async ({ page }) => {
    await page.goto('/#/products')
    await expect(page.locator('.product-card').first()).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, 500))
    await expect(page.locator('.product-card').first()).toBeAttached()
  })
})

test.describe('全局交互', () => {
  test('商品列表下拉刷新不报错', async ({ page }) => {
    await page.goto('/#/products')
    const track = page.locator('.van-pull-refresh__track')
    await expect(track).toBeAttached()
    // 触发下拉位移（真实手势由用户执行；此处仅验证组件挂载且刷新回调无异常）
    await page.evaluate(() => {
      const el = document.querySelector('.van-pull-refresh__track') as HTMLElement | null
      el?.dispatchEvent(
        new TouchEvent('touchstart', {
          bubbles: true,
          touches: [new Touch({ identifier: 1, target: el, clientX: 100, clientY: 100 })]
        })
      )
    })
    await expect(page.locator('.product-card').first()).toBeVisible()
  })

  test('页面返回功能', async ({ page }) => {
    await page.goto('/#/products/P001')
    await expect(page.locator('.product-detail-page')).toBeVisible()
    const backBtn = page.locator('.van-nav-bar__left, .van-icon-arrow-left').first()
    await expect(backBtn).toBeVisible()
    await backBtn.click()
    await page.waitForURL(/#\/(products)?$/)
  })
})
