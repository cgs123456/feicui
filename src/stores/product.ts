import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product } from '@/types'
import mockProducts from '../mock/products.json'

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
  const products = ref<Product[]>([...mockProducts] as Product[])

  function addProduct(product: Product) {
    product.id = `P${Date.now()}`
    product.status = 'active'
    product.createTime = new Date().toISOString()
    products.value.unshift(product)
  }

  function updateProduct(id: string, data: Partial<Product>) {
    const idx = products.value.findIndex((p: Product) => p.id === id)
    if (idx !== -1) {
      products.value[idx] = { ...products.value[idx], ...data }
    }
  }

  function deleteProduct(id: string) {
    products.value = products.value.filter((p: Product) => p.id !== id)
  }

  function getProductById(id: string): Product | undefined {
    return products.value.find((p: Product) => p.id === id)
  }

  // 多条件筛选 + 排序
  function getFilteredProducts(filters: Partial<FilterParams>): Product[] {
    let list = [...products.value]

    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      list = list.filter(p =>
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
        list.sort((a, b) => new Date(b.createTime || 0).getTime() - new Date(a.createTime || 0).getTime())
        break
    }

    return list
  }

  const allCategories = computed(() => [...new Set(products.value.map((p: Product) => p.category).filter(Boolean))] as string[])
  const allMaterials = computed(() => [...new Set(products.value.map((p: Product) => p.material).filter(Boolean))] as string[])

  const priceRange = computed(() => {
    const prices = products.value.map((p: Product) => p.price)
    return { min: Math.min(...prices), max: Math.max(...prices) }
  })

  function batchUpdateStatus(ids: string[], status: 'active' | 'offline') {
    ids.forEach(id => {
      const idx = products.value.findIndex((p: Product) => p.id === id)
      if (idx !== -1) products.value[idx].status = status
    })
  }

  function batchUpdatePrice(ids: string[], priceMultiplier: number) {
    ids.forEach(id => {
      const product = products.value.find((p: Product) => p.id === id)
      if (product) {
        product.price = Math.round(product.price * priceMultiplier)
        if (product.originalPrice) {
          product.originalPrice = Math.round(product.originalPrice * priceMultiplier)
        }
      }
    })
  }

  return {
    products,
    allCategories,
    allMaterials,
    priceRange,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getFilteredProducts,
    batchUpdateStatus,
    batchUpdatePrice
  }
})
