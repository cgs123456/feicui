<template>
  <div class="product-list card">
    <div class="section-header">
      <van-icon name="goods-collect-o" size="16" />
      <span>商品清单</span>
    </div>
    <div v-for="item in items" :key="item.productId" class="product-item">
      <van-image :src="item.cover" width="64" height="64" fit="cover" radius="6" lazy-load />
      <div class="product-info">
        <span class="product-title">{{ item.title }}</span>
        <span class="product-price">¥{{ formatPrice(item.price) }}</span>
      </div>
      <span class="product-qty">x{{ item.quantity }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatPrice } from '@/utils/format'
import type { OrderItem } from '@/types'

defineProps<{
  items: OrderItem[]
}>()
</script>

<style scoped>
/* 区块头 */
.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f5f5f5;
}

/* 商品清单 */
.product-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.product-item + .product-item {
  border-top: 1px solid #f9f9f9;
}

.product-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-title {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price {
  font-size: 13px;
  color: #ff4d00;
}

.product-qty {
  font-size: 13px;
  color: #999;
  flex-shrink: 0;
}
</style>
