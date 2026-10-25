import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem } from '@/types'
import { useProductStore } from './product'

const STORAGE_KEY = 'jadeite_cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    window.dispatchEvent(
      new CustomEvent('storage-error', {
        detail: { message: '本地存储写入失败，请检查浏览器设置' }
      })
    )
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(loadCart())

  const totalCount = computed(() =>
    items.value.reduce((sum: number, i: CartItem) => sum + i.quantity, 0)
  )

  const checkedItems = computed(() => items.value.filter((i: CartItem) => i.checked))

  const totalPrice = computed(() =>
    checkedItems.value.reduce((sum: number, i: CartItem) => sum + i.price * i.quantity, 0)
  )

  /** 商品限购数量：stock 未设置或 -1 视为不限 */
  function stockLimitOf(productId: string): number {
    const product = useProductStore().getProductById(productId)
    if (!product || product.stock === undefined || product.stock === -1) return Infinity
    return Math.max(product.stock, 0)
  }

  /** 加购成功返回 true，供页面区分「已加入」与「商品失效被拒」 */
  function addToCart(params: {
    productId: string
    title: string
    cover: string
    price: number
    quantity?: number
  }): boolean {
    if (params.price <= 0) return false // 价格校验
    const product = useProductStore().getProductById(params.productId)
    if (!product || product.status !== 'active') return false // 下架/已售商品加购
    const limit = stockLimitOf(params.productId)
    if (limit === 0) return false // 无库存
    const exist = items.value.find((i: CartItem) => i.productId === params.productId)
    if (exist) {
      exist.quantity = Math.min(exist.quantity + (params.quantity || 1), limit)
    } else {
      items.value.unshift({
        productId: params.productId,
        title: params.title,
        cover: params.cover,
        price: params.price,
        quantity: Math.min(params.quantity || 1, limit),
        checked: true,
        addTime: new Date().toISOString()
      })
    }
    saveCart(items.value)
    return true
  }

  function removeFromCart(productId: string) {
    items.value = items.value.filter((i: CartItem) => i.productId !== productId)
    saveCart(items.value)
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    const item = items.value.find((i: CartItem) => i.productId === productId)
    if (item) {
      item.quantity = Math.min(quantity, stockLimitOf(productId))
      saveCart(items.value)
    }
  }

  /**
   * 切换单项勾选。checked 为显式目标值（van-checkbox @update:model-value 传入），
   * 缺省时取反。Vant checkbox 在 model-value prop 变化时也会 emit change，
   * 若绑定 @change 取反会造成无限振荡，必须用显式赋值 + @update:model-value。
   */
  function toggleCheck(productId: string, checked?: boolean) {
    const item = items.value.find((i: CartItem) => i.productId === productId)
    if (item) {
      item.checked = checked ?? !item.checked
      saveCart(items.value)
    }
  }

  function toggleCheckAll() {
    const allChecked = items.value.every((i: CartItem) => i.checked)
    items.value.forEach((i: CartItem) => {
      i.checked = !allChecked
    })
    saveCart(items.value)
  }

  function clearChecked() {
    items.value = items.value.filter((i: CartItem) => !i.checked)
    saveCart(items.value)
  }

  function getItemById(productId: string): CartItem | undefined {
    return items.value.find((i: CartItem) => i.productId === productId)
  }

  function isInCart(productId: string): boolean {
    return items.value.some((i: CartItem) => i.productId === productId)
  }

  function clearCart() {
    items.value = []
    saveCart([])
  }

  return {
    items,
    totalCount,
    checkedItems,
    totalPrice,
    stockLimitOf,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleCheck,
    toggleCheckAll,
    clearChecked,
    getItemById,
    isInCart,
    clearCart
  }
})
