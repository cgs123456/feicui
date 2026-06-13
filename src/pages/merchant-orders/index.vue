<template>
  <div class="page-container">
    <AppNavbar
      title="订单管理"
      leftArrow
      fallback="/merchant/dashboard"
    />
    <div class="orders-content">
      <van-tabs
        v-model:active="activeTab"
        sticky
        @change="onTabChange"
      >
        <van-tab title="全部" />
        <van-tab title="待发货" />
        <van-tab title="已发货" />
        <van-tab title="已完成" />
        <van-tab title="退款中" />
      </van-tabs>

      <div v-if="!userStore.hasPermission('order:manage')" class="permission-denied">
        <EmptyState description="您没有订单管理权限" />
      </div>

      <div v-else class="order-list">
        <div v-if="filteredOrders.length === 0" class="empty-wrap">
          <EmptyState :description="emptyText" />
        </div>

        <div
          v-for="order in filteredOrders"
          :key="order.id"
          class="order-card card"
          @click="goDetail(order.id)"
        >
          <div class="order-header">
            <span class="order-no">订单号：{{ order.orderNo }}</span>
            <van-tag :type="statusTagType(order.status)" size="medium">
              {{ statusText(order.status) }}
            </van-tag>
          </div>

          <div class="order-products">
            <div
              v-for="item in order.items"
              :key="item.productId"
              class="order-product-item"
            >
              <van-image
                :src="item.cover"
                width="60"
                height="60"
                fit="cover"
                radius="6"
                lazy-load
              />
              <div class="product-info">
                <span class="product-title">{{ item.title }}</span>
                <span class="product-price">¥{{ item.price.toLocaleString() }}</span>
              </div>
              <span class="product-qty">x{{ item.quantity }}</span>
            </div>
          </div>

          <div class="order-footer">
            <div class="order-meta">
              <span class="order-buyer">买家：{{ order.buyerName }}</span>
              <span class="order-time">{{ formatTime(order.createTime) }}</span>
            </div>
            <div class="order-total">
              共{{ totalQuantity(order) }}件，合计：
              <span class="total-price">¥{{ order.totalPrice.toLocaleString() }}</span>
            </div>
            <div class="order-actions" @click.stop>
              <van-button
                v-if="order.status === 'pending'"
                type="primary"
                size="small"
                round
                @click="handleConfirmPayment(order)"
              >
                确认付款
              </van-button>
              <van-button
                v-if="order.status === 'paid'"
                type="primary"
                size="small"
                round
                @click="openShipDialog(order)"
              >
                发货
              </van-button>
              <van-button
                v-if="order.status === 'refunding'"
                type="danger"
                plain
                size="small"
                round
                @click="handleRejectRefund(order)"
              >
                拒绝退款
              </van-button>
              <van-button
                v-if="order.status === 'refunding'"
                type="success"
                size="small"
                round
                @click="handleApproveRefund(order)"
              >
                同意退款
              </van-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 发货弹窗 -->
    <van-dialog
      v-model:show="showShipDialog"
      title="确认发货"
      show-cancel-button
      confirm-button-text="确认发货"
      @confirm="handleShip"
    >
      <div class="dialog-body">
        <van-field
          v-model="logisticsCompany"
          label="物流公司"
          placeholder="请输入物流公司"
        />
        <van-field
          v-model="logisticsNo"
          label="快递单号"
          placeholder="请输入快递单号"
        />
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useOrderStore } from '@/stores/order'
import { useUserStore } from '@/stores/user'
import type { Order, OrderStatus, OrderItem } from '@/types'
import AppNavbar from '@/components/AppNavbar.vue'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const orderStore = useOrderStore()
const userStore = useUserStore()

const activeTab = ref(0)

const tabStatusMap: Record<number, OrderStatus | 'all'> = {
  0: 'all',
  1: 'paid',
  2: 'shipped',
  3: 'completed',
  4: 'refunding'
}

const emptyTextMap: Record<number, string> = {
  0: '暂无订单',
  1: '暂无待发货订单',
  2: '暂无已发货订单',
  3: '暂无已完成订单',
  4: '暂无退款中订单'
}

const filteredOrders = computed(() => {
  const status = tabStatusMap[activeTab.value]
  if (status === 'all') {
    return orderStore.getAllOrders
  }
  return orderStore.getOrdersByStatus(status)
})

const emptyText = computed(() => emptyTextMap[activeTab.value] || '暂无订单')

