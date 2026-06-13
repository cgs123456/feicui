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
        :src="thumbnail(product.cover)"
        width="140"
        height="140"
        fit="cover"
        radius="8"
        lazy-load
        :show-error="true"
        :show-loading="true"
      />
      <span v-if="aiScore !== undefined" class="ai-score-badge">匹配 {{ aiScore }}分</span>
    </div>
    <div class="product-info">
      <h3 class="product-title">{{ product.title }}</h3>
      <div class="product-meta">
        <span class="product-price">¥{{ product.price }}</span>
        <van-tag :type="statusType" :color="statusColor" size="medium" plain>
          {{ statusText }}
        </van-tag>
      </div>
      <div v-if="aiReasons && aiReasons.length > 0" class="ai-reasons">
        <span v-for="(reason, idx) in aiReasons" :key="idx" class="ai-reason-tag">
          {{ reason }}
        </span>
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
import { thumbnail } from '@/utils/image'

const props = withDefaults(
  defineProps<{
    product: Product
    aiScore?: number
    aiReasons?: string[]
  }>(),
  {
    aiScore: undefined,
    aiReasons: undefined
  }
)

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
  align-items: stretch;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  margin: 8px 16px;
  cursor: pointer;
  gap: 12px;
  min-height: 164px;
}

.product-image {
  flex-shrink: 0;
  width: 140px;
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.ai-score-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  background: #07c160;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  z-index: 1;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  min-height: 140px;
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

.ai-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.ai-reason-tag {
  font-size: 10px;
  color: #07c160;
  background: #e8f8ef;
  padding: 2px 6px;
  border-radius: 4px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 8px;
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
