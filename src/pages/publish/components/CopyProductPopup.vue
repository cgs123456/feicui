<template>
  <van-popup
    v-model:show="show"
    position="bottom"
    round
    :style="{ height: '60%' }"
    aria-label="复制现有商品"
  >
    <div class="copy-popup-header">选择要复制的商品</div>
    <div class="copy-popup-list">
      <div
        v-for="product in copyProductList"
        :key="product.id"
        class="copy-product-item"
        @click="emit('select', product)"
      >
        <van-image :src="product.cover" width="50" height="50" fit="cover" radius="4" />
        <div class="copy-product-info">
          <span class="copy-product-title">{{ product.title }}</span>
          <span class="copy-product-price">¥{{ formatPrice(product.price) }}</span>
        </div>
      </div>
      <div v-if="copyProductList.length === 0" class="copy-empty">暂无商品可复制</div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProductStore } from '@/stores/product'
import { formatPrice } from '@/utils/format'
import type { Product } from '@/types'

const emit = defineEmits<{
  select: [product: Product]
}>()

const show = defineModel<boolean>('show', { default: false })

const productStore = useProductStore()

const copyProductList = computed(() =>
  productStore.products.filter((p: Product) => p.status === 'active')
)
</script>

<style scoped>
/* 复制商品弹窗 */
.copy-popup-header {
  padding: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.copy-popup-list {
  padding: 8px 0;
  max-height: calc(60vh - 52px);
  overflow-y: auto;
}

.copy-product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
}

.copy-product-item:active {
  background: #f5f5f5;
}

.copy-product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.copy-product-title {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-product-price {
  font-size: 13px;
  color: #e53e3e;
  font-weight: 500;
}

.copy-empty {
  padding: 40px 16px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>
