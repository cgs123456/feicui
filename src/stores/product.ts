import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product } from '@/types'
import mockProducts from '../mock/products.json'
import { USE_MOCK } from '../utils/env'
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../api/product'

export type SortField = 'price-asc' | 'price-desc' | 'views' | 'newest'
export type FilterParams = {
  keyword: string
  category: string
  material: string
  priceMin: number | null
  priceMax: number | null
  status: string
  sort: SortField
}

const PRODUCT_STORAGE_KEY = 'jadeite_products'

function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCT_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as Product[]
    }
  } catch {
    // 损坏数据回退 mock
  }
  // 深拷贝：mock JSON 是模块级单例，浅拷贝会让 store 的库存/状态变更污染后续实例
  return JSON.parse(JSON.stringify(mockProducts)) as Product[]
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>(loadProducts())

  function saveProducts() {
    if (!USE_MOCK) return // server 模式下持久化在后端，内存仅是镜像
    try {
      localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products.value))
    } catch {
      // localStorage 写入失败时通知用户
      window.dispatchEvent(
        new CustomEvent('storage-error', {
          detail: { message: '本地存储写入失败，请检查浏览器设置' }
        })
      )
    }
  }

  /** server 模式：从后端拉取全量商品覆盖内存镜像（启动与商家编辑后调用） */
  async function syncFromServer() {
    if (USE_MOCK) return
    products.value = await fetchProducts()
  }

  async function addProduct(product: Product) {
    if (!USE_MOCK) {
      const created = await createProduct(product)
      products.value.unshift(created)
      return
    }
    product.id = `P${Date.now()}`
    product.status = 'active'
    product.createTime = new Date().toISOString()
    products.value.unshift(product)
    saveProducts()
  }

  async function updateProductInStore(id: string, data: Partial<Product>) {
    if (!USE_MOCK) {
      // 以服务端返回的权威值覆盖镜像，避免部分失败造成两端漂移
      const updated = await updateProduct(id, data)
      if (updated) replaceProductInPlace(updated)
      return
    }
    const idx = products.value.findIndex((p: Product) => p.id === id)
    if (idx !== -1) {
      products.value[idx] = { ...products.value[idx], ...data }
      saveProducts()
    }
  }

  /** 用服务端返回的商品按 id 原位替换内存镜像（找不到则前置插入） */
  function replaceProductInPlace(updated: Product) {
    const idx = products.value.findIndex((p: Product) => p.id === updated.id)
    if (idx !== -1) products.value[idx] = updated
    else products.value.unshift(updated)
  }

  async function deleteProductById(id: string) {
    if (!USE_MOCK) await deleteProduct(id)
    products.value = products.value.filter((p: Product) => p.id !== id)
    saveProducts()
  }

  function getProductById(id: string): Product | undefined {
    return products.value.find((p: Product) => p.id === id)
  }

  /** 下单扣减库存；stock 为 -1 表示不限库存；skipPersist 供批量扣减后统一落盘 */
  function decreaseStock(id: string, quantity: number, skipPersist = false): boolean {
    const product = products.value.find((p: Product) => p.id === id)
    if (!product) return false
    if (product.stock !== undefined && product.stock !== -1) {
      if (product.stock < quantity) return false
      product.stock -= quantity
      if (!skipPersist) saveProducts()
    }
    return true
  }

  let viewsPersistTimer: ReturnType<typeof setTimeout> | null = null

  /** 退款/取消订单回补库存（与 decreaseStock 对称） */
  function increaseStock(id: string, quantity: number) {
    const product = products.value.find((p: Product) => p.id === id)
    if (product && product.stock !== undefined && product.stock !== -1) {
      product.stock += quantity
      saveProducts()
    }
  }
  /** 详情页浏览计数：内存累加 + 2s 防抖落盘，避免每次浏览全量 stringify */
  function incrementViews(id: string) {
    const product = products.value.find((p: Product) => p.id === id)
    if (product) {
      product.views = (product.views || 0) + 1
      if (viewsPersistTimer) clearTimeout(viewsPersistTimer)
      viewsPersistTimer = setTimeout(saveProducts, 2000)
    }
  }

  // 多条件筛选 + 排序
  function getFilteredProducts(filters: Partial<FilterParams>): Product[] {
    let list = [...products.value]

    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      list = list.filter(
        p =>
          p.title.toLowerCase().includes(kw) ||
          (p.category && p.category.includes(kw)) ||
          (p.material && p.material.includes(kw)) ||
          (p.description && p.description.toLowerCase().includes(kw))
      )
    }

    if (filters.category) {
      list = list.filter(p => p.category === filters.category)
    }

    if (filters.material) {
      list = list.filter(p => p.material === filters.material)
    }

    if (filters.priceMin !== null && filters.priceMin !== undefined) {
      list = list.filter(p => p.price >= filters.priceMin!)
    }

    if (filters.priceMax !== null && filters.priceMax !== undefined) {
      list = list.filter(p => p.price <= filters.priceMax!)
    }

    if (filters.status && filters.status !== 'all') {
      list = list.filter(p => p.status === filters.status)
    }

    // 排序
    const sort = filters.sort || 'newest'
    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'views':
        list.sort((a, b) => (b.views || 0) - (a.views || 0))
        break
      case 'newest':
      default:
        list.sort(
          (a, b) => new Date(b.createTime || 0).getTime() - new Date(a.createTime || 0).getTime()
        )
        break
    }

    return list
  }

  const allCategories = computed(
    () => [...new Set(products.value.map((p: Product) => p.category).filter(Boolean))] as string[]
  )
  const allMaterials = computed(
    () => [...new Set(products.value.map((p: Product) => p.material).filter(Boolean))] as string[]
  )

  const priceRange = computed(() => {
    const prices = products.value.map((p: Product) => p.price)
    if (prices.length === 0) return { min: 0, max: 0 }
    return { min: Math.min(...prices), max: Math.max(...prices) }
  })

  async function batchUpdateStatus(ids: string[], status: 'active' | 'offline') {
    // server 模式：先打服务端成功后再改本地镜像，避免部分失败造成两端漂移
    if (!USE_MOCK) {
      for (const id of ids) {
        const updated = await updateProduct(id, { status })
        if (updated) replaceProductInPlace(updated)
      }
      return
    }
    for (const id of ids) {
      const idx = products.value.findIndex((p: Product) => p.id === id)
      if (idx !== -1) products.value[idx].status = status
    }
    saveProducts()
  }

  async function batchUpdatePrice(ids: string[], priceMultiplier: number) {
    if (!USE_MOCK) {
      for (const id of ids) {
        const target = products.value.find((p: Product) => p.id === id)
        if (!target) continue
        const payload = {
          price: Math.round(target.price * priceMultiplier),
          originalPrice: target.originalPrice
            ? Math.round(target.originalPrice * priceMultiplier)
            : undefined
        }
        const updated = await updateProduct(id, payload)
        if (updated) replaceProductInPlace(updated)
      }
      return
    }
    for (const id of ids) {
      const product = products.value.find((p: Product) => p.id === id)
      if (product) {
        product.price = Math.round(product.price * priceMultiplier)
        if (product.originalPrice) {
          product.originalPrice = Math.round(product.originalPrice * priceMultiplier)
        }
      }
    }
    saveProducts()
  }

  /** 退出登录时重置到 mock 初始目录（内存 + 持久化同步清除；清防抖 timer 防止退出后把旧数据写回） */
  function resetProducts() {
    if (viewsPersistTimer !== null) {
      clearTimeout(viewsPersistTimer)
      viewsPersistTimer = null
    }
    products.value = JSON.parse(JSON.stringify(mockProducts)) as Product[]
    localStorage.removeItem(PRODUCT_STORAGE_KEY)
  }

  return {
    products,
    allCategories,
    allMaterials,
    priceRange,
    addProduct,
    updateProduct: updateProductInStore,
    deleteProduct: deleteProductById,
    getProductById,
    decreaseStock,
    increaseStock,
    incrementViews,
    getFilteredProducts,
    batchUpdateStatus,
    batchUpdatePrice,
    saveProducts,
    syncFromServer,
    replaceProductInPlace,
    resetProducts
  }
})
