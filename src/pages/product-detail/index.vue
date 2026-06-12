<template>
  <div class="product-detail-page">
    <!-- Header -->
    <AppNavbar title="商品详情" @click-left="router.back" />

    <!-- Not Found -->
    <van-empty v-if="!product && !loading" description="商品不存在" :image-size="120" />

    <!-- Skeleton -->
    <div v-if="loading" class="card skeleton-card">
      <van-skeleton :row="8" :loading="loading" />
    </div>

    <template v-else-if="product">
      <!-- Image Carousel -->
      <div class="swipe-wrap">
        <van-swipe :autoplay="3000" indicator-color="#07C160" class="product-swipe">
          <van-swipe-item v-for="(img, idx) in productImages" :key="idx">
            <van-image :src="img" width="100%" height="375" fit="cover" lazy-load />
          </van-swipe-item>
        </van-swipe>
      </div>

      <!-- Product Info -->
      <div class="card info-card" role="region" aria-label="商品信息">
        <div class="price-row">
          <span class="current-price">¥{{ (product.price || 0).toLocaleString() }}</span>
          <span v-if="product.originalPrice" class="original-price"
            >¥{{ product.originalPrice.toLocaleString() }}</span
          >
        </div>
        <h2 class="product-title">{{ product.title }}</h2>
        <div class="tags-row">
          <van-tag v-if="product.category" color="#E8F8EF" text-color="#07C160" size="medium" plain>
            {{ product.category }}
          </van-tag>
          <van-tag v-if="product.material" color="#E8F8EF" text-color="#07C160" size="medium" plain>
            {{ product.material }}
          </van-tag>
        </div>
      </div>

      <!-- Specs Table -->
      <div class="card specs-card" role="region" aria-label="规格参数">
        <h3 class="section-title">规格参数</h3>
        <div class="specs-table">
          <div class="spec-row">
            <span class="spec-label">材质</span>
            <span class="spec-value">{{ product.material || '冰种翡翠' }}</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">尺寸</span>
            <span class="spec-value">{{ product.size || '圈口56mm' }}</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">重量</span>
            <span class="spec-value">{{ product.weight || '待测量' }}</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">款式</span>
            <span class="spec-value">{{ product.style || product.category || '翡翠饰品' }}</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">证书</span>
            <span class="spec-value">{{ product.certificate || '已鉴定' }}</span>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="card desc-card" role="region" aria-label="商品描述">
        <h3 class="section-title">商品描述</h3>
        <p class="desc-text">
          {{
            product.description ||
            '精选天然缅甸翡翠A货，质地细腻温润，色泽均匀自然。每件翡翠均经过专业鉴定，附权威机构鉴定证书，品质有保障。翡翠作为天然宝石，每一件都是独一无二的艺术品，承载着东方文化的深厚底蕴。'
          }}
        </p>
      </div>

      <!-- Bottom Bar -->
      <div class="bottom-bar">
        <button class="btn-outline" aria-label="联系商家" @click="showContact = true">
          联系商家
        </button>
        <button class="btn-primary" aria-label="立即购买" @click="showBuy = true">立即购买</button>
      </div>

      <!-- 联系商家弹窗 -->
      <van-dialog
        v-model:show="showContact"
        title="联系商家"
        show-cancel-button
        confirm-button-text="拨打电话"
        aria-label="联系商家弹窗"
        @confirm="handleCallMerchant"
      >
        <div class="dialog-body">
          <p class="dialog-info">商家：翡翠源珠宝</p>
          <p class="dialog-info">电话：138-8888-6666</p>
          <p class="dialog-info">微信：jadeite_shop</p>
          <p class="dialog-info">营业时间：09:00 - 21:00</p>
        </div>
      </van-dialog>

      <!-- 购买确认弹窗 -->
      <van-dialog
        v-model:show="showBuy"
        title="确认购买"
        show-cancel-button
        confirm-button-text="确认下单"
        aria-label="确认购买弹窗"
        @confirm="handleBuyConfirm"
      >
        <div class="dialog-body">
          <p class="dialog-info">商品：{{ product.title }}</p>
          <p class="dialog-info">价格：¥{{ (product.price || 0).toLocaleString() }}</p>
          <p class="dialog-info">数量：1 件</p>
        </div>
      </van-dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useProductStore } from '../../stores/product'
import AppNavbar from '../../components/AppNavbar.vue'

const showContact = ref(false)
const showBuy = ref(false)
const loading = ref(true)

// 模拟首次加载
setTimeout(() => {
  loading.value = false
}, 400)

function handleCallMerchant() {
  window.location.href = 'tel:13888886666'
  showToast('正在呼叫商家...')
}

function handleBuyConfirm() {
  showBuy.value = false
  router.push(`/order/confirm?id=${productId.value}`)
}

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()

const productId = computed(() => route.params.id as string)
const product = computed(() => productStore.getProductById(productId.value))

const productImages = computed(() => {
  if (product.value && product.value.images && product.value.images.length > 0) {
    return product.value.images
  }
  return [
    'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop'
  ]
})
</script>

<style scoped>
.product-detail-page {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  background: #f5f5f5;
  padding-bottom: 80px;
}

/* Swipe */
.swipe-wrap {
  background: #fff;
}

.product-swipe {
  --van-swipe-indicator-size: 6px;
}

.product-swipe .van-swipe-item {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Info Card */
.info-card {
  margin-top: 0;
  border-radius: 0 0 14px 14px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

.current-price {
  font-size: 24px;
  font-weight: 700;
  color: #ff4d00;
}

.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.product-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
  margin-bottom: 10px;
}

.tags-row {
  display: flex;
  gap: 8px;
}

/* Card base */
.card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  margin: 8px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
}

/* Specs */
.specs-table {
  display: flex;
  flex-direction: column;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 14px;
}

.spec-row:last-child {
  border-bottom: none;
}

.spec-label {
  color: #999;
}

.spec-value {
  color: #333;
}

/* Description */
.desc-card {
  margin-bottom: 20px;
}

.desc-text {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
}

/* Bottom Bar */
.bottom-bar {
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
  gap: 12px;
  align-items: center;
  z-index: 100;
}

.btn-outline {
  flex: 1;
  border: 1px solid #07c160;
  color: #07c160;
  background: #fff;
  border-radius: 20px;
  height: 40px;
  font-size: 15px;
  cursor: pointer;
}

.btn-primary {
  flex: 1;
  border: none;
  background: #07c160;
  color: #fff;
  border-radius: 20px;
  height: 40px;
  font-size: 15px;
  cursor: pointer;
}

/* Dialog */
.dialog-body {
  padding: 8px 0;
}

.dialog-info {
  font-size: 14px;
  color: #666;
  line-height: 2;
  margin: 0;
}

/* Skeleton */
.skeleton-card {
  padding: 20px;
  margin-top: 8px;
}
</style>
