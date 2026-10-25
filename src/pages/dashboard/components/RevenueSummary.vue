<template>
  <div class="section-title">收入摘要</div>
  <div class="revenue-summary card">
    <div class="revenue-row">
      <span>今日收入</span>
      <span class="revenue-value">¥{{ formatPrice(todayRevenue) }}</span>
    </div>
    <div class="revenue-row">
      <span>本周收入</span>
      <span class="revenue-value">¥{{ formatPrice(weekRevenue) }}</span>
    </div>
    <div class="revenue-row">
      <span>本月收入</span>
      <span class="revenue-value">¥{{ formatPrice(monthRevenue) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatPrice } from '@/utils/format'
import { computed } from 'vue'
import type { Order } from '@/types'

const props = defineProps<{ orders: Order[] }>()

const allOrders = computed(() => props.orders)

const isToday = (iso: string): boolean => {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

const isThisWeek = (iso: string): boolean => {
  const d = new Date(iso)
  const now = new Date()
  const dayOfWeek = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - dayOfWeek + 1)
  monday.setHours(0, 0, 0, 0)
  return d >= monday
}

const isThisMonth = (iso: string): boolean => {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

const paidOrShippedOrCompleted = computed(() =>
  allOrders.value.filter(
    (o: Order) => o.status === 'paid' || o.status === 'shipped' || o.status === 'completed'
  )
)

const todayRevenue = computed(() =>
  paidOrShippedOrCompleted.value
    .filter((o: Order) => o.payTime && isToday(o.payTime))
    .reduce((sum: number, o: Order) => sum + o.totalPrice, 0)
)

const weekRevenue = computed(() =>
  paidOrShippedOrCompleted.value
    .filter((o: Order) => o.payTime && isThisWeek(o.payTime))
    .reduce((sum: number, o: Order) => sum + o.totalPrice, 0)
)

const monthRevenue = computed(() =>
  paidOrShippedOrCompleted.value
    .filter((o: Order) => o.payTime && isThisMonth(o.payTime))
    .reduce((sum: number, o: Order) => sum + o.totalPrice, 0)
)
</script>

<style scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding: 16px 16px 8px;
}

/* 收入摘要 */
.revenue-summary {
  margin: 0 16px;
}

.revenue-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  font-size: 14px;
  color: #333;
}

.revenue-row + .revenue-row {
  border-top: 1px solid #f5f5f5;
}

.revenue-value {
  font-size: 16px;
  font-weight: 700;
  color: #ff4d00;
}

.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
}
</style>
