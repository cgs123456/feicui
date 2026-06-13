<template>
  <div class="page-container">
    <AppNavbar title="商家后台" :rightText="userStore.userInfo.name" @click-right="goAccount" fallback="/" />
    <div class="dashboard-content">
      <!-- 统计卡片 -->
      <div class="stats-grid" v-if="userStore.hasPermission('analytics:view')">
        <StatCard title="商品总数" :value="productStore.products.length" icon="goods-collect-o" />
        <StatCard title="今日新增" :value="todayOrders.length" icon="add-o" color="#FF9500" />
        <StatCard title="成交订单" :value="completedOrders.length" icon="orders-o" color="#FF4D00" />
        <StatCard title="成交金额" :value="'¥' + totalRevenue.toLocaleString()" icon="gold-coin-o" color="#FF4D00" />
      </div>

      <!-- 订单统计 -->
      <div v-if="userStore.hasPermission('analytics:view')" class="section-title">订单概况</div>
      <div v-if="userStore.hasPermission('analytics:view')" class="order-stats-row">
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

      <!-- 收入摘要 -->
      <div v-if="userStore.hasPermission('analytics:view')" class="section-title">收入摘要</div>
      <div v-if="userStore.hasPermission('analytics:view')" class="revenue-summary card">
        <div class="revenue-row">
          <span>今日收入</span>
          <span class="revenue-value">¥{{ todayRevenue.toLocaleString() }}</span>
        </div>
        <div class="revenue-row">
          <span>本周收入</span>
          <span class="revenue-value">¥{{ weekRevenue.toLocaleString() }}</span>
        </div>
        <div class="revenue-row">
          <span>本月收入</span>
          <span class="revenue-value">¥{{ monthRevenue.toLocaleString() }}</span>
        </div>
      </div>

      <!-- 转化漏斗 -->
      <div v-if="userStore.hasPermission('analytics:view')" class="section-title">转化漏斗</div>
      <div v-if="userStore.hasPermission('analytics:view')" class="funnel-section card">
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
          <div class="funnel-bar funnel-bar-complete" :style="{ width: funnelData.completeWidth + '%' }">
            <span class="funnel-label">成交数</span>
            <span class="funnel-count">{{ funnelData.completed }}</span>
          </div>
        </div>
      </div>

      <!-- 商品热度排行 -->
      <div v-if="userStore.hasPermission('analytics:view')" class="section-title">商品热度排行</div>
      <div v-if="userStore.hasPermission('analytics:view')" class="ranking-section card">
        <div
          v-for="(product, idx) in topProducts"
          :key="product.id"
          class="ranking-item"
          @click="router.push('/product/' + product.id)"
        >
          <div class="rank-badge" :class="'rank-' + rankClass(idx)">
            <span v-if="idx < 3" class="rank-medal">{{ rankMedals[idx] }}</span>
            <span v-else class="rank-num">{{ idx + 1 }}</span>
          </div>
          <div class="rank-product-info">
            <span class="rank-product-title">{{ product.title }}</span>
            <span class="rank-product-price">¥{{ (product.price || 0).toLocaleString() }}</span>
          </div>
          <div class="rank-views">
            <van-icon name="eye-o" size="14" color="#999" />
            <span>{{ (product.views || 0).toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- 快捷功能 -->
      <div class="section-title">快捷功能</div>
      <div class="quick-actions">
        <div
          v-if="userStore.hasPermission('product:manage')"
          class="action-item card"
          role="button"
          tabindex="0"
          aria-label="发布商品"
          @click="router.push('/merchant/publish')"
        >
          <van-icon name="add-o" size="24" color="#07C160" />
          <span>发布商品</span>
        </div>
        <div
          v-if="userStore.hasPermission('product:manage')"
          class="action-item card"
          role="button"
          tabindex="0"
          aria-label="商品管理"
          @click="router.push('/merchant/products')"
        >
          <van-icon name="goods-collect-o" size="24" color="#07C160" />
          <span>商品管理</span>
        </div>
        <div
          v-if="userStore.hasPermission('customer:view')"
          class="action-item card"
          role="button"
          tabindex="0"
          aria-label="客资管理"
          @click="router.push('/merchant/customers')"
        >
          <van-icon name="friends-o" size="24" color="#07C160" />
          <span>客资管理</span>
        </div>
        <div
          v-if="userStore.hasPermission('order:manage')"
          class="action-item card"
          role="button"
          tabindex="0"
          aria-label="订单管理"
          @click="router.push('/merchant/orders')"
        >
          <van-icon name="orders-o" size="24" color="#07C160" />
          <span>订单管理</span>
        </div>
      </div>

      <!-- 最近消息 -->
      <div v-if="userStore.hasPermission('customer:view')" class="section-title">最近消息</div>
      <div v-if="userStore.hasPermission('customer:view')" class="recent-messages card">
        <CustomerCard
          v-for="msg in dashboardData.recentMessages"
          :key="msg.id"
          :customer="msg"
          @click="onMsgClick(msg)"
        />
      </div>

      <!-- 角色切换 -->
      <div v-if="userStore.hasPermission('settings:manage')" class="section-title">角色管理</div>
      <div v-if="userStore.hasPermission('settings:manage')" class="role-switch card">
        <div class="role-label">当前角色：{{ roleLabel }}</div>
        <van-radio-group v-model="currentRole" direction="horizontal" @change="onRoleChange">
          <van-radio name="owner">店长</van-radio>
          <van-radio name="manager">经理</van-radio>
          <van-radio name="staff">员工</van-radio>
        </van-radio-group>
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

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { useOrderStore } from '@/stores/order'
import { useProductStore } from '@/stores/product'
import type { Order, MerchantRole } from '@/types'
import AppNavbar from '@/components/AppNavbar.vue'
import StatCard from '@/components/StatCard.vue'
import CustomerCard from '@/components/CustomerCard.vue'
import dashboardData from '@/mock/dashboard.json'

const router = useRouter()
const userStore = useUserStore()
const orderStore = useOrderStore()
const productStore = useProductStore()

const currentRole = ref<MerchantRole>(userStore.merchantRole)

const roleLabel = computed(() => {
  const labels: Record<MerchantRole, string> = {
    owner: '店长',
    manager: '经理',
    staff: '员工'
  }
  return labels[currentRole.value] || '未知'
})

const allOrders = computed(() => orderStore.getAllOrders)

const pendingOrders = computed(() => allOrders.value.filter((o: Order) => o.status === 'pending'))
const paidOrders = computed(() => allOrders.value.filter((o: Order) => o.status === 'paid'))
const shippedOrders = computed(() => allOrders.value.filter((o: Order) => o.status === 'shipped'))
const completedOrders = computed(() => allOrders.value.filter((o: Order) => o.status === 'completed'))
const refundingOrders = computed(() => allOrders.value.filter((o: Order) => o.status === 'refunding'))

const totalRevenue = computed(() =>
  allOrders.value
    .filter((o: Order) => o.status === 'completed' || o.status === 'shipped')
    .reduce((sum: number, o: Order) => sum + o.totalPrice, 0)
)

const todayOrders = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return allOrders.value.filter((o: Order) => new Date(o.createTime) >= today)
})

