<template>
  <div class="order-detail-page">
    <AppNavbar title="订单详情" @click-left="router.back" />

    <div v-if="!order" class="loading-wrap">
      <van-loading size="32" color="#07C160" />
      <p>加载中...</p>
    </div>

    <template v-else>
      <!-- 状态步骤条 -->
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
          <van-step>已付款</van-step>
          <van-step>已发货</van-step>
          <van-step>已完成</van-step>
        </van-steps>
      </div>

      <!-- 收货地址 -->
      <div class="card address-card">
        <div class="card-title">
          <van-icon name="location-o" size="18" color="#07C160" />
          <span>收货地址</span>
        </div>
        <div class="address-body">
          <span class="addr-name">{{ order.address.name }}</span>
          <span class="addr-phone">{{ order.address.phone }}</span>
        </div>
        <p class="addr-detail">{{ order.address.fullAddress }}</p>
      </div>

      <!-- 商品列表 -->
      <div class="card product-card">
        <div class="card-title">
          <van-icon name="shop-o" size="18" color="#07C160" />
          <span>商品信息</span>
        </div>
        <div
          v-for="item in order.items"
          :key="item.productId"
          class="product-row"
        >
          <van-image
            :src="thumbnail(item.cover)"
            width="72"
            height="72"
            fit="cover"
            radius="6"
            lazy-load
          />
          <div class="product-info">
            <p class="product-title">{{ item.title }}</p>
            <div class="product-bottom">
              <span class="product-price">¥{{ (item.price || 0).toLocaleString() }}</span>
              <span class="product-quantity">x{{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 订单信息 -->
      <div class="card info-card">
        <div class="card-title">
          <van-icon name="records-o" size="18" color="#07C160" />
          <span>订单信息</span>
        </div>
        <div class="info-row">
          <span class="info-label">订单编号</span>
          <span class="info-value">{{ order.orderNo }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">创建时间</span>
          <span class="info-value">{{ formatTime(order.createTime) }}</span>
        </div>
        <div class="info-row" v-if="order.payTime">
          <span class="info-label">付款时间</span>
          <span class="info-value">{{ formatTime(order.payTime) }}</span>
        </div>
        <div class="info-row" v-if="order.shipTime">
          <span class="info-label">发货时间</span>
          <span class="info-value">{{ formatTime(order.shipTime) }}</span>
        </div>
        <div class="info-row" v-if="order.completeTime">
          <span class="info-label">完成时间</span>
          <span class="info-value">{{ formatTime(order.completeTime) }}</span>
        </div>
        <div class="info-row" v-if="order.logisticsCompany">
          <span class="info-label">物流公司</span>
          <span class="info-value">{{ order.logisticsCompany }}</span>
        </div>
        <div class="info-row" v-if="order.logisticsNo">
          <span class="info-label">物流单号</span>
          <span class="info-value">{{ order.logisticsNo }}</span>
        </div>
        <div class="info-row" v-if="order.remark">
          <span class="info-label">备注</span>
          <span class="info-value">{{ order.remark }}</span>
        </div>
      </div>

      <!-- 价格明细 -->
      <div class="card price-card">
        <div class="card-title">
          <van-icon name="balance-o" size="18" color="#07C160" />
          <span>价格明细</span>
        </div>
        <div class="price-row">
          <span class="price-label">商品金额</span>
          <span class="price-value">¥{{ (order.totalPrice || 0).toLocaleString() }}</span>
        </div>
        <div class="price-row">
          <span class="price-label">运费</span>
          <span class="price-value free">包邮</span>
        </div>
        <div class="price-row total">
          <span class="price-label">实付款</span>
          <span class="price-value total-price">¥{{ (order.totalPrice || 0).toLocaleString() }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-bar" v-if="showActions">
        <van-button
          v-if="order.status === 'pending'"
          size="small"
          plain
          type="default"
          @click="handleCancel"
        >
          取消订单
        </van-button>
        <van-button
          v-if="order.status === 'pending'"
          size="small"
          type="primary"
          @click="handlePay"
        >
          去支付
        </van-button>
        <van-button
          v-if="order.status === 'shipped'"
          size="small"
          plain
          type="default"
          @click="handleRefund"
        >
          申请退款
        </van-button>
        <van-button
          v-if="order.status === 'shipped'"
          size="small"
          type="primary"
          @click="handleConfirm"
        >
          确认收货
        </van-button>
        <van-button
          v-if="order.status === 'completed'"
          size="small"
          plain
          type="default"
          @click="handleRefund"
        >
          申请退款
        </van-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { useOrderStore } from '../../stores/order'
import { thumbnail } from '@/utils/image'
import type { Order, OrderStatus } from '../../types'
import AppNavbar from '../../components/AppNavbar.vue'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()

const order = ref<Order | undefined>(undefined)

const statusTagMap: Record<string, { text: string; type: 'warning' | 'primary' | 'success' | 'default' | 'danger' }> = {
  pending: { text: '待付款', type: 'warning' },
  paid: { text: '已付款', type: 'primary' },
  shipped: { text: '已发货', type: 'success' },
  completed: { text: '已完成', type: 'default' },
  refunding: { text: '退款中', type: 'danger' },
  refunded: { text: '已退款', type: 'default' },
  cancelled: { text: '已取消', type: 'default' }
}

const statusTag = computed(() => {
  if (!order.value) return { text: '', type: 'default' as const }
  return statusTagMap[order.value.status] || { text: order.value.status, type: 'default' as const }
})

const stepIndex = computed(() => {
  if (!order.value) return 0
  const map: Record<string, number> = {
    pending: 0,
    paid: 1,
    shipped: 2,
    completed: 3,
    refunding: 2,
    refunded: 3,
    cancelled: 0
  }
  return map[order.value.status] ?? 0
})

const showActions = computed(() => {
  if (!order.value) return false
  return ['pending', 'shipped', 'completed'].includes(order.value.status)
})

function formatTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function handlePay() {
  showDialog({
    title: '选择支付方式',
    message: '微信支付 / 支付宝 / 银行卡',
    showCancelButton: true,
    confirmButtonText: '确认支付',
    confirmButtonColor: '#07C160'
  }).then(() => {
    const ok = orderStore.payOrder(order.value!.id)
    if (ok) {
      showToast('支付成功')
      order.value = orderStore.getOrderById(order.value!.id)
    } else {
      showToast('支付失败')
    }
  }).catch(() => {})
}

function handleCancel() {
  showDialog({
    title: '取消订单',
    message: '确定要取消该订单吗？',
    showCancelButton: true,
    confirmButtonText: '确定',
    confirmButtonColor: '#ff4d4f'
  }).then(() => {
    const ok = orderStore.cancelOrder(order.value!.id)
    if (ok) {
      showToast('订单已取消')
      order.value = orderStore.getOrderById(order.value!.id)
    }
  }).catch(() => {})
}

function handleConfirm() {
  showDialog({
    title: '确认收货',
    message: '确认已收到商品吗？',
    showCancelButton: true,
    confirmButtonText: '确认收货',
    confirmButtonColor: '#07C160'
  }).then(() => {
    const ok = orderStore.completeOrder(order.value!.id)
    if (ok) {
      showToast('已确认收货')
      order.value = orderStore.getOrderById(order.value!.id)
    }
  }).catch(() => {})
}

function handleRefund() {
  showDialog({
    title: '申请退款',
    message: '请输入退款原因',
    showCancelButton: true,
    confirmButtonText: '提交',
    confirmButtonColor: '#ff4d4f'
  }).then(() => {
    const ok = orderStore.requestRefund(order.value!.id, '用户申请退款')
    if (ok) {
      showToast('退款申请已提交')
      order.value = orderStore.getOrderById(order.value!.id)
    }
  }).catch(() => {})
}

onMounted(() => {
  const id = route.params.id as string
  order.value = orderStore.getOrderById(id)
})
</script>

<style scoped>
.order-detail-page {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 16px;
  color: #999;
  font-size: 14px;
}

.card {
  background: #fff;
  border-radius: 10px;
  margin: 8px 16px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 10px;
}

/* Status */
.status-card {
  background: #fff;
  border-radius: 10px;
  margin: 8px 16px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
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

/* Address */
.address-body {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 6px;
}

.addr-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.addr-phone {
  font-size: 13px;
  color: #999;
}

.addr-detail {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

/* Product */
.product-row {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.product-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
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

.product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-price {
  font-size: 15px;
  font-weight: 600;
  color: #ff4d00;
}

.product-quantity {
  font-size: 12px;
  color: #999;
}

/* Info */
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
}

.info-row:last-child {
  padding-bottom: 0;
}

.info-label {
  color: #999;
  flex-shrink: 0;
}

.info-value {
  color: #333;
  text-align: right;
  word-break: break-all;
}

/* Price */
.price-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.price-row.total {
  border-top: 1px solid #f5f5f5;
  margin-top: 4px;
  padding-top: 12px;
}

.price-label {
  color: #666;
}

.price-value {
  color: #333;
}

.price-value.free {
  color: #07C160;
}

.total-price {
  font-size: 18px;
  font-weight: 700;
  color: #ff4d00;
}

/* Actions */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  background: #fff;
  border-top: 1px solid #eee;
  padding: 10px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  z-index: 100;
}
</style>