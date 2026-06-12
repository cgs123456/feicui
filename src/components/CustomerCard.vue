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
        <span v-if="customer.unread > 0" class="customer-unread">{{
          customer.unread > 99 ? '99+' : customer.unread
        }}</span>
      </div>
      <div class="customer-tags" v-if="customer.tags && customer.tags.length > 0">
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
import { computed } from 'vue'

const props = defineProps({
  customer: {
    type: Object,
    required: true,
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

// 成交概率评分
const conversionProbability = computed(() => {
  const c = props.customer as any
  const status = c.status || ''
  const tags: string[] = c.tags || []

  if (status === '已成交') return 100
  if (status === '跟进中') {
    if (tags.some((t: string) => t.includes('高意向') || t.includes('意向高'))) return 75
    if (tags.some((t: string) => t.includes('意向中'))) return 50
    if (tags.some((t: string) => t.includes('批发'))) return 60
    if (tags.some((t: string) => t.includes('已成交'))) return 85
    return 35
  }
  return 20
})

const probabilityClass = computed(() => {
  const p = conversionProbability.value
  if (p >= 70) return 'prob-high'
  if (p >= 40) return 'prob-mid'
  return 'prob-low'
})

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
  background: #07C160;
}

.conversion-dot.prob-mid {
  background: #FF9500;
}

.conversion-dot.prob-low {
  background: #FF4D4F;
}

.conversion-text {
  font-size: 11px;
  color: #999;
}
</style>
