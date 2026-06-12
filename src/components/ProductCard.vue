<template>
  <div
    class="product-card"
    role="button"
    tabindex="0"
    :aria-label="product.title"
    @click="emit('click', product.id)"
  >
    <div class="product-image">
      <van-image
        :src="product.cover"
        width="140"
        height="140"
        fit="cover"
        radius="8"
        lazy-load
        :show-error="true"
        :show-loading="true"
      />
    </div>
    <div class="product-info">
      <h3 class="product-title">{{ product.title }}</h3>
      <div class="product-meta">
        <span class="product-price">¥{{ product.price }}</span>
        <van-tag :type="statusType" :color="statusColor" size="medium" plain>
          {{ statusText }}
        </van-tag>
      </div>
      <div class="product-footer">
        <span class="product-views">
          <van-icon name="eye-o" size="12" />
          {{ product.views }}
        </span>
        <span class="product-time">{{ product.createTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@/types'

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  click: [id: string]
}>()

const statusMap: Record<string, { text: string; color: string; type: 'success' | 'default' | 'danger' }> = {
  active: { text: '在售', color: '#07C160', type: 'success' },
  sold: { text: '已售', color: '#999', type: 'default' },
  offline: { text: '下架', color: '#FF4D4F', type: 'danger' }
}

const statusText = computed(() => {
  return statusMap[props.product.status || '']?.text || props.product.status || '未知'
})

const statusColor = computed(() => {
  return statusMap[props.product.status || '']?.color || '#999'
})

const statusType = computed(() => {
  return statusMap[props.product.status || '']?.type || 'default'
})
</script>

<style scoped>
.product-card {
  display: flex;
  flex-direction: row;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  margin: 8px 16px;
  cursor: pointer;
  gap: 12px;
}

.product-image {
  flex-shrink: 0;
  width: 140px;
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.product-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.product-price {
  font-size: 18px;
  font-weight: 700;
  color: #ff4d00;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.product-views {
  display: flex;
  align-items: center;
  gap: 4px;
}

.product-time {
  color: #bbb;
}
</style>
