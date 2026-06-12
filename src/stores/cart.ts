import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem } from '@/types'

const STORAGE_KEY = 'jadeite_cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch { /* ignore */ }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(loadCart())

  const totalCount = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))

  const checkedItems = computed(() => items.value.filter(i => i.checked))

  const totalPrice = computed(() =>
    checkedItems.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
  )

  function addToCart(params: { productId: string; title: string; cover: string; price: number; quantity?: number }) {
    const exist = items.value.find(i => i.productId === params.productId)
    if (exist) {
      exist.quantity += params.quantity || 1
    } else {
      items.value.unshift({
        productId: params.productId,
        title: params.title,
        cover: params.cover,
        price: params.price,
        quantity: params.quantity || 1,
        checked: true,
        addTime: new Date().toISOString()
      })
    }
    saveCart(items.value)
  }

  function removeFromCart(productId: string) {
    items.value = items.value.filter(i => i.productId !== productId)
    saveCart(items.value)
  }

  function updateQuantity(productId: string, quantity: number) {
    const item = items.value.find(i => i.productId === productId)
    if (item && quantity > 0) {
      item.quantity = quantity
      saveCart(items.value)
    }
  }

  function toggleCheck(productId: string) {
    const item = items.value.find(i => i.productId === productId)
    if (item) {
      item.checked = !item.checked
      saveCart(items.value)
    }
  }

  function toggleCheckAll() {
    const allChecked = items.value.every(i => i.checked)
    items.value.forEach(i => { i.checked = !allChecked })
    saveCart(items.value)
  }

  function clearChecked() {
    items.value = items.value.filter(i => !i.checked)
    saveCart(items.value)
  }

  function getItemById(productId: string): CartItem | undefined {
    return items.value.find(i => i.productId === productId)
  }

  function isInCart(productId: string): boolean {
    return items.value.some(i => i.productId === productId)
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