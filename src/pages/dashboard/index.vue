<template>
  <div class="page-container">
    <AppNavbar title="商家后台" :rightText="userStore.userInfo.name" @click-right="goAccount" />
    <div class="dashboard-content">
      <div class="stats-grid">
        <StatCard title="今日浏览" :value="dashboard.todayViews" icon="eye-o" />
        <StatCard title="询价数" :value="dashboard.inquiries" icon="chat-o" />
        <StatCard title="成交订单" :value="dashboard.orders" icon="orders-o" />
        <StatCard title="成交金额" :value="'¥' + dashboard.revenue" icon="gold-coin-o" />
      </div>

      <div class="section-title">快捷功能</div>
      <div class="quick-actions">
        <div
          class="action-item card"
          role="button"
          tabindex="0"
          aria-label="发布商品"
          @click="router.push('/publish')"
        >
          <van-icon name="add-o" size="24" color="#07C160" />
          <span>发布商品</span>
        </div>
        <div
          class="action-item card"
          role="button"
          tabindex="0"
          aria-label="商品管理"
          @click="router.push('/products')"
        >
          <van-icon name="goods-collect-o" size="24" color="#07C160" />
          <span>商品管理</span>
        </div>
        <div
          class="action-item card"
          role="button"
          tabindex="0"
          aria-label="客资管理"
          @click="router.push('/customers')"
        >
          <van-icon name="friends-o" size="24" color="#07C160" />
          <span>客资管理</span>
        </div>
      </div>

      <div class="section-title">最近消息</div>
      <div class="recent-messages card">
        <CustomerCard
          v-for="msg in dashboard.recentMessages"
          :key="msg.id"
          :customer="msg"
          @click="onMsgClick(msg)"
        />
      </div>

      <div class="logout-wrap">
        <van-button
          type="danger"
          block
          round
          class="logout-btn"
          aria-label="退出登录"
          @click="handleLogout"
        >
          退出登录
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '../../stores/user'
import AppNavbar from '../../components/AppNavbar.vue'
import StatCard from '../../components/StatCard.vue'
import CustomerCard from '../../components/CustomerCard.vue'
import dashboardData from '../../mock/dashboard.json'

const router = useRouter()
const userStore = useUserStore()
const dashboard = dashboardData

function goAccount() {
  router.push('/account')
}

function onMsgClick(msg) {
  router.push(`/customers/${msg.id}`)
}

function handleLogout() {
  userStore.logout()
  showToast('已退出登录')
  router.push('/')
}
</script>

<style scoped>
.page-container {
  min-height: 100dvh;
  background: #f5f5f5;
}

.dashboard-content {
  padding-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 12px 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding: 16px 16px 8px;
}

.quick-actions {
  display: flex;
  gap: 10px;
  padding: 0 16px;
}

.action-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
}

.recent-messages {
  padding: 0;
  overflow: hidden;
}

.logout-wrap {
  margin-top: 24px;
  padding: 0 16px;
}

.logout-btn {
  height: 44px;
  font-size: 16px;
  border-radius: 20px;
}
</style>
