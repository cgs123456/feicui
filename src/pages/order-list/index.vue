<template>
  <div class="order-list-page">
    <AppNavbar title="我的订单" @click-left="router.back" />

    <van-tabs
      v-model:active="activeTab"
      sticky
      offset-top="46px"
      color="#07C160"
      title-active-color="#07C160"
      class="order-tabs"
    >
      <van-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
    </van-tabs>

    <div class="order-list" v-if="filteredOrders.length > 0">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="order-card"
        @click="goDetail(order.id)"
      >
        <div class="order-header">
          <span class="order-no">订单号：{{ order.orderNo }}</span>
          <van-tag :type="getStatusTag(order.status).type" size="medium">
            {{ getStatusTag(order.status).text }}
          </van-tag>
        </div>

        <div
          v-for="item in order.items"
          :key="item.productId"
          class="order-product"
        >
          <van-image
            :src="item.cover"
            width="72"
            height="72"
            fit="cover"
            radius="6"
            lazy-load
          />
          <div class="product-info">
            <p class="product-title">{{ item.title }}</p>
            <p class="product-price">¥{{ (item.price || 0).toLocaleString() }}</p>
            <p class="product-quantity">x{{ item.quantity }}</p>
          </div>
        </div>

        <div class="order-footer">
          <span class="order-total">
            共{{ getTotalQuantity(order) }}件商品 合计：
            <span class="total-price">¥{{ (order.totalPrice || 0).toLocaleString() }}</span>
          </span>
        </div>

        <div class="order-time">{{ formatTime(order.createTime) }}</div>

        <div class="order-actions" v-if="order.status !== 'cancelled' && order.status !== 'refunded'">
          <van-button
            v-if="order.status === 'pending'"
            size="small"
            plain
            type="default"
            @click.stop="handleCancel(order)"
          >
            取消订单
          </van-button>
          <van-button
            v-if="order.status === 'pending'"
            size="small"
            type="primary"
            @click.stop="handlePay(order)"
          >
            去支付
          </van-button>
          <van-button
            v-if="order.status === 'shipped'"
            size="small"
            plain
            type="default"
            @click.stop="handleRefund(order)"
          >
            申请退款
          </van-button>
          <van-button
            v-if="order.status === 'shipped'"
            size="small"
            type="primary"
            @click.stop="handleConfirm(order)"
          >
            确认收货
          </van-button>
          <van-button
            v-if="order.status === 'completed'"
            size="small"
            plain
            type="default"
            @click.stop="handleRefund(order)"
          >
            申请退款
          </van-button>
        </div>
      </div>
    </div>

    <EmptyState v-else description="暂无订单" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { useOrderStore } from '../../stores/order'
import { thumbnail } from '@/utils/image'
import { useUserStore } from '../../stores/user'
import type { Order, OrderStatus, OrderItem } from '../../types'
import AppNavbar from '../../components/AppNavbar.vue'
import EmptyState from '../../components/EmptyState.vue'

const router = useRouter()
const orderStore = useOrderStore()
const userStore = useUserStore()

const activeTab = ref(0)

const tabs = [
  { key: 'all', title: '全部' },
  { key: 'pending', title: '待付款' },
  { key: 'paid', title: '已付款' },
  { key: 'shipped', title: '已发货' },
  { key: 'completed', title: '已完成' },
  { key: 'refunding', title: '退换货' }
]

const statusTagMap: Record<string, { text: string; type: 'warning' | 'primary' | 'success' | 'default' | 'danger' }> = {
  pending: { text: '待付款', type: 'warning' },
  paid: { text: '已付款', type: 'primary' },
  shipped: { text: '已发货', type: 'success' },
  completed: { text: '已完成', type: 'default' },
  refunding: { text: '退款中', type: 'danger' },
  refunded: { text: '已退款', type: 'default' },
  cancelled: { text: '已取消', type: 'default' }
}

function getStatusTag(status: OrderStatus) {
  return statusTagMap[status] || { text: status, type: 'default' as const }
}

const allOrders = computed(() => {
  return orderStore.getOrdersByUser(userStore.userInfo.id)
})

const filteredOrders = computed(() => {
  const key = tabs[activeTab.value]?.key
  if (!key || key === 'all') return allOrders.value
  if (key === 'refunding') {
    return allOrders.value.filter((o: Order) => o.status === 'refunding' || o.status === 'refunded')
  }
  return allOrders.value.filter((o: Order) => o.status === key)
})

function getTotalQuantity(order: Order): number {
  return order.items.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0)
}

function formatTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function goDetail(id: string) {
  router.push(`/order/detail/${id}`)
}

function handlePay(order: Order) {
  showDialog({
    title: '选择支付方式',
    message: '模拟支付，确认后将订单状态变更为"已付款"',
    showCancelButton: true,
    confirmButtonText: '确认支付',
    confirmButtonColor: '#07C160'
  }).then(() => {
    const ok = orderStore.payOrder(order.id)
    if (ok) {
      showToast('支付成功')
    } else {
      showToast('支付失败，请重试')
    }
  }).catch(() => {})
}

function handleCancel(order: Order) {
  showDialog({
    title: '取消订单',
    message: '确定要取消该订单吗？',
    showCancelButton: true,
    confirmButtonText: '确定',
    confirmButtonColor: '#ff4d4f'
  }).then(() => {
    const ok = orderStore.cancelOrder(order.id)
    if (ok) {
      showToast('订单已取消')
    }
  }).catch(() => {})
}

function handleConfirm(order: Order) {
  showDialog({
    title: '确认收货',
    message: '确认已收到商品吗？',
    showCancelButton: true,
    confirmButtonText: '确认收货',
    confirmButtonColor: '#07C160'
  }).then(() => {
    const ok = orderStore.completeOrder(order.id)
    if (ok) {
      showToast('已确认收货')
    }
  }).catch(() => {})
}

function handleRefund(order: Order) {
  showDialog({
    title: '申请退款',
    message: '请输入退款原因',
    showCancelButton: true,
    confirmButtonText: '提交',
    confirmButtonColor: '#ff4d4f'
  }).then(() => {
    const ok = orderStore.requestRefund(order.id, '用户申请退款')
    if (ok) {
      showToast('退款申请已提交')
    }
  }).catch(() => {})
}
</script>

<style scoped>
.order-list-page {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  background: #f5f5f5;
  padding-bottom: 20px;
}

.order-tabs {
  --van-tab-font-size: 14px;
  --van-tabs-bottom-bar-height: 2px;
}

.order-list {
  padding: 8px 16px;
}

.order-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  cursor: pointer;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #f5f5f5;
}

.order-no {
  font-size: 12px;
  color: #999;
}

.order-product {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.order-product:last-of-type {
  border-bottom: none;
}

.product-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-title {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.product-price {
  font-size: 15px;
  font-weight: 600;
  color: #ff4d00;
  margin: 0;
}

.product-quantity {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.order-footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
}

.order-total {
  font-size: 13px;
  color: #666;
}

.total-price {
  font-size: 15px;
  font-weight: 700;
  color: #ff4d00;
}

.order-time {
  font-size: 12px;
  color: #bbb;
  text-align: right;
  padding-bottom: 8px;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid #f5f5f5;
}
</style>