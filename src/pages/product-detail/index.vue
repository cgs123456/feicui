<template>
  <div class="product-detail-page">
    <AppNavbar title="商品详情" @click-left="router.back" />

    <van-empty v-if="!product && !loading" description="商品不存在" :image-size="120" />

    <div v-if="loading" class="card skeleton-card">
      <van-skeleton :row="8" :loading="loading" />
    </div>

    <template v-else-if="product">
      <!-- Image Carousel -->
      <div class="swipe-wrap">
        <van-swipe :autoplay="3000" indicator-color="#07C160" class="product-swipe">
          <van-swipe-item v-for="(img, idx) in productImages" :key="idx">
            <van-image :src="detailImage(img)" width="100%" height="375" fit="cover" lazy-load />
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
          <span v-if="product.originalPrice && product.price" class="discount-tag">
            {{ Math.round((1 - product.price / product.originalPrice) * 100) }}% OFF
          </span>
        </div>
        <h2 class="product-title">{{ product.title }}</h2>
        <div class="tags-row">
          <van-tag v-if="product.category" color="#E8F8EF" text-color="#07C160" size="medium" plain>
            {{ product.category }}
          </van-tag>
          <van-tag v-if="product.material" color="#E8F8EF" text-color="#07C160" size="medium" plain>
            {{ product.material }}
          </van-tag>
          <van-tag v-if="product.certificate" type="primary" size="medium" plain>
            {{ product.certificate }}
          </van-tag>
        </div>
      </div>

      <!-- Specs Table -->
      <div class="card specs-card" role="region" aria-label="规格参数">
        <h3 class="section-title">规格参数</h3>
        <van-cell-group :border="false" class="specs-group">
          <van-cell title="种水" :value="product.waterGrade || '--'" />
          <van-cell title="颜色" :value="product.color || '--'" />
          <van-cell title="材质" :value="product.material || '--'" />
          <van-cell title="尺寸" :value="product.size || '--'" />
          <van-cell title="重量" :value="product.weight || '--'" />
          <van-cell title="款式" :value="product.style || '--'" />
          <van-cell title="证书编号" :value="product.certNo || '--'" />
          <van-cell title="鉴定机构" :value="product.certOrg || '--'" />
          <van-cell title="鉴定日期" :value="product.certDate || '--'" />
          <van-cell title="证书等级" :value="product.certGrade || '--'" />
        </van-cell-group>
      </div>

      <!-- Certificate Card -->
      <div v-if="product.certNo || product.certOrg" class="card cert-card" role="region" aria-label="鉴定证书">
        <div class="cert-header">
          <van-icon name="certificate" size="20" color="#07c160" />
          <h3 class="section-title cert-title">鉴定证书</h3>
        </div>
        <div class="cert-body">
          <div class="cert-row">
            <span class="cert-label">鉴定机构</span>
            <span class="cert-value">{{ product.certOrg || '--' }}</span>
          </div>
          <div class="cert-row">
            <span class="cert-label">证书编号</span>
            <span class="cert-value">{{ product.certNo || '--' }}</span>
          </div>
          <div class="cert-row">
            <span class="cert-label">鉴定日期</span>
            <span class="cert-value">{{ product.certDate || '--' }}</span>
          </div>
          <div class="cert-row">
            <span class="cert-label">证书等级</span>
            <span class="cert-value">{{ product.certGrade || '--' }}</span>
          </div>
        </div>
        <div class="cert-note">
          <van-icon name="info-o" size="14" color="#07c160" />
          <span>本证书可通过机构官网查询验证</span>
        </div>
      </div>

      <!-- Description -->
      <div class="card desc-card" role="region" aria-label="商品描述">
        <h3 class="section-title">商品描述</h3>
        <p class="desc-text">
          {{ product.description || '精选天然缅甸翡翠A货，质地细腻温润，色泽均匀自然。每件翡翠均经过专业鉴定，附权威机构鉴定证书，品质有保障。' }}
        </p>
      </div>

      <!-- Bottom Bar -->
      <div class="bottom-bar">
        <button class="btn-icon" aria-label="收藏" @click="handleToggleFavorite">
          <van-icon :name="isFavorited ? 'star' : 'star-o'" :color="isFavorited ? '#ff976a' : '#999'" size="22" />
          <span>收藏</span>
        </button>
        <button class="btn-icon" aria-label="购物车" @click="goCart">
          <van-icon name="cart-o" size="22" />
          <span>购物车</span>
          <span v-if="cartStore.totalCount > 0" class="cart-badge">{{ cartStore.totalCount }}</span>
        </button>
        <button class="btn-outline" aria-label="加入购物车" @click="throttledAddToCart">
          加入购物车
        </button>
        <button class="btn-primary" aria-label="立即购买" @click="showBuy = true">立即购买</button>
      </div>

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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { throttle } from '@/utils/debounce'
import { detailImage } from '@/utils/image'
import { useProductStore } from '../../stores/product'
import { useCartStore } from '../../stores/cart'
import { useFavoriteStore } from '../../stores/favorite'
import AppNavbar from '../../components/AppNavbar.vue'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const cartStore = useCartStore()
const favoriteStore = useFavoriteStore()

