<template>
  <div class="order-confirm-page">
    <AppNavbar title="确认订单" fallback="/cart" />

    <div v-if="!fromCart && !product" class="empty-wrap">
      <van-empty description="商品不存在或已下架" image="error">
        <van-button type="primary" round @click="router.back()"> 返回 </van-button>
      </van-empty>
    </div>

    <div v-else-if="fromCart && cartStore.checkedItems.length === 0" class="empty-wrap">
      <van-empty description="请先选择要结算的商品">
        <van-button type="primary" round @click="router.push('/cart')"> 去购物车 </van-button>
      </van-empty>
    </div>

    <template v-else>
      <!-- 收货地址 -->
      <div
        class="card address-card"
        role="region"
        aria-label="收货地址"
        data-testid="address-card"
        @click="router.push('/addresses?select=1')"
      >
        <div v-if="selectedAddress" class="address-header">
          <van-icon name="location-o" size="20" color="#07C160" />
          <span class="address-name">{{ selectedAddress.name }}</span>
          <span class="address-phone">{{ formatPhone(selectedAddress.phone) }}</span>
        </div>
        <p v-if="selectedAddress" class="address-detail">
          {{ selectedAddress.fullAddress }}
        </p>
        <p v-else class="address-detail address-empty">请选择收货地址</p>
      </div>

      <!-- 商品信息 -->
      <div class="card product-card" role="region" aria-label="商品信息">
        <div v-for="item in orderItems" :key="item.productId" class="product-row">
          <van-image :src="item.cover" width="80" height="80" fit="cover" radius="8" lazy-load />
          <div class="product-info">
            <h3 class="product-title">
              {{ item.title }}
            </h3>
            <div class="product-bottom">
              <span class="product-price">¥{{ formatPrice(item.price) }}</span>
              <span class="product-qty">x{{ item.quantity }}</span>
            </div>
          </div>
        </div>
        <div class="product-meta">
          <span class="meta-label">运费</span>
          <span class="meta-value free">包邮</span>
        </div>
      </div>

      <!-- 备注 -->
      <div class="card remark-card" role="region" aria-label="订单备注">
        <van-field
          v-model="remark"
          type="textarea"
          placeholder="选填：给商家留言（如圈口、颜色偏好等）"
          rows="2"
          autosize
          aria-label="订单备注"
        />
      </div>

      <!-- 价格明细 -->
      <div class="card price-card" role="region" aria-label="价格明细">
        <div class="price-row">
          <span class="price-label">商品金额</span>
          <span class="price-value">¥{{ formatPrice(totalPrice) }}</span>
        </div>
        <div class="price-row">
          <span class="price-label">运费</span>
          <span class="price-value free">包邮</span>
        </div>
        <div class="price-row total">
          <span class="price-label">合计</span>
          <span class="price-value total-price">¥{{ formatPrice(totalPrice) }}</span>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-bar">
        <div class="submit-info">
          <span class="submit-label">合计：</span>
          <span class="submit-price">¥{{ formatPrice(totalPrice) }}</span>
        </div>
        <van-button
          type="primary"
          round
          :loading="submitting"
          aria-label="提交订单"
          @click="handleSubmit"
        >
          提交订单
        </van-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { formatPrice, formatPhone } from '../../utils/format'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useProductStore } from '../../stores/product'
import { useCartStore } from '../../stores/cart'
import { useOrderStore } from '../../stores/order'
import { useAddressStore } from '../../stores/address'
import type { OrderItem, CartItem } from '@/types'
import AppNavbar from '../../components/AppNavbar.vue'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const cartStore = useCartStore()

// 直接以 URL 进入时拉取商品目录与地址，保证下单校验与快照价新鲜
onMounted(() => {
  productStore.syncFromServer().catch(() => {
    // 网络失败保持本地镜像
  })
  addressStore.syncFromServer().catch(() => {
    // 网络失败保持本地镜像
  })
})
const orderStore = useOrderStore()
const addressStore = useAddressStore()

