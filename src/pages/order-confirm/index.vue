<template>
  <div class="order-confirm-page">
    <AppNavbar title="确认订单" @click-left="router.back" />

    <div v-if="!product" class="loading-wrap">
      <van-loading size="32" color="#07C160" />
      <p>加载中...</p>
    </div>

    <template v-else>
      <!-- 收货地址 -->
      <div class="card address-card" role="region" aria-label="收货地址">
        <div class="address-header">
          <van-icon name="location-o" size="20" color="#07C160" />
          <span class="address-name">{{ selectedAddress.name }}</span>
          <span class="address-phone">{{ selectedAddress.phone }}</span>
        </div>
        <p class="address-detail">{{ selectedAddress.fullAddress }}</p>
      </div>

      <!-- 商品信息 -->
      <div class="card product-card" role="region" aria-label="商品信息">
        <div class="product-row">
          <van-image
            :src="product.cover"
            width="80"
            height="80"
            fit="cover"
            radius="8"
            lazy-load
          />
          <div class="product-info">
            <h3 class="product-title">{{ product.title }}</h3>
            <p class="product-price">¥{{ (product.price || 0).toLocaleString() }}</p>
          </div>
        </div>
        <div class="product-meta">
          <span class="meta-label">数量</span>
          <span class="meta-value">x1</span>
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
          <span class="price-value">¥{{ (product.price || 0).toLocaleString() }}</span>
        </div>
        <div class="price-row">
          <span class="price-label">运费</span>
          <span class="price-value free">包邮</span>
        </div>
        <div class="price-row total">
          <span class="price-label">合计</span>
          <span class="price-value total-price"
            >¥{{ (product.price || 0).toLocaleString() }}</span
          >
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-bar">
        <div class="submit-info">
          <span class="submit-label">合计：</span>
          <span class="submit-price">¥{{ (product.price || 0).toLocaleString() }}</span>
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
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useProductStore } from '../../stores/product'
import AppNavbar from '../../components/AppNavbar.vue'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()

const productId = computed(() => (route.query.id as string) || '')
const product = computed(() => productStore.getProductById(productId.value))

const remark = ref('')
const submitting = ref(false)

// 模拟默认地址
const selectedAddress = ref({
  name: '张三',
  phone: '138****8888',
  fullAddress: '北京市朝阳区建国路88号翡翠大厦A座1201室'
})

function handleSubmit() {
  submitting.value = true
  setTimeout(() => {
    submitting.value = false
    router.push('/order/success')
  }, 1500)
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

/* Address */
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

/* Product */
.product-row {
  display: flex;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
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

.product-price {
  font-size: 16px;
  font-weight: 700;
  color: #ff4d00;
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

/* Remark */
.remark-card {
  padding: 0;
}

.remark-card :deep(.van-field) {
  padding: 12px 16px;
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

/* Submit Bar */
.submit-bar {
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
}
</style>