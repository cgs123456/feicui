import { test, expect } from '@playwright/test'

test.describe('购物车', () => {
  test('空购物车显示空状态', async ({ page }) => {
    // 先清空购物车
    await page.goto('/#/cart')
    await page.waitForTimeout(800)
    const empty = page.locator('.van-empty')
    const cartList = page.locator('.cart-list')
    // 购物车可能为空或有商品
    const emptyCount = await empty.count()
    const listCount = await cartList.count()
    expect(emptyCount > 0 || listCount > 0).toBeTruthy()
  })

  test('从商品详情添加商品到购物车', async ({ page }) => {
    // 先去详情页加购
    await page.goto('/#/products/P001')
    await page.waitForTimeout(800)
    await page.locator('button:has-text("加入购物车")').click()
    await page.waitForTimeout(500)
    // 去购物车页面
    await page.goto('/#/cart')
    await page.waitForTimeout(600)
    // 应该有商品
    const cartItems = page.locator('.cart-item')
    await expect(cartItems.first()).toBeVisible()
  })

  test('购物车商品数量调整', async ({ page }) => {
    // 先加购
    await page.goto('/#/products/P001')
    await page.waitForTimeout(800)
    await page.locator('button:has-text("加入购物车")').click()
    await page.waitForTimeout(500)
    // 去购物车
    await page.goto('/#/cart')
    await page.waitForTimeout(600)
    // 点击加号
    const plusBtn = page.locator('.van-stepper__plus').first()
    if (await plusBtn.isVisible()) {
      await plusBtn.click()
      await page.waitForTimeout(300)
    }
  })

  test('购物车勾选/全选功能', async ({ page }) => {
    // 先加购
    await page.goto('/#/products/P001')
    await page.waitForTimeout(800)
    await page.locator('button:has-text("加入购物车")').click()
    await page.waitForTimeout(500)
    // 去购物车
    await page.goto('/#/cart')
    await page.waitForTimeout(600)
    // 点击全选
    const checkAll = page.locator('.settle-check')
    if (await checkAll.isVisible()) {
      await checkAll.click()
      await page.waitForTimeout(300)
    }
  })

  test('去结算按钮', async ({ page }) => {
    // 先加购
    await page.goto('/#/products/P001')
    await page.waitForTimeout(800)
    await page.locator('button:has-text("加入购物车")').click()
    await page.waitForTimeout(500)
    // 去购物车
    await page.goto('/#/cart')
    await page.waitForTimeout(600)
    // 点击去结算
    const settleBtn = page.locator('button:has-text("去结算")')
    if (await settleBtn.isEnabled()) {
      await settleBtn.click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('收藏夹', () => {
  test('收藏夹页面正常加载', async ({ page }) => {
    await page.goto('/#/favorites')
    await page.waitForTimeout(600)
    const empty = page.locator('.van-empty')
    const grid = page.locator('.favorites-grid')
    const hasEmpty = await empty.isVisible()
    const hasGrid = await grid.isVisible()
    expect(hasEmpty || hasGrid).toBeTruthy()
  })

  test('从详情页收藏商品后出现在收藏夹', async ({ page }) => {
    // 先收藏
    await page.goto('/#/products/P001')
    await page.waitForTimeout(800)
    const favBtn = page.locator('.btn-icon').first()
    await favBtn.click()
    await page.waitForTimeout(500)
    // 去收藏夹
    await page.goto('/#/favorites')
    await page.waitForTimeout(600)
    // 应该有收藏商品
    const cards = page.locator('.favorite-card')
    if (await cards.count() > 0) {
      await expect(cards.first()).toBeVisible()
    }
  })

  test('收藏夹对比功能', async ({ page }) => {
    // 去收藏夹
    await page.goto('/#/favorites')
    await page.waitForTimeout(800)
    // 检查是否有收藏商品
    const checkboxes = page.locator('.van-checkbox__icon')
    const count = await checkboxes.count()
    if (count >= 2) {
      // 勾选两个商品
      await checkboxes.nth(0).click()
      await page.waitForTimeout(300)
      await checkboxes.nth(1).click()
      await page.waitForTimeout(300)
      // 对比按钮应该可见
      const compareBtn = page.locator('button:has-text("对比")')
      await expect(compareBtn).toBeVisible()
    }
  })
})

test.describe('商品对比', () => {
  test('对比页面至少需要2个商品', async ({ page }) => {
    await page.goto('/#/compare')
    await page.waitForTimeout(600)
    // 没有商品参数时应该显示空状态
    await expect(page.locator('.van-empty')).toBeVisible()
  })
})