const productId = computed(() => (route.query.id as string) || '')
const fromCart = computed(() => route.query.from === 'cart')
const product = computed(() => productStore.getProductById(productId.value))

const remark = ref('')
const submitting = ref(false)

/** 一次购买意图的幂等键：进入页面生成，重复点击提交返回同一订单 */
const clientOrderId =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `cid_${Date.now()}_${Math.random().toString(36).slice(2)}`

const orderItems = computed<OrderItem[]>(() => {
  if (fromCart.value) {
    return cartStore.checkedItems.map((i: CartItem) => ({
      productId: i.productId,
      title: i.title,
      cover: i.cover,
      price: i.price,
      quantity: i.quantity
    }))
  }
  if (product.value) {
    return [
      {
        productId: product.value.id,
        title: product.value.title,
        cover: product.value.cover,
        price: product.value.price,
        quantity: 1
      }
    ]
  }
  return []
})

const totalPrice = computed(() => orderItems.value.reduce((s, i) => s + i.price * i.quantity, 0))

/** 选址页一次性回传的地址 id（sessionStorage，用后即清），否则回默认地址 */
const pickedAddressId = sessionStorage.getItem('jadeite_selected_address')
if (pickedAddressId) sessionStorage.removeItem('jadeite_selected_address')

const selectedAddress = computed(() => {
  if (pickedAddressId) {
    const picked = addressStore.addresses.find(a => a.id === pickedAddressId)
    if (picked) return picked
  }
  return addressStore.defaultAddress
})

async function handleSubmit() {
  if (orderItems.value.length === 0) {
    showToast('请先选择要结算的商品')
    return
  }
  if (!selectedAddress.value) {
    showToast('请先选择收货地址')
    router.push('/addresses?select=1')
    return
  }
  submitting.value = true
  try {
    const order = await orderStore.createOrder({
      items: orderItems.value,
      address: selectedAddress.value,
      addressId: selectedAddress.value.id,
      remark: remark.value,
      idempotentKey: clientOrderId
    })
    if (!order) {
      showToast('订单创建失败，请重试')
      submitting.value = false
      return
    }
    if (fromCart.value) {
      cartStore.clearChecked()
    }
    router.push(`/order/success?orderId=${order.id}`)
  } catch (err) {
    // server 模式下业务错误（库存不足/地址失效等）以 ApiError 抛出：提示后留在本页可重试
    showToast(err instanceof Error && err.message ? err.message : '订单创建失败，请重试')
    submitting.value = false
  }
}
</script>

<style scoped>
.order-confirm-page {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.empty-wrap {
  padding-top: 80px;
}

.card {
  background: #fff;
  border-radius: 10px;
  margin: 8px 16px;
  padding: 16px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 4%);
}

.address-card {
  margin-top: 12px;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.address-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.address-phone {
  font-size: 13px;
  color: #999;
  margin-left: auto;
}

.address-detail {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0;
  padding-left: 28px;
}

.address-empty {
  color: #999;
}

.product-row {
  display: flex;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 12px;
}

.product-row:last-of-type {
  margin-bottom: 0;
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
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 16px;
  font-weight: 700;
  color: #ff4d00;
}

.product-qty {
  font-size: 13px;
  color: #999;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  font-size: 13px;
}

.meta-label {
  color: #999;
}

.meta-value {
  color: #333;
}

.meta-value.free {
  color: #07c160;
}

.remark-card {
  padding: 0;
}

.remark-card :deep(.van-field) {
  padding: 12px 16px;
}

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

.submit-bar {
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
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  z-index: 100;
}

.submit-info {
  display: flex;
  align-items: baseline;
}

.submit-label {
  font-size: 13px;
  color: #666;
}

.submit-price {
  font-size: 20px;
  font-weight: 700;
  color: #ff4d00;
}

.submit-bar .van-button {
  height: 40px;
  padding: 0 28px;
  font-size: 15px;
  border-radius: 20px;
}
</style>
