<template>
  <div class="order-detail-page">
    <AppNavbar title="订单详情" fallback="/orders" />

    <van-empty v-if="notFound" image="search" description="订单不存在或已删除">
      <van-button round size="small" type="primary" @click="router.push('/orders')">
        返回订单列表
      </van-button>
    </van-empty>

    <div v-else-if="!order" class="loading-wrap">
      <van-loading size="32" color="#07C160" />
      <p>加载中...</p>
    </div>

    <template v-else>
      <!-- 状态步骤条 -->
      <OrderStatusCard :order="order" :status-tag="statusTag" :step-index="stepIndex" />

      <!-- 收货地址 -->
      <div class="card address-card">
        <div class="card-title">
          <van-icon name="location-o" size="18" color="#07C160" />
          <span>收货地址</span>
        </div>
        <div class="address-body">
          <span class="addr-name">{{ order.address.name }}</span>
          <span class="addr-phone">{{ formatPhone(order.address.phone) }}</span>
        </div>
        <p class="addr-detail">
          {{ order.address.fullAddress }}
        </p>
      </div>

      <!-- 商品列表 -->
      <OrderProductsCard :items="order.items" />

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
        <div v-if="order.logisticsCompany" class="info-row">
          <span class="info-label">物流公司</span>
          <span class="info-value">{{ order.logisticsCompany }}</span>
        </div>
        <div v-if="order.logisticsNo" class="info-row">
          <span class="info-label">物流单号</span>
          <span class="info-value">{{ order.logisticsNo }}</span>
        </div>
        <div v-if="order.remark" class="info-row">
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
          <span class="price-value">¥{{ formatPrice(order.totalPrice) }}</span>
        </div>
        <div class="price-row">
          <span class="price-label">运费</span>
          <span class="price-value free">包邮</span>
        </div>
        <div class="price-row total">
          <span class="price-label">实付款</span>
          <span class="price-value total-price">¥{{ formatPrice(order.totalPrice) }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="showActions" class="action-bar">
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
import { formatPrice, formatDate as formatTime, formatPhone } from '../../utils/format'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { useOrderStore } from '../../stores/order'
import { getStatusTag } from '../../constants/orderStatus'
import { fetchOrderById } from '../../api/order'
import type { Order } from '../../types'
import AppNavbar from '../../components/AppNavbar.vue'
import InputDialog from '../../components/InputDialog.vue'
import OrderStatusCard from './components/OrderStatusCard.vue'
import OrderProductsCard from './components/OrderProductsCard.vue'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()

const order = ref<Order | undefined>(undefined)
const notFound = ref(false)

const statusTag = computed(() => {
  if (!order.value) return { text: '', type: 'default' as const }
  return getStatusTag(order.value.status)
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
  return ['pending', 'paid', 'shipped', 'completed'].includes(order.value.status)
})

async function handlePay() {
  showDialog({
    title: '选择支付方式',
    message: '微信支付 / 支付宝 / 银行卡',
    showCancelButton: true,
    confirmButtonText: '确认支付',
    confirmButtonColor: '#07C160'
  })
    .then(async () => {
      const ok = await orderStore.payOrder(order.value!.id)
      if (ok) {
        showToast('支付成功')
        order.value = orderStore.getOrderById(order.value!.id)
      } else {
        showToast('支付失败')
      }
    })
    .catch(() => {})
}

async function handleCancel() {
  showDialog({
    title: '取消订单',
    message: '确定要取消该订单吗？',
    showCancelButton: true,
    confirmButtonText: '确定',
    confirmButtonColor: '#ff4d4f'
  })
    .then(async () => {
      const ok = await orderStore.cancelOrder(order.value!.id)
      if (ok) {
        showToast('订单已取消')
        order.value = orderStore.getOrderById(order.value!.id)
      }
    })
    .catch(() => {})
}

function handleConfirm() {
  showDialog({
    title: '确认收货',
    message: '确认已收到商品吗？',
    showCancelButton: true,
    confirmButtonText: '确认收货',
    confirmButtonColor: '#07C160'
  })
    .then(async () => {
      const ok = await orderStore.completeOrder(order.value!.id)
      if (ok) {
        showToast('已确认收货')
        order.value = orderStore.getOrderById(order.value!.id)
      }
    })
    .catch(() => {})
}

async function handleRefund() {
  showRefundDialog.value = true
}

const showRefundDialog = ref(false)

async function onRefundConfirm(reason: string) {
  if (!order.value) return
  const ok = await orderStore.requestRefund(order.value.id, reason || '用户申请退款')
  if (ok) {
    showToast('退款申请已提交')
    order.value = orderStore.getOrderById(order.value.id)
  }
}

onMounted(async () => {
  const id = route.params.id as string
  order.value = orderStore.getOrderById(id)
  // 直刷/深链：内存镜像可能为空，回源拉取一次
  if (!order.value) {
    try {
      const res = await fetchOrderById(id)
      if (res) {
        orderStore.replaceOrder(res)
        order.value = res
      }
    } catch {
      // 拉取失败维持空态展示
    }
  }
  notFound.value = !order.value
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
  box-shadow: 0 1px 3px rgb(0 0 0 / 4%);
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
  color: #07c160;
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
  left: 0;
  right: 0;
  margin: 0 auto;
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
