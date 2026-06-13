<template>
  <div class="page-container">
    <AppNavbar
      title="订单详情"
      leftArrow
      fallback="/merchant/orders"
    />

    <LoadingView v-if="!order" text="加载中..." />

    <template v-else>
      <!-- 状态进度条 -->
      <div class="status-stepper card">
        <div class="stepper-steps">
          <div
            v-for="(step, idx) in steps"
            :key="step.key"
            class="stepper-item"
            :class="{ active: stepIdx >= idx, current: stepIdx === idx }"
          >
            <div class="step-dot">
              <van-icon v-if="stepIdx > idx" name="success" size="14" />
              <span v-else class="dot-inner" />
            </div>
            <span class="step-label">{{ step.label }}</span>
            <span v-if="step.time" class="step-time">{{ step.time }}</span>
          </div>
        </div>
      </div>

      <!-- 物流信息 -->
      <div v-if="order.status === 'shipped' && order.logisticsCompany" class="logistics-info card">
        <van-icon name="logistics" size="18" color="#07C160" />
        <div class="logistics-text">
          <span>{{ order.logisticsCompany }}</span>
          <span>快递单号：{{ order.logisticsNo }}</span>
        </div>
      </div>

      <!-- 买家信息 -->
      <div class="buyer-info card">
        <div class="section-header">
          <van-icon name="user-o" size="16" />
          <span>买家信息</span>
        </div>
        <div class="info-row">
          <span class="info-label">买家姓名</span>
          <span class="info-value">{{ order.buyerName }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">联系电话</span>
          <span class="info-value">{{ order.buyerPhone }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">收货地址</span>
          <span class="info-value address-value">{{ order.address?.fullAddress || order.address?.detail || '-' }}</span>
        </div>
      </div>

      <!-- 订单信息 -->
      <div class="order-info card">
        <div class="section-header">
          <van-icon name="orders-o" size="16" />
          <span>订单信息</span>
        </div>
        <div class="info-row">
          <span class="info-label">订单编号</span>
          <span class="info-value">{{ order.orderNo }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">订单状态</span>
          <van-tag :type="statusTagType(order.status)" size="medium">
            {{ statusText(order.status) }}
          </van-tag>
        </div>
        <div class="info-row">
          <span class="info-label">下单时间</span>
          <span class="info-value">{{ formatTime(order.createTime) }}</span>
        </div>
        <div v-if="order.payTime" class="info-row">
          <span class="info-label">付款时间</span>
          <span class="info-value">{{ formatTime(order.payTime) }}</span>
        </div>
        <div v-if="order.shipTime" class="info-row">
          <span class="info-label">发货时间</span>
          <span class="info-value">{{ formatTime(order.shipTime) }}</span>
        </div>
        <div v-if="order.completeTime" class="info-row">
          <span class="info-label">完成时间</span>
          <span class="info-value">{{ formatTime(order.completeTime) }}</span>
        </div>
        <div v-if="order.remark" class="info-row">
          <span class="info-label">买家备注</span>
          <span class="info-value">{{ order.remark }}</span>
        </div>
        <div v-if="order.refundReason" class="info-row">
          <span class="info-label">退款原因</span>
          <span class="info-value refund-reason">{{ order.refundReason }}</span>
        </div>
      </div>

      <!-- 商品列表 -->
      <div class="product-list card">
        <div class="section-header">
          <van-icon name="goods-collect-o" size="16" />
          <span>商品清单</span>
        </div>
        <div
          v-for="item in order.items"
          :key="item.productId"
          class="product-item"
        >
          <van-image
            :src="item.cover"
            width="64"
            height="64"
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

      <!-- 价格明细 -->
      <div class="price-breakdown card">
        <div class="section-header">
          <van-icon name="gold-coin-o" size="16" />
          <span>价格明细</span>
        </div>
        <div class="price-row">
          <span>商品总额</span>
          <span>¥{{ order.totalPrice.toLocaleString() }}</span>
        </div>
        <div class="price-row">
          <span>运费</span>
          <span>免运费</span>
        </div>
        <div class="price-row total">
          <span>实付金额</span>
          <span class="total-price">¥{{ order.totalPrice.toLocaleString() }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="order.status === 'pending' || order.status === 'paid' || order.status === 'refunding'" class="action-bar">
        <van-button
          v-if="order.status === 'pending'"
          type="primary"
          block
          round
          @click="handleConfirmPayment"
        >
          确认付款
        </van-button>
        <van-button
          v-if="order.status === 'paid'"
          type="primary"
          block
          round
          @click="openShipDialog"
        >
          确认发货
        </van-button>
        <div v-if="order.status === 'refunding'" class="refund-actions">
          <van-button
            type="danger"
            plain
            round
            @click="handleRejectRefund"
          >
            拒绝退款
          </van-button>
          <van-button
            type="primary"
            round
            @click="handleApproveRefund"
          >
            同意退款
          </van-button>
        </div>
      </div>
    </template>

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
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useOrderStore } from '@/stores/order'
import type { Order, OrderStatus } from '@/types'
import AppNavbar from '@/components/AppNavbar.vue'
import LoadingView from '@/components/LoadingView.vue'

const router = useRouter()
const route = useRoute()
const orderStore = useOrderStore()

const orderId = computed(() => route.params.id as string)
const order = ref<Order | undefined>(undefined)

const loadOrder = () => {
  order.value = orderStore.getOrderById(orderId.value)
}

loadOrder()

watch(orderId, loadOrder)

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

const steps = computed(() => {
  if (!order.value) return []
  const statusOrder = ['pending', 'paid', 'shipped', 'completed']
  const statusLabels: Record<string, string> = {
    pending: '待付款',
    paid: '待发货',
    shipped: '已发货',
    completed: '已完成'
  }
  const timeKeys: Record<string, keyof Order> = {
    pending: 'createTime',
    paid: 'payTime',
    shipped: 'shipTime',
    completed: 'completeTime'
  }
  return statusOrder.map(s => ({
    key: s,
    label: statusLabels[s],
    time: order.value?.[timeKeys[s]] ? formatTime(order.value[timeKeys[s]] as string) : ''
  }))
})

const stepIdx = computed(() => {
  if (!order.value) return -1
  const statusOrder = ['pending', 'paid', 'shipped', 'completed']
  const idx = statusOrder.indexOf(order.value.status)
  return idx >= 0 ? idx : statusOrder.length - 1
})

const formatTime = (iso: string): string => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 发货相關
const showShipDialog = ref(false)
const logisticsCompany = ref('顺丰速运')
const logisticsNo = ref('')

const openShipDialog = () => {
  logisticsCompany.value = '顺丰速运'
  logisticsNo.value = ''
  showShipDialog.value = true
}

const handleShip = () => {
  if (!order.value) return
  if (!logisticsCompany.value.trim()) {
    showToast('请输入物流公司')
    return
  }
  if (!logisticsNo.value.trim()) {
    showToast('请输入快递单号')
    return
  }
  const ok = orderStore.shipOrder(
    order.value.id,
    logisticsNo.value.trim(),
    logisticsCompany.value.trim()
  )
  if (ok) {
    showToast('发货成功')
    loadOrder()
  } else {
    showToast('发货失败，请重试')
  }
  showShipDialog.value = false
}

// 退款
const handleApproveRefund = async () => {
  if (!order.value) return
  try {
    await showConfirmDialog({
      title: '确认退款',
      message: '确定同意该订单的退款申请吗？'
    })
    const ok = orderStore.approveRefund(order.value.id)
    if (ok) {
      showToast('已同意退款')
      loadOrder()
    } else {
      showToast('操作失败')
    }
  } catch {
    // user cancelled
  }
}

const handleRejectRefund = async () => {
  if (!order.value) return
  try {
    await showConfirmDialog({
      title: '拒绝退款',
      message: '确定拒绝该订单的退款申请吗？'
    })
    const ok = orderStore.rejectRefund(order.value.id)
    if (ok) {
      showToast('已拒绝退款')
      loadOrder()
    } else {
      showToast('操作失败')
    }
  } catch {
    // user cancelled
  }
}

// 确认付款
const handleConfirmPayment = async () => {
  if (!order.value) return
  try {
    await showConfirmDialog({
      title: '确认收款',
      message: '确认已收到该订单的款项吗？'
    })
    const ok = orderStore.confirmPayment(order.value.id)
    if (ok) {
      showToast('已确认付款')
      loadOrder()
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
  padding-top: 46px;
  padding-bottom: 80px;
}

.card {
  background: #fff;
  border-radius: 10px;
  margin: 10px 12px;
  padding: 14px;
}

/* 状态进度条 */
.status-stepper {
  padding: 16px 14px;
}

.stepper-steps {
  display: flex;
  justify-content: space-between;
}

.stepper-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  position: relative;
}

.stepper-item::after {
  content: '';
  position: absolute;
  top: 10px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: #eee;
  z-index: 0;
}

.stepper-item:last-child::after {
  display: none;
}

.stepper-item.active::after {
  background: #07C160;
}

.step-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  background: #fff;
}

.stepper-item.active .step-dot {
  border-color: #07C160;
  background: #07C160;
  color: #fff;
}

.dot-inner {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ddd;
}

.stepper-item.active .dot-inner {
  background: #fff;
}

.step-label {
  font-size: 11px;
  color: #999;
}

.stepper-item.active .step-label,
.stepper-item.current .step-label {
  color: #07C160;
  font-weight: 600;
}

.step-time {
  font-size: 10px;
  color: #bbb;
}

/* 物流信息 */
.logistics-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logistics-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  color: #333;
}

.logistics-text span + span {
  color: #999;
  font-size: 12px;
}

/* 区块头 */
.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f5f5f5;
}

/* 信息行 */
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.info-label {
  color: #999;
  flex-shrink: 0;
}

.info-value {
  color: #333;
  text-align: right;
  max-width: 60%;
}

.address-value {
  text-align: right;
}

.refund-reason {
  color: #ff4d4f;
}

/* 商品清单 */
.product-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.product-item + .product-item {
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

/* 价格明细 */
.price-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  padding: 6px 0;
}

.price-row.total {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  border-top: 1px solid #f5f5f5;
  margin-top: 6px;
  padding-top: 10px;
}

.total-price {
  color: #ff4d00;
  font-size: 18px;
}

/* 操作按钮 */
.action-bar {
  padding: 12px 16px;
}

.refund-actions {
  display: flex;
  gap: 12px;
}

.refund-actions .van-button {
  flex: 1;
}

/* Dialog */
.dialog-body {
  padding: 8px 0;
}

.dialog-body :deep(.van-field) {
  padding: 10px 16px;
}
</style>