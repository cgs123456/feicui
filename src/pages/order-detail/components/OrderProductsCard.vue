<template>
  <div class="card product-card">
    <div class="card-title">
      <van-icon name="shop-o" size="18" color="#07C160" />
      <span>商品信息</span>
    </div>
    <div v-for="item in items" :key="item.productId" class="product-row">
      <van-image
        :src="thumbnail(item.cover)"
        width="72"
        height="72"
        fit="cover"
        radius="6"
        lazy-load
      />
      <div class="product-info">
        <p class="product-title">
          {{ item.title }}
        </p>
        <div class="product-bottom">
          <span class="product-price">¥{{ formatPrice(item.price) }}</span>
          <span class="product-quantity">x{{ item.quantity }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatPrice } from '@/utils/format'
import { thumbnail } from '@/utils/image'
import type { OrderItem } from '@/types'

defineProps<{
  items: OrderItem[]
}>()
</script>

<style scoped>
/* 区块头 */
.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 10px;
}

/* Product */
.product-row {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.product-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.product-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-title {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-price {
  font-size: 15px;
  font-weight: 600;
  color: #ff4d00;
}

.product-quantity {
  font-size: 12px;
  color: #999;
}
</style>