const isToday = (iso: string): boolean => {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
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
  allOrders.value.filter((o: Order) => o.status === 'paid' || o.status === 'shipped' || o.status === 'completed')
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

// 商品热度排行
const topProducts = computed(() => {
  return [...productStore.products]
    .sort((a, b) => (b.popularity || b.views || 0) - (a.popularity || a.views || 0))
    .slice(0, 5)
})

const rankMedals = ['🥇', '🥈', '🥉']

const rankClass = (idx: number): string => {
  if (idx === 0) return 'gold'
  if (idx === 1) return 'silver'
  if (idx === 2) return 'bronze'
  return 'normal'
}

function goAccount() {
  router.push('/merchant/account')
}

function onMsgClick(msg: { id: string }) {
  router.push(`/merchant/customers/${msg.id}`)
}

function handleLogout() {
  userStore.logout()
  showToast('已退出登录')
  router.push('/')
}

function onRoleChange(role: MerchantRole) {
  userStore.setMerchantRole(role)
  showToast(`已切换为${roleLabel.value}`)
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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

.stat-num.warning { color: #FF9500; }
.stat-num.info { color: #007AFF; }
.stat-num.success { color: #07C160; }
.stat-num.danger { color: #FF4D4F; }

.stat-desc {
  font-size: 11px;
  color: #999;
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
  background: linear-gradient(90deg, #1989FA, #66B1FF);
  color: #fff;
  font-size: 14px;
  min-width: fit-content;
}

.funnel-bar-inquiry {
  background: linear-gradient(90deg, #07C160, #4CD98B);
}

.funnel-bar-order {
  background: linear-gradient(90deg, #FF9500, #FFB340);
}

.funnel-bar-complete {
  background: linear-gradient(90deg, #FF4D4F, #FF7875);
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

/* 商品热度排行 */
.ranking-section {
  margin: 0 16px;
  padding: 4px 0;
  overflow: hidden;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
}

.ranking-item + .ranking-item {
  border-top: 1px solid #f5f5f5;
}

.rank-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rank-badge.rank-gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
}

.rank-badge.rank-silver {
  background: linear-gradient(135deg, #C0C0C0, #A8A8A8);
}

.rank-badge.rank-bronze {
  background: linear-gradient(135deg, #CD7F32, #B87333);
}

.rank-badge.rank-normal {
  background: #f5f5f5;
}

.rank-medal {
  font-size: 20px;
}

.rank-num {
  font-size: 14px;
  font-weight: 600;
  color: #999;
}

.rank-product-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rank-product-title {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-product-price {
  font-size: 13px;
  color: #ff4d00;
  font-weight: 600;
}

.rank-views {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

/* 快捷功能 */
.quick-actions {
  display: flex;
  gap: 10px;
  padding: 0 16px;
  flex-wrap: wrap;
}

.action-item {
  flex: 1;
  min-width: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
}

/* 最近消息 */
.recent-messages {
  padding: 0;
  overflow: hidden;
  margin: 0 16px;
}

/* 角色切换 */
.role-switch {
  margin: 0 16px;
}

.role-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.role-switch :deep(.van-radio-group) {
  display: flex;
  gap: 16px;
}

.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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