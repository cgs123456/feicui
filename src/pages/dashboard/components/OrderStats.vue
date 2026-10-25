<template>
  <div class="section-title">订单概况</div>
  <div class="order-stats-row">
    <div class="stat-item">
      <span class="stat-num">{{ pendingOrders.length }}</span>
      <span class="stat-desc">待付款</span>
    </div>
    <div class="stat-item">
      <span class="stat-num warning">{{ paidOrders.length }}</span>
      <span class="stat-desc">待发货</span>
    </div>
    <div class="stat-item">
      <span class="stat-num info">{{ shippedOrders.length }}</span>
      <span class="stat-desc">已发货</span>
    </div>
    <div class="stat-item">
      <span class="stat-num success">{{ completedOrders.length }}</span>
      <span class="stat-desc">已完成</span>
    </div>
    <div class="stat-item">
      <span class="stat-num danger">{{ refundingOrders.length }}</span>
      <span class="stat-desc">退款中</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Order } from '@/types'

const props = defineProps<{ orders: Order[] }>()

const allOrders = computed(() => props.orders)

const pendingOrders = computed(() => allOrders.value.filter((o: Order) => o.status === 'pending'))
const paidOrders = computed(() => allOrders.value.filter((o: Order) => o.status === 'paid'))
const shippedOrders = computed(() => allOrders.value.filter((o: Order) => o.status === 'shipped'))
const completedOrders = computed(() =>
  allOrders.value.filter((o: Order) => o.status === 'completed')
)
const refundingOrders = computed(() =>
  allOrders.value.filter((o: Order) => o.status === 'refunding')
)
</script>

<style scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding: 16px 16px 8px;
}

/* 订单统计行 */
.order-stats-row {
  display: flex;
  justify-content: space-around;
  padding: 12px 16px;
  background: #fff;
  margin: 0 16px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.stat-num.warning {
  color: #ff9500;
}

.stat-num.info {
  color: #007aff;
}

.stat-num.success {
  color: #07c160;
}

.stat-num.danger {
  color: #ff4d4f;
}

.stat-desc {
  font-size: 11px;
  color: #999;
}
</style>
