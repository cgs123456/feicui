<template>
  <div class="section-title">最近消息</div>
  <div class="recent-messages card">
    <CustomerCard v-for="msg in cards" :key="msg.id" :customer="msg" @click="onMsgClick(msg)" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import CustomerCard from '@/components/CustomerCard.vue'
import dashboardData from '@/mock/dashboard.json'

interface DashboardMessage {
  id: string
  name: string
  avatar: string
  lastMessage: string
  time: string
  unread?: number
}

// CustomerCard 需要 lastTime/tags/status/views/inquiries 完整字段，看板消息按空值补齐
const cards = computed(() =>
  (dashboardData.recentMessages as DashboardMessage[]).map(m => ({
    ...m,
    lastTime: m.time,
    tags: [] as string[],
    status: '',
    views: 0,
    inquiries: 0
  }))
)

const router = useRouter()

function onMsgClick(msg: { id: string }) {
  router.push(`/merchant/customers/${msg.id}`)
}
</script>

<style scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding: 16px 16px 8px;
}

/* 最近消息 */
.recent-messages {
  padding: 0;
  overflow: hidden;
  margin: 0 16px;
}

.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
}
</style>
