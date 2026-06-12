<template>
  <div class="page-container">
    <AppNavbar title="客户详情" @click-left="goBack" />
    <div v-if="customer">
      <div class="card customer-info-card">
        <div class="customer-header">
          <van-image
            :src="customer.avatar"
            width="60"
            lazy-load
            height="60"
            fit="cover"
            round
            class="customer-avatar"
          />
          <div class="customer-meta">
            <h3 class="customer-name">{{ customer.name }}</h3>
            <p class="customer-phone">{{ customer.phone }}</p>
            <div class="customer-tags-row">
              <span class="tag tag-source">{{ customer.source }}</span>
              <span class="tag" :class="statusTagClass">
                {{ customer.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="card stats-card">
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-num">{{ stats.views }}</span>
            <span class="stat-label">浏览次数</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ stats.inquiries }}</span>
            <span class="stat-label">询价次数</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ stats.messages }}</span>
            <span class="stat-label">沟通次数</span>
          </div>
        </div>
      </div>

      <div class="section-title">沟通记录</div>
      <div class="conversation-timeline card" v-if="customer.conversation">
        <div
          v-for="(msg, idx) in customer.conversation"
          :key="idx"
          class="chat-row"
          :class="msg.role === 'merchant' ? 'chat-right' : 'chat-left'"
        >
          <div
            class="chat-bubble"
            :class="msg.role === 'merchant' ? 'merchant-bubble' : 'customer-bubble'"
          >
            <p class="chat-text">{{ msg.content }}</p>
            <span class="chat-time">{{ msg.time }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <van-button icon="phone-o" round class="call-btn" @click="callCustomer" />
      <van-button type="primary" round class="msg-btn" @click="sendMessage">发送消息</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
import { showToast } from 'vant'
import AppNavbar from '../../components/AppNavbar.vue'
import customerData from '../../mock/customers.json'

const router = useRouter()
const route = useRoute()

const customer = computed(() => {
  return customerData.find(c => c.id === route.params.id)
})

// 路由参数变化时重新加载（组件复用场景）
onBeforeRouteUpdate(to => {
  // computed 自动响应 route.params.id 变化，此处做边界处理
  if (!customerData.find(c => c.id === to.params.id)) {
    showToast('客户不存在')
    router.replace('/customers')
  }
})

const stats = computed(() => {
  if (!customer.value) return { views: 0, inquiries: 0, messages: 0 }
  return {
    views: customer.value.views || 0,
    inquiries: customer.value.inquiries || 0,
    messages: customer.value.conversation ? customer.value.conversation.length : 0
  }
})

const statusTagClass = computed(() => {
  const s = customer.value?.status || ''
  if (s === '已成交') return 'tag-jade'
  if (s === '跟进中') return 'tag-warning'
  return 'tag-outline'
})

function callCustomer() {
  showToast('拨打电话中...')
}

function sendMessage() {
  showToast('打开聊天窗口')
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.page-container {
  min-height: 100dvh;
  background: #f5f5f5;
  padding-bottom: 70px;
}

.customer-info-card {
  padding: 20px;
}

.customer-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.customer-avatar {
  flex-shrink: 0;
}

.customer-meta {
  flex: 1;
  min-width: 0;
}

.customer-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.customer-phone {
  font-size: 13px;
  color: #999;
  margin-top: 2px;
}

.customer-tags-row {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.tag-source {
  background: #e8f8ee;
  color: #07c160;
}

.tag-jade {
  background: #e8f8ee;
  color: #07c160;
}

.tag-warning {
  background: #fff7e6;
  color: #e6a23c;
}

.tag-outline {
  background: #f5f5f5;
  color: #999;
}

.stats-card {
  padding: 16px 20px;
}

.stats-row {
  display: flex;
  justify-content: space-around;
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

.stat-label {
  font-size: 12px;
  color: #999;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  padding: 16px 16px 8px;
}

.conversation-timeline {
  padding: 16px;
}

.chat-row {
  display: flex;
  margin-bottom: 16px;
}

.chat-left {
  justify-content: flex-start;
}

.chat-right {
  justify-content: flex-end;
}

.chat-bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 12px;
  position: relative;
}

.customer-bubble {
  background: #fff;
  color: #333;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 4px 14px 14px 14px;
}

.merchant-bubble {
  background: #07c160;
  color: #fff;
  border-radius: 14px 4px 14px 14px;
}

.chat-text {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.chat-time {
  font-size: 10px;
  margin-top: 4px;
  display: block;
  opacity: 0.7;
}

.customer-bubble .chat-time {
  text-align: right;
  color: #bbb;
}

.merchant-bubble .chat-time {
  text-align: right;
  color: rgba(255, 255, 255, 0.8);
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  background: #fff;
  border-top: 1px solid #eee;
  padding: 8px 16px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  display: flex;
  gap: 12px;
  align-items: center;
  z-index: 100;
}

.call-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
  color: #07c160;
  border-color: #07c160;
}

.msg-btn {
  flex: 1;
  border-radius: 20px;
  height: 44px;
}
</style>
