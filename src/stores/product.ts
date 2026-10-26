import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product } from '@/types'
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

export const useProductStore = defineStore('product', () => {
  // 后端是唯一数据源：内存列表仅是镜像，进入页面时通过 syncFromServer 拉取
  const products = ref<Product[]>([])

  /** 从后端拉取全量商品覆盖内存镜像（页面挂载与商家编辑后调用） */
  async function syncFromServer() {
    products.value = await fetchProducts()
  }

  async function addProduct(product: Product) {
    const created = await createProduct(product)
    products.value.unshift(created)
  }

  async function updateProductInStore(id: string, data: Partial<Product>) {
    // 以服务端返回的权威值覆盖镜像，避免部分失败造成两端漂移
    const updated = await updateProduct(id, data)
    if (updated) replaceProductInPlace(updated)
  }

  /** 用服务端返回的商品按 id 原位替换内存镜像（找不到则前置插入） */
  function replaceProductInPlace(updated: Product) {
    const idx = products.value.findIndex((p: Product) => p.id === updated.id)
    if (idx !== -1) products.value[idx] = updated
    else products.value.unshift(updated)
  }

  async function deleteProductById(id: string) {
    await deleteProduct(id)
    products.value = products.value.filter((p: Product) => p.id !== id)
  }

  function getProductById(id: string): Product | undefined {
    return products.value.find((p: Product) => p.id === id)
  }

  /** 下单成功后同步扣减内存镜像库存；stock 为 -1 表示不限库存。权威值在后端，页面下次拉取时校正 */
  function decreaseStock(id: string, quantity: number): boolean {
    const product = products.value.find((p: Product) => p.id === id)
    if (!product) return false
    if (product.stock !== undefined && product.stock !== -1) {
      if (product.stock < quantity) return false
      product.stock -= quantity
    }
    return true
  }

  /** 详情页浏览计数：仅内存展示用（后端暂未暴露浏览量写入接口） */
  function incrementViews(id: string) {
    const product = products.value.find((p: Product) => p.id === id)
    if (product) {
      product.views = (product.views || 0) + 1
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
    // 先打服务端成功后再改本地镜像，避免部分失败造成两端漂移
    for (const id of ids) {
      const updated = await updateProduct(id, { status })
      if (updated) replaceProductInPlace(updated)
    }
  }

  async function batchUpdatePrice(ids: string[], priceMultiplier: number) {
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
  }

  /** 退出登录时清空镜像（登录后由 syncFromServer 重新拉取） */
  function resetProducts() {
    products.value = []
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
    incrementViews,
    getFilteredProducts,
    batchUpdateStatus,
    batchUpdatePrice,
    syncFromServer,
    replaceProductInPlace,
    resetProducts
  }
})
