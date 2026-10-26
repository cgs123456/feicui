<template>
  <div class="page-container">
    <AppNavbar title="订单详情" left-arrow fallback="/merchant/orders" />

    <LoadingView v-if="!order && !notFound" text="加载中..." />

    <van-empty v-else-if="notFound" image="search" description="订单不存在或无权查看">
      <van-button round size="small" type="primary" @click="router.push('/merchant/orders')">
        返回订单列表
      </van-button>
    </van-empty>

    <template v-else>
      <!-- 状态进度条 -->
      <div class="status-stepper card">
        <OrderStatusSteps :steps="steps" :step-idx="stepIdx" />
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
          <span class="info-value address-value">{{
            order.address?.fullAddress || order.address?.detail || '-'
          }}</span>
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
      <OrderItemsCard :items="order.items" />

      <!-- 价格明细 -->
      <PriceBreakdownCard :total-price="order.totalPrice" />

      <!-- 操作按钮 -->
      <div
        v-if="order.status === 'pending' || order.status === 'paid' || order.status === 'refunding'"
        class="action-bar"
      >
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
          <van-button type="danger" plain round @click="handleRejectRefund"> 拒绝退款 </van-button>
          <van-button type="primary" round @click="handleApproveRefund"> 同意退款 </van-button>
        </div>
      </div>
    </template>

    <!-- 发货弹窗：before-close 拦截关闭，校验失败/发货失败时保留输入 -->
    <van-dialog
      v-model:show="showShipDialog"
      title="确认发货"
      show-cancel-button
      confirm-button-text="确认发货"
      :before-close="shipBeforeClose"
    >
      <div class="dialog-body">
        <van-field v-model="logisticsCompany" label="物流公司" placeholder="请输入物流公司" />
        <van-field v-model="logisticsNo" label="快递单号" placeholder="请输入快递单号" />
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useOrderStore } from '@/stores/order'
import { useProductStore } from '@/stores/product'
import { useUserStore } from '@/stores/user'
import { getStatusTag } from '../../constants/orderStatus'
import { buildMerchantIndex, orderBelongsToMerchant } from '../../utils/order'
import { formatDate as formatTime } from '../../utils/format'
import { DEFAULT_MERCHANT_ID } from '../../data/merchants'
import type { Order, OrderStatus } from '@/types'
import AppNavbar from '@/components/AppNavbar.vue'
import LoadingView from '@/components/LoadingView.vue'
import OrderStatusSteps from './components/OrderStatusSteps.vue'
import OrderItemsCard from './components/OrderItemsCard.vue'
import PriceBreakdownCard from './components/PriceBreakdownCard.vue'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const productStore = useProductStore()
const userStore = useUserStore()

const orderId = computed(() => route.params.id as string)
const order = ref<Order | undefined>(undefined)
const notFound = ref(false)

const loadOrder = () => {
  const found = orderStore.getOrderById(orderId.value)
  // 多商户隔离：直达 URL 也不可见他店订单（商户索引 O(1) 查询，口径同列表页）
  const myId = userStore.userInfo.id || DEFAULT_MERCHANT_ID
  const index = buildMerchantIndex(productStore.products)
  const belongsToMyStore = found ? orderBelongsToMerchant(found, myId, index) : false
  order.value = belongsToMyStore ? found : undefined
  notFound.value = !order.value
}

loadOrder()

watch(orderId, loadOrder)

const statusText = (status: OrderStatus): string => getStatusTag(status, 'merchant').text

const statusTagType = (status: OrderStatus) => getStatusTag(status, 'merchant').type

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

// 发货相關
const showShipDialog = ref(false)
const logisticsCompany = ref('顺丰速运')
const logisticsNo = ref('')

const openShipDialog = () => {
  logisticsCompany.value = '顺丰速运'
  logisticsNo.value = ''
  showShipDialog.value = true
}

/** before-close 拦截：confirm 时校验并发货，成功才允许关闭；cancel 直接放行 */
const shipBeforeClose = async (action: string): Promise<boolean> => {
  if (action !== 'confirm') return true
  if (!order.value) return true
  if (!logisticsCompany.value.trim()) {
    showToast('请输入物流公司')
    return false
  }
  if (!logisticsNo.value.trim()) {
    showToast('请输入快递单号')
    return false
  }
  try {
    const ok = await orderStore.shipOrder(
      order.value.id,
      logisticsNo.value.trim(),
      logisticsCompany.value.trim()
    )
    if (ok) {
      showToast('发货成功')
      loadOrder()
      return true
    }
    showToast('发货失败，请重试')
    return false
  } catch (err) {
    showToast(err instanceof Error && err.message ? err.message : '发货失败，请重试')
    return false
  }
}

// 退款
const handleApproveRefund = async () => {
  if (!order.value) return
  try {
    await showConfirmDialog({
      title: '确认退款',
      message: '确定同意该订单的退款申请吗？'
    })
    const ok = await orderStore.approveRefund(order.value.id)
    if (ok) {
      showToast('已同意退款')
      loadOrder()
    } else {
      showToast('操作失败')
    }
  } catch (err) {
    // 取消保持静默；server 拒绝（ApiError 带 code）给出明确反馈
    if (err && typeof err === 'object' && 'code' in err) {
      showToast(err instanceof Error && err.message ? err.message : '操作失败')
    }
  }
}

const handleRejectRefund = async () => {
  if (!order.value) return
  try {
    await showConfirmDialog({
      title: '拒绝退款',
      message: '确定拒绝该订单的退款申请吗？'
    })
    const ok = await orderStore.rejectRefund(order.value.id)
    if (ok) {
      showToast('已拒绝退款')
      loadOrder()
    } else {
      showToast('操作失败')
    }
  } catch (err) {
    // 取消保持静默；server 拒绝（ApiError 带 code）给出明确反馈
    if (err && typeof err === 'object' && 'code' in err) {
      showToast(err instanceof Error && err.message ? err.message : '操作失败')
    }
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
    const ok = await orderStore.confirmPayment(order.value.id)
    if (ok) {
      showToast('已确认付款')
      loadOrder()
    } else {
      showToast('操作失败')
    }
  } catch (err) {
    // 取消保持静默；server 拒绝（ApiError 带 code）给出明确反馈
    if (err && typeof err === 'object' && 'code' in err) {
      showToast(err instanceof Error && err.message ? err.message : '操作失败')
    }
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
