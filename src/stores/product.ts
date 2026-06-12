import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Product } from '@/types'
import mockProducts from '../mock/products.json'

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([...mockProducts] as Product[])

  function addProduct(product: Product) {
    product.id = `P${Date.now()}`
    product.status = 'active'
    product.createTime = new Date().toISOString()
    products.value.unshift(product)
  }

  function updateProduct(id: string, data: Partial<Product>) {
    const idx = products.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      products.value[idx] = { ...products.value[idx], ...data }
    }
  }

  function deleteProduct(id: string) {
    products.value = products.value.filter(p => p.id !== id)
  }

  function getProductById(id: string): Product | undefined {
    return products.value.find(p => p.id === id)
  }

  return { products, addProduct, updateProduct, deleteProduct, getProductById }
})