const statusText = (status: OrderStatus): string => {
  const map: Record<OrderStatus, string> = {
    pending: '待付款',
    paid: '待发货',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
    refunding: '退款中',
    refunded: '已退款'
  }
  return map[status] || status
}

const statusTagType = (status: OrderStatus): 'primary' | 'success' | 'warning' | 'danger' | 'default' => {
  const map: Record<OrderStatus, string> = {
    pending: 'default',
    paid: 'primary',
    shipped: 'warning',
    completed: 'success',
    cancelled: 'default',
    refunding: 'danger',
    refunded: 'default'
  }
  return (map[status] || 'default') as 'primary' | 'success' | 'warning' | 'danger' | 'default'
}

const totalQuantity = (order: Order): number => {
  return order.items.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0)
}

const formatTime = (iso: string): string => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const goDetail = (id: string) => {
  router.push(`/merchant/orders/${id}`)
}

const onTabChange = (_index: number) => {
  // tab changed, filteredOrders updates reactively
}

// 发货相关
const showShipDialog = ref(false)
const currentShipOrder = ref<Order | null>(null)
const logisticsCompany = ref('顺丰速运')
const logisticsNo = ref('')

const openShipDialog = (order: Order) => {
  currentShipOrder.value = order
  logisticsCompany.value = '顺丰速运'
  logisticsNo.value = ''
  showShipDialog.value = true
}

const handleShip = () => {
  if (!currentShipOrder.value) return
  if (!logisticsCompany.value.trim()) {
    showToast('请输入物流公司')
    return
  }
  if (!logisticsNo.value.trim()) {
    showToast('请输入快递单号')
    return
  }
  const ok = orderStore.shipOrder(
    currentShipOrder.value.id,
    logisticsNo.value.trim(),
    logisticsCompany.value.trim()
  )
  if (ok) {
    showToast('发货成功')
  } else {
    showToast('发货失败，请重试')
  }
  showShipDialog.value = false
}

// 同意退款
const handleApproveRefund = async (order: Order) => {
  try {
    await showConfirmDialog({
      title: '确认退款',
      message: '确定同意该订单的退款申请吗？'
    })
    const ok = orderStore.approveRefund(order.id)
    if (ok) {
      showToast('已同意退款')
    } else {
      showToast('操作失败')
    }
  } catch {
    // user cancelled
  }
}

// 确认付款
const handleConfirmPayment = async (order: Order) => {
  try {
    await showConfirmDialog({
      title: '确认收款',
      message: '确认已收到该订单的款项吗？'
    })
    const ok = orderStore.confirmPayment(order.id)
    if (ok) {
      showToast('已确认付款')
    } else {
      showToast('操作失败')
    }
  } catch {
    // user cancelled
  }
}

// 拒绝退款
const handleRejectRefund = async (order: Order) => {
  try {
    await showConfirmDialog({
      title: '拒绝退款',
      message: '确定拒绝该订单的退款申请吗？'
    })
    const ok = orderStore.rejectRefund(order.id)
    if (ok) {
      showToast('已拒绝退款')
    } else {
      showToast('操作失败')
    }
  } catch {
    // user cancelled
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100dvh;
  background: #f5f5f5;
  max-width: 430px;
  margin: 0 auto;
}

.orders-content {
  padding-top: 46px;
}

.order-list {
  padding: 12px 0 24px;
}

.order-card {
  margin: 8px 12px;
  padding: 0;
  overflow: hidden;
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #f5f5f5;
}

.order-no {
  font-size: 13px;
  color: #666;
}

.order-products {
  padding: 8px 14px;
}

.order-product-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.order-product-item + .order-product-item {
  border-top: 1px solid #f9f9f9;
}

.product-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-title {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price {
  font-size: 13px;
  color: #ff4d00;
}

.product-qty {
  font-size: 13px;
  color: #999;
  flex-shrink: 0;
}

.order-footer {
  padding: 10px 14px 14px;
  background: #fafafa;
}

.order-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-bottom: 6px;
}

.order-total {
  font-size: 13px;
  color: #333;
  text-align: right;
  margin-bottom: 8px;
}

.total-price {
  font-size: 16px;
  font-weight: 700;
  color: #ff4d00;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.empty-wrap {
  padding: 60px 0;
}

.permission-denied {
  padding: 60px 0;
}

/* Dialog */
.dialog-body {
  padding: 8px 0;
}

.dialog-body :deep(.van-field) {
  padding: 10px 16px;
}
</style>