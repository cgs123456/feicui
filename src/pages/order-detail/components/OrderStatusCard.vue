<template>
  <div class="status-card">
    <div class="status-header">
      <van-tag :type="statusTag.type" size="large">
        {{ statusTag.text }}
      </van-tag>
      <span v-if="order.status === 'refunding'" class="refund-reason">
        退款原因：{{ order.refundReason }}
      </span>
    </div>
    <van-steps :active="stepIndex" active-color="#07C160" inactive-color="#ddd">
      <van-step>待付款</van-step>
      <van-step>待发货</van-step>
      <van-step>待收货</van-step>
      <van-step>已完成</van-step>
    </van-steps>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '@/types'

defineProps<{
  order: Order
  statusTag: { text: string; type: 'warning' | 'primary' | 'success' | 'default' | 'danger' }
  stepIndex: number
}>()
</script>

<style scoped>
/* Status */
.status-card {
  background: #fff;
  border-radius: 10px;
  margin: 8px 16px;
  padding: 16px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 4%);
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.refund-reason {
  font-size: 12px;
  color: #ff4d4f;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
