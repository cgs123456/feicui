<template>
  <div class="section-title">转化漏斗</div>
  <div class="funnel-section card">
    <div class="funnel-item">
      <div class="funnel-bar" :style="{ width: '100%' }">
        <span class="funnel-label">浏览量</span>
        <span class="funnel-count">{{ funnelData.views }}</span>
      </div>
    </div>
    <div class="funnel-rate">
      <van-icon name="arrow-down" size="14" color="#999" />
      <span>浏览→询价：{{ funnelData.viewToInquiryRate }}%</span>
    </div>
    <div class="funnel-item">
      <div class="funnel-bar funnel-bar-inquiry" :style="{ width: funnelData.inquiryWidth + '%' }">
        <span class="funnel-label">询价数</span>
        <span class="funnel-count">{{ funnelData.inquiries }}</span>
      </div>
    </div>
    <div class="funnel-rate">
      <van-icon name="arrow-down" size="14" color="#999" />
      <span>询价→下单：{{ funnelData.inquiryToOrderRate }}%</span>
    </div>
    <div class="funnel-item">
      <div class="funnel-bar funnel-bar-order" :style="{ width: funnelData.orderWidth + '%' }">
        <span class="funnel-label">下单数</span>
        <span class="funnel-count">{{ funnelData.orders }}</span>
      </div>
    </div>
    <div class="funnel-rate">
      <van-icon name="arrow-down" size="14" color="#999" />
      <span>下单→成交：{{ funnelData.orderToCompleteRate }}%</span>
    </div>
    <div class="funnel-item">
      <div
        class="funnel-bar funnel-bar-complete"
        :style="{ width: funnelData.completeWidth + '%' }"
      >
        <span class="funnel-label">成交数</span>
        <span class="funnel-count">{{ funnelData.completed }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Order } from '@/types'
import dashboardData from '@/data/dashboard.json'

const props = defineProps<{ orders: Order[] }>()

const allOrders = computed(() => props.orders)

const completedOrders = computed(() =>
  allOrders.value.filter((o: Order) => o.status === 'completed')
)

// 转化漏斗数据
const funnelData = computed(() => {
  const views = dashboardData.todayViews || 0
  const inquiries = dashboardData.inquiries || 0
  const totalOrders = allOrders.value.length
  const completed = completedOrders.value.length

  const maxVal = Math.max(views, 1)

  const viewToInquiryRate = views > 0 ? Math.round((inquiries / views) * 100) : 0
  const inquiryToOrderRate = inquiries > 0 ? Math.round((totalOrders / inquiries) * 100) : 0
  const orderToCompleteRate = totalOrders > 0 ? Math.round((completed / totalOrders) * 100) : 0

  return {
    views,
    inquiries,
    orders: totalOrders,
    completed,
    viewToInquiryRate,
    inquiryToOrderRate,
    orderToCompleteRate,
    inquiryWidth: Math.round((inquiries / maxVal) * 100),
    orderWidth: Math.round((totalOrders / maxVal) * 100),
    completeWidth: Math.round((completed / maxVal) * 100)
  }
})
</script>

<style scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding: 16px 16px 8px;
}

/* 转化漏斗 */
.funnel-section {
  margin: 0 16px;
  padding: 16px;
}

.funnel-item {
  padding: 4px 0;
}

.funnel-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-radius: 8px;
  background: linear-gradient(90deg, #1989fa, #66b1ff);
  color: #fff;
  font-size: 14px;
  min-width: fit-content;
}

.funnel-bar-inquiry {
  background: linear-gradient(90deg, #07c160, #4cd98b);
}

.funnel-bar-order {
  background: linear-gradient(90deg, #ff9500, #ffb340);
}

.funnel-bar-complete {
  background: linear-gradient(90deg, #ff4d4f, #ff7875);
}

.funnel-label {
  font-weight: 500;
}

.funnel-count {
  font-size: 16px;
  font-weight: 700;
}

.funnel-rate {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 12px;
  color: #999;
}

.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
}
</style>