const showContact = ref(false)
const showBuy = ref(false)
const loading = ref(true)

setTimeout(() => { loading.value = false }, 400)

const productId = computed(() => route.params.id as string)
const product = computed(() => productStore.getProductById(productId.value))

const isFavorited = computed(() => favoriteStore.isFavorite(productId.value))

const productImages = computed(() => {
  if (product.value?.images && product.value.images.length > 0) {
    return product.value.images
  }
  return [
    'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop'
  ]
})

function handleToggleFavorite() {
  if (!product.value) return
  favoriteStore.toggleFavorite({
    productId: product.value.id,
    title: product.value.title,
    cover: product.value.cover,
    price: product.value.price
  })
  showToast(isFavorited.value ? '已取消收藏' : '已加入收藏')
}

function handleAddToCart() {
  if (!product.value) return
  cartStore.addToCart({
    productId: product.value.id,
    title: product.value.title,
    cover: product.value.cover,
    price: product.value.price,
    quantity: 1
  })
  showToast('已加入购物车')
}

const throttledAddToCart = throttle(handleAddToCart, 500)

function goCart() {
  router.push('/cart')
}

function handleCallMerchant() {
  window.location.href = 'tel:13888886666'
  showToast('正在呼叫商家...')
}

function handleBuyConfirm() {
  showBuy.value = false
  router.push(`/order/confirm?id=${productId.value}`)
}
</script>

<style scoped>
.product-detail-page {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.swipe-wrap { background: #fff; }
.product-swipe { --van-swipe-indicator-size: 6px; }
.product-swipe .van-swipe-item { display: flex; align-items: center; justify-content: center; }

.info-card { margin-top: 0; border-radius: 0 0 14px 14px; }
.price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.current-price { font-size: 24px; font-weight: 700; color: #ff4d00; }
.original-price { font-size: 14px; color: #999; text-decoration: line-through; }
.discount-tag { font-size: 12px; color: #fff; background: #ff4d00; padding: 2px 8px; border-radius: 4px; }
.product-title { font-size: 18px; font-weight: 600; color: #1a1a1a; line-height: 1.4; margin-bottom: 10px; }
.tags-row { display: flex; gap: 8px; flex-wrap: wrap; }

.card { background: #fff; border-radius: 10px; padding: 16px; margin: 8px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.section-title { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }

.specs-group { --van-cell-font-size: 14px; --van-cell-value-color: #333; --van-cell-title-color: #999; }
.specs-group .van-cell { padding: 10px 0; }
.specs-group .van-cell::after { border-color: #f5f5f5; }

.cert-card { background: #e8f8ee; border: 1px solid #b7ebc8; }
.cert-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.cert-title { margin-bottom: 0; }
.cert-body { display: flex; flex-direction: column; }
.cert-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(7,193,96,0.1); font-size: 14px; }
.cert-row:last-child { border-bottom: none; }
.cert-label { color: #666; }
.cert-value { color: #333; font-weight: 500; }
.cert-note { display: flex; align-items: center; gap: 6px; margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(7,193,96,0.15); font-size: 12px; color: #07c160; }

.desc-card { margin-bottom: 20px; }
.desc-text { font-size: 14px; color: #666; line-height: 1.8; }

.bottom-bar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px; background: #fff; border-top: 1px solid #eee;
  padding: 10px 12px; padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  display: flex; gap: 8px; align-items: center; z-index: 100;
}
.btn-icon {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  border: none; background: none; font-size: 11px; color: #666; cursor: pointer;
  position: relative; flex-shrink: 0; padding: 4px;
}
.cart-badge {
  position: absolute; top: -4px; right: -8px;
  min-width: 16px; height: 16px; border-radius: 8px;
  background: #ff4d00; color: #fff; font-size: 10px;
  display: flex; align-items: center; justify-content: center; padding: 0 4px;
}
.btn-outline {
  flex: 1; border: 1px solid #07c160; color: #07c160; background: #fff;
  border-radius: 20px; height: 38px; font-size: 14px; cursor: pointer;
}
.btn-primary {
  flex: 1; border: none; background: #07c160; color: #fff;
  border-radius: 20px; height: 38px; font-size: 14px; cursor: pointer;
}

.dialog-body { padding: 8px 0; }
.dialog-info { font-size: 14px; color: #666; line-height: 2; margin: 0; }
.skeleton-card { padding: 20px; margin-top: 8px; }
</style>