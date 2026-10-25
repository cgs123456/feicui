import { test, expect } from '@playwright/test'

async function addProductToCart(page: import('@playwright/test').Page, id: string) {
  await page.goto(`/#/products/${id}`)
  await page.locator('button:has-text("加入购物车")').click()
  await expect(page.locator('.van-toast')).toContainText('已加入购物车')
}

test.describe('购物车', () => {
  test('空购物车显示空状态', async ({ page }) => {
    await page.goto('/#/cart')
    await expect(page.locator('.van-empty').or(page.locator('.cart-list'))).toBeVisible()
  })

  test('从商品详情添加商品到购物车', async ({ page }) => {
    await addProductToCart(page, 'P001')
    await page.goto('/#/cart')
    await expect(page.locator('.cart-item').first()).toBeVisible()
  })

  test('购物车商品数量调整', async ({ page }) => {
    // P003 无库存上限，stepper 可加
    await addProductToCart(page, 'P003')
    await page.goto('/#/cart')
    const priceBefore = await page.locator('.settle-price').innerText()
    await page.locator('.van-stepper__plus').first().click()
    await expect(page.locator('.settle-price')).not.toHaveText(priceBefore)
  })

  test('购物车取消勾选后去结算禁用，重新全选后可用', async ({ page }) => {
    await addProductToCart(page, 'P003')
    await page.goto('/#/cart')
    const settleBtn = page.locator('button:has-text("去结算")')
    await expect(settleBtn).toBeEnabled()
    // 点外层全选容器（checkbox 为纯展示，点击事件在外层 div）
    await page.locator('.settle-check').click()
    await expect(settleBtn).toBeDisabled()
    await page.locator('.settle-check').click()
    await expect(settleBtn).toBeEnabled()
  })

  test('去结算按钮跳转订单确认页', async ({ page }) => {
    await addProductToCart(page, 'P001')
    await page.goto('/#/cart')
    await page.locator('button:has-text("去结算")').click()
    await page.waitForURL(/#\/order\/confirm\?from=cart/)
    await expect(page.locator('.order-confirm-page')).toBeVisible()
  })
})

test.describe('收藏夹', () => {
  test('收藏夹页面正常加载', async ({ page }) => {
    await page.goto('/#/favorites')
    await expect(page.locator('.van-empty').or(page.locator('.favorites-grid'))).toBeVisible()
  })

  test('从详情页收藏商品后出现在收藏夹', async ({ page }) => {
    await page.goto('/#/products/P001')
    await page.locator('[aria-label="收藏"]').click()
    await expect(page.locator('.van-toast')).toContainText('已加入收藏')
    await page.goto('/#/favorites')
    await expect(page.locator('.favorite-card').first()).toBeVisible()
  })

  test('收藏夹对比功能', async ({ page }) => {
    await page.goto('/#/products/P001')
    await page.locator('[aria-label="收藏"]').click()
    await expect(page.locator('.van-toast')).toContainText('已加入收藏')
    await page.goto('/#/products/P003')
    await page.locator('[aria-label="收藏"]').click()
    await expect(page.locator('.van-toast')).toContainText('已加入收藏')

    await page.goto('/#/favorites')
    const checkboxes = page.locator('.van-checkbox__icon')
    await expect(checkboxes).toHaveCount(2)
    await checkboxes.nth(0).click()
    await checkboxes.nth(1).click()
    const compareBtn = page.locator('button:has-text("对比")')
    await expect(compareBtn).toBeEnabled()
    await compareBtn.click()
    await page.waitForURL(/#\/compare/)
  })
})

test.describe('商品对比', () => {
  test('对比页面至少需要2个商品', async ({ page }) => {
    await page.goto('/#/compare')
    await expect(page.locator('.van-empty')).toBeVisible()
  })
})
