<template>
  <div
    class="customer-card"
    role="button"
    tabindex="0"
    :aria-label="customer.name"
    @click="emit('click', customer.id)"
  >
    <div class="customer-avatar">
      <van-image
        :src="customer.avatar"
        width="40"
        height="40"
        fit="cover"
        round
        lazy-load
        :show-error="true"
      />
    </div>
    <div class="customer-info">
      <div class="customer-top">
        <span class="customer-name">{{ customer.name }}</span>
        <span class="customer-time">{{ customer.lastTime }}</span>
      </div>
      <div class="customer-middle">
        <span class="customer-message">{{ customer.lastMessage }}</span>
        <span v-if="unreadCount > 0" class="customer-unread">{{
          unreadCount > 99 ? '99+' : unreadCount
        }}</span>
      </div>
      <div v-if="customer.tags && customer.tags.length > 0" class="customer-tags">
        <van-tag
          v-for="(tag, index) in customer.tags"
          :key="index"
          :color="getTagColor(tag)"
          text-color="#fff"
        >
          {{ tag }}
        </van-tag>
      </div>
      <div class="customer-conversion">
        <span class="conversion-dot" :class="probabilityClass" />
        <span class="conversion-text">{{ conversionProbability }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { useConversionScore } from '../composables/useConversionScore'

/** 客资卡片数据（与 src/mock/customers.json 元素结构一致） */
interface CustomerRecord {
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastTime: string
  tags: string[]
  unread?: number
  status: string
  views: number
  inquiries: number
}

const props = defineProps({
  customer: {
    type: Object as PropType<CustomerRecord>,
    default: () => ({
      id: '',
      name: '',
      avatar: '',
      lastMessage: '',
      lastTime: '',
      tags: [],
      unread: 0,
      status: '',
      views: 0,
      inquiries: 0
    })
  }
})

const emit = defineEmits(['click'])

const unreadCount = computed(() => props.customer.unread ?? 0)

// 成交概率评分（客户模块共用规则）
const { conversionProbability, probabilityClass } = useConversionScore(() => props.customer)

// 标签颜色
const getTagColor = (tag: string): string => {
  if (tag.includes('已成交')) return '#07C160'
  if (tag.includes('VIP') || tag.includes('vip')) return '#D4A84B'
  if (tag.includes('意向高') || tag.includes('高意向')) return '#1989FA'
  if (tag.includes('意向中')) return '#FF9500'
  if (tag.includes('批发')) return '#9B59B6'
  return '#999'
}
</script>

<style scoped>
.customer-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: #fff;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.customer-card:active {
  transform: scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .customer-card {
    transition: none;
  }

  .customer-card:active {
    transform: none;
  }
}

.customer-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
}

.customer-info {
  flex: 1;
  min-width: 0;
}

.customer-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.customer-name {
  font-size: 15px;
  font-weight: 700;
  color: #333;
}

.customer-time {
  font-size: 12px;
  color: #bbb;
  flex-shrink: 0;
  margin-left: 8px;
}

.customer-middle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.customer-message {
  font-size: 13px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  margin-right: 8px;
}

.customer-unread {
  flex-shrink: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #ff4d4f;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.customer-tags {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.customer-conversion {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
}

.conversion-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.conversion-dot.prob-high {
  background: #07c160;
}

.conversion-dot.prob-mid {
  background: #ff9500;
}

.conversion-dot.prob-low {
  background: #ff4d4f;
}

.conversion-text {
  font-size: 11px;
  color: #999;
}
</style>
