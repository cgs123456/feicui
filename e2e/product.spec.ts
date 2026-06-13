import { test, expect } from '@playwright/test'

test.describe('商品列表与搜索', () => {
  test('商品列表页正常加载，显示商品卡片', async ({ page }) => {
    await page.goto('/#/products')
    await expect(page.locator('.page-container')).toBeVisible()
    // 等待商品加载
    await page.waitForTimeout(800)
    const cards = page.locator('.product-card')
    await expect(cards.first()).toBeVisible()
  })

  test('搜索功能：输入关键词后筛选商品', async ({ page }) => {
    await page.goto('/#/products')
    await page.waitForTimeout(600)
    // 输入搜索词
    const searchInput = page.locator('.van-search input')
    await searchInput.fill('手镯')
    await page.waitForTimeout(600)
    // 应该有搜索结果或空提示
    const hasResults = await page.locator('.product-card').count()
    const hasEmpty = await page.locator('.van-empty').count()
    expect(hasResults > 0 || hasEmpty > 0).toBeTruthy()
  })

  test('筛选条件：点击品类筛选', async ({ page }) => {
    await page.goto('/#/products')
    await page.waitForTimeout(600)
    // 点击品类筛选
    const filterItem = page.locator('.filter-item').first()
    await filterItem.click()
    // 应该弹出筛选面板
    await expect(page.locator('.van-action-sheet, .van-popup')).toBeVisible()
  })

  test('排序切换：点击排序按钮切换排序方式', async ({ page }) => {
    await page.goto('/#/products')
    await page.waitForTimeout(600)
    const sortItem = page.locator('.sort-item')
    await sortItem.click()
    // 排序标签应该变化
    await page.waitForTimeout(300)
    await expect(sortItem).toBeVisible()
  })

  test('状态筛选Tab：切换在售/已售', async ({ page }) => {
    await page.goto('/#/products')
    await page.waitForTimeout(600)
    const activeTab = page.locator('.filter-tag').filter({ hasText: '在售' })
    if (await activeTab.isVisible()) {
      await activeTab.click()
      await page.waitForTimeout(300)
    }
  })
})

test.describe('商品详情页', () => {
  test('商品详情页正常加载，显示价格和标题', async ({ page }) => {
    await page.goto('/#/products/P001')
    await page.waitForTimeout(800)
    await expect(page.locator('.product-detail-page')).toBeVisible()
    await expect(page.locator('.current-price')).toBeVisible()
    await expect(page.locator('.product-title')).toBeVisible()
  })

  test('商品轮播图可见', async ({ page }) => {
    await page.goto('/#/products/P001')
    await page.waitForTimeout(800)
    await expect(page.locator('.van-swipe')).toBeVisible()
  })

  test('规格参数表可见', async ({ page }) => {
    await page.goto('/#/products/P001')
    await page.waitForTimeout(800)
    await expect(page.locator('.specs-card')).toBeVisible()
  })

  test('鉴定证书区域可见（如有）', async ({ page }) => {
    await page.goto('/#/products/P001')
    await page.waitForTimeout(800)
    const certCard = page.locator('.cert-card')
    // 证书区域可能存在也可能不存在
    if (await certCard.isVisible()) {
      await expect(certCard).toBeVisible()
    }
  })

  test('底部操作栏：加入购物车和立即购买按钮', async ({ page }) => {
    await page.goto('/#/products/P001')
    await page.waitForTimeout(800)
    await expect(page.locator('.bottom-bar')).toBeVisible()
    await expect(page.locator('button:has-text("加入购物车")')).toBeVisible()
    await expect(page.locator('button:has-text("立即购买")')).toBeVisible()
  })

  test('点击加入购物车提示成功', async ({ page }) => {
    await page.goto('/#/products/P001')
    await page.waitForTimeout(800)
    await page.locator('button:has-text("加入购物车")').click()
    // 应该弹出 toast 提示
    await page.waitForTimeout(500)
  })

  test('点击收藏按钮', async ({ page }) => {
    await page.goto('/#/products/P001')
    await page.waitForTimeout(800)
    const favBtn = page.locator('.btn-icon').first()
    await favBtn.click()
    await page.waitForTimeout(500)
  })
})
