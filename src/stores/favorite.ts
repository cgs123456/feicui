import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Favorite } from '@/types'

const STORAGE_KEY = 'jadeite_favorites'

function loadFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveFavorites(items: Favorite[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // 与 cart/order/product store 一致：写盘失败广播给全局监听器
    window.dispatchEvent(
      new CustomEvent('storage-error', {
        detail: { message: '本地存储写入失败，请检查浏览器设置' }
      })
    )
  }
}

export const useFavoriteStore = defineStore('favorite', () => {
  const favorites = ref<Favorite[]>(loadFavorites())

  function addFavorite(params: { productId: string; title: string; cover: string; price: number }) {
    if (favorites.value.some((f: Favorite) => f.productId === params.productId)) return
    favorites.value.unshift({
      productId: params.productId,
      title: params.title,
      cover: params.cover,
      price: params.price,
      addTime: new Date().toISOString()
    })
    saveFavorites(favorites.value)
  }

  function removeFavorite(productId: string) {
    favorites.value = favorites.value.filter((f: Favorite) => f.productId !== productId)
    saveFavorites(favorites.value)
  }

  function toggleFavorite(params: {
    productId: string
    title: string
    cover: string
    price: number
  }) {
    if (isFavorite(params.productId)) {
      removeFavorite(params.productId)
    } else {
      addFavorite(params)
    }
  }

  function isFavorite(productId: string): boolean {
    return favorites.value.some((f: Favorite) => f.productId === productId)
  }

  function clearFavorites() {
    favorites.value = []
    saveFavorites([])
  }

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites
  }
})
