<template>
  <div class="page-container">
    <AppNavbar
      title="商家后台"
      :right-text="userStore.userInfo.name"
      fallback="/"
      @click-right="goAccount"
    />
    <div class="dashboard-content">
      <!-- 统计卡片 -->
      <div v-if="userStore.hasPermission('analytics:view')" class="stats-grid">
        <StatCard title="商品总数" :value="productStore.products.length" icon="goods-collect-o" />
        <StatCard title="今日新增" :value="todayOrders.length" icon="add-o" color="#FF9500" />
        <StatCard
          title="成交订单"
          :value="completedOrders.length"
          icon="orders-o"
          color="#FF4D00"
        />
        <StatCard
          title="成交金额"
          :value="'¥' + formatPrice(totalRevenue)"
          icon="gold-coin-o"
          color="#FF4D00"
        />
      </div>

      <!-- 订单统计 -->
      <OrderStats v-if="userStore.hasPermission('analytics:view')" :orders="allOrders" />

      <!-- 收入摘要 -->
      <RevenueSummary v-if="userStore.hasPermission('analytics:view')" :orders="allOrders" />

      <!-- 转化漏斗 -->
      <FunnelSection v-if="userStore.hasPermission('analytics:view')" :orders="allOrders" />

      <!-- 商品热度排行 -->
      <RankList v-if="userStore.hasPermission('analytics:view')" />

      <!-- 快捷功能 -->
      <QuickActions />

      <!-- 最近消息 -->
      <RecentMessages v-if="userStore.hasPermission('customer:view')" />

      <!-- 角色切换 -->
      <RoleSwitch v-if="userStore.hasPermission('settings:manage')" />

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

<script setup lang="ts">
import { formatPrice } from '../../utils/format'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { buildMerchantIndex, orderBelongsToMerchant } from '@/utils/order'
import { DEFAULT_MERCHANT_ID } from '@/data/merchants'
import { useOrderStore } from '@/stores/order'
import { useProductStore } from '@/stores/product'
import type { Order, Product } from '@/types'
import AppNavbar from '@/components/AppNavbar.vue'
import StatCard from '@/components/StatCard.vue'
import OrderStats from './components/OrderStats.vue'
import RevenueSummary from './components/RevenueSummary.vue'
import FunnelSection from './components/FunnelSection.vue'
import RankList from './components/RankList.vue'
import QuickActions from './components/QuickActions.vue'
import RecentMessages from './components/RecentMessages.vue'
import RoleSwitch from './components/RoleSwitch.vue'

const router = useRouter()
const userStore = useUserStore()
const orderStore = useOrderStore()
const productStore = useProductStore()

const allOrders = computed(() => {
  // 商户归属过滤：server 模式镜像含买家订单，按商品归属过滤出本店口径
  const myId = userStore.userInfo.id || DEFAULT_MERCHANT_ID
  const index = buildMerchantIndex(productStore.products as Product[])
  return orderStore.getAllOrders.filter((o: Order) => orderBelongsToMerchant(o, myId, index))
})

const completedOrders = computed(() =>
  allOrders.value.filter((o: Order) => o.status === 'completed')
)

const todayOrders = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return allOrders.value.filter((o: Order) => new Date(o.createTime) >= today)
})

const totalRevenue = computed(() =>
  allOrders.value
    .filter((o: Order) => o.status === 'completed' || o.status === 'shipped')
    .reduce((sum: number, o: Order) => sum + o.totalPrice, 0)
)

function goAccount() {
  router.push('/merchant/account')
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
  max-width: 430px;
  margin: 0 auto;
}

.dashboard-content {
  padding-top: 46px;
  padding-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 12px 16px;
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
