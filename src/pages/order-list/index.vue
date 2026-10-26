<template>
  <div class="order-list-page">
    <AppNavbar title="我的订单" fallback="/" />

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

    <div v-if="filteredOrders.length > 0" class="order-list">
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

        <div v-for="item in order.items" :key="item.productId" class="order-product">
          <van-image :src="item.cover" width="72" height="72" fit="cover" radius="6" lazy-load />
          <div class="product-info">
            <p class="product-title">
              {{ item.title }}
            </p>
            <p class="product-price">¥{{ formatPrice(item.price) }}</p>
            <p class="product-quantity">x{{ item.quantity }}</p>
          </div>
        </div>

        <div class="order-footer">
          <span class="order-total">
            共{{ getTotalQuantity(order) }}件商品 合计：
            <span class="total-price">¥{{ formatPrice(order.totalPrice) }}</span>
          </span>
        </div>

        <div class="order-time">
          {{ formatTime(order.createTime) }}
        </div>

        <div
          v-if="order.status !== 'cancelled' && order.status !== 'refunded'"
          class="order-actions"
        >
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

    <InputDialog
      v-model:show="showRefundDialog"
      title="申请退款"
      placeholder="请输入退款原因"
      confirm-button-text="提交"
      confirm-button-color="#ff4d4f"
      @confirm="onRefundConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { formatPrice } from '../../utils/format'
defineOptions({ name: 'OrderListPage' })
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { useOrderStore } from '../../stores/order'
import { useUserStore } from '../../stores/user'
import { getStatusTag } from '../../constants/orderStatus'
import { getTotalQuantity } from '../../utils/order'
import { formatDate as formatTime } from '../../utils/format'
import type { Order } from '../../types'
import AppNavbar from '../../components/AppNavbar.vue'
import EmptyState from '../../components/EmptyState.vue'
import InputDialog from '../../components/InputDialog.vue'

const router = useRouter()
const route = useRoute()
const orderStore = useOrderStore()
const userStore = useUserStore()

const activeTab = ref(0)

const tabs = [
  { key: 'all', title: '全部' },
  { key: 'pending', title: '待付款' },
  { key: 'paid', title: '待发货' },
  { key: 'shipped', title: '待收货' },
  { key: 'completed', title: '已完成' },
  { key: 'refunding', title: '退换货' }
]

const allOrders = computed(() => {
  const userId = userStore.userInfo.id || 'U001'
  return orderStore.getOrdersByUser(userId)
})

// 从 URL 查询参数读取初始 Tab，并监听路由变化
function syncTabFromQuery() {
  const status = route.query.status as string
  if (status) {
    const idx = tabs.findIndex(t => t.key === status)
    if (idx > 0) activeTab.value = idx
  }
}

// 从后端拉取订单覆盖本地镜像
async function refreshOrders() {
  try {
    await orderStore.syncFromServer('buyer')
  } catch {
    // 网络失败保持本地镜像，列表仍可渲染
  }
}

onMounted(() => {
  syncTabFromQuery()
  refreshOrders()
})
// keep-alive 缓存页回前台时兜底同步 Tab 与订单数据（幂等）
onActivated(() => {
  syncTabFromQuery()
  refreshOrders()
})
watch(() => route.query.status, syncTabFromQuery)

const filteredOrders = computed(() => {
  const key = tabs[activeTab.value]?.key
  if (!key || key === 'all') return allOrders.value
  if (key === 'refunding') {
    return allOrders.value.filter((o: Order) => o.status === 'refunding' || o.status === 'refunded')
  }
  return allOrders.value.filter((o: Order) => o.status === key)
})

function goDetail(id: string) {
  router.push(`/order/detail/${id}`)
}

async function handlePay(order: Order) {
  showDialog({
    title: '选择支付方式',
    message: '模拟支付，确认后将订单状态变更为"已付款"',
    showCancelButton: true,
    confirmButtonText: '确认支付',
    confirmButtonColor: '#07C160'
  })
    .then(async () => {
      const ok = await orderStore.payOrder(order.id)
      if (ok) {
        showToast('支付成功')
      } else {
        showToast('支付失败，请重试')
      }
    })
    .catch(() => {})
}

async function handleCancel(order: Order) {
  showDialog({
    title: '取消订单',
    message: '确定要取消该订单吗？',
    showCancelButton: true,
    confirmButtonText: '确定',
    confirmButtonColor: '#ff4d4f'
  })
    .then(async () => {
      const ok = await orderStore.cancelOrder(order.id)
      if (ok) {
        showToast('订单已取消')
      }
    })
    .catch(() => {})
}

function handleConfirm(order: Order) {
  showDialog({
    title: '确认收货',
    message: '确认已收到商品吗？',
    showCancelButton: true,
    confirmButtonText: '确认收货',
    confirmButtonColor: '#07C160'
  })
    .then(async () => {
      const ok = await orderStore.completeOrder(order.id)
      if (ok) {
        showToast('已确认收货')
      }
    })
    .catch(() => {})
}

const showRefundDialog = ref(false)
const refundTarget = ref<Order | null>(null)

function handleRefund(order: Order) {
  refundTarget.value = order
  showRefundDialog.value = true
}

async function onRefundConfirm(reason: string) {
  const target = refundTarget.value
  if (!target) return
  const ok = await orderStore.requestRefund(target.id, reason || '用户申请退款')
  if (ok) {
    showToast('退款申请已提交')
  }
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
  box-shadow: 0 1px 3px rgb(0 0 0 / 4%);
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
