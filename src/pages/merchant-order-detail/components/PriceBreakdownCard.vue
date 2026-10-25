<template>
  <div class="price-breakdown card">
    <div class="section-header">
      <van-icon name="gold-coin-o" size="16" />
      <span>价格明细</span>
    </div>
    <div class="price-row">
      <span>商品总额</span>
      <span>¥{{ formatPrice(totalPrice) }}</span>
    </div>
    <div class="price-row">
      <span>运费</span>
      <span>免运费</span>
    </div>
    <div class="price-row total">
      <span>实付金额</span>
      <span class="total-price">¥{{ formatPrice(totalPrice) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatPrice } from '@/utils/format'

defineProps<{
  totalPrice: number
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

/* 价格明细 */
.price-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  padding: 6px 0;
}

.price-row.total {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  border-top: 1px solid #f5f5f5;
  margin-top: 6px;
  padding-top: 10px;
}

.total-price {
  color: #ff4d00;
  font-size: 18px;
}
</style>
