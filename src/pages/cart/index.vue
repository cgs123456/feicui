<template>
  <div class="cart-page">
    <AppNavbar title="购物车" @click-left="router.back" />

    <div v-if="cartStore.items.length === 0" class="empty-wrap">
      <van-empty description="购物车是空的">
        <van-button type="primary" round @click="router.push('/')">去逛逛</van-button>
      </van-empty>
    </div>

    <template v-else>
      <div class="cart-list">
        <div
          v-for="item in cartStore.items"
          :key="item.productId"
          class="cart-item"
        >
          <van-checkbox
            :model-value="item.checked"
            icon-size="18"
            checked-color="#07C160"
            @change="cartStore.toggleCheck(item.productId)"
          />

          <van-image
            :src="item.cover"
            width="80"
            height="80"
            fit="cover"
            radius="8"
            lazy-load
            class="item-image"
            @click="router.push(`/products/${item.productId}`)"
          />

          <div class="item-info">
            <p class="item-title" @click="router.push(`/products/${item.productId}`)">{{ item.title }}</p>
            <div class="item-bottom">
              <span class="item-price">¥{{ (item.price || 0).toLocaleString() }}</span>
              <div class="item-actions">
                <van-stepper
                  :model-value="item.quantity"
                  :min="1"
                  :max="99"
                  integer
                  theme="round"
                  button-size="24"
                  @change="(val: number) => cartStore.updateQuantity(item.productId, val)"
                />
                <van-icon
                  name="delete-o"
                  size="20"
                  color="#999"
                  class="delete-icon"
                  @click="handleDelete(item.productId)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部结算栏 -->
      <div class="settle-bar">
        <div class="settle-check" @click="cartStore.toggleCheckAll()">
          <van-checkbox
            :model-value="allChecked"
            icon-size="18"
            checked-color="#07C160"
            @change="cartStore.toggleCheckAll()"
          />
          <span class="check-all-text">全选</span>
        </div>
        <div class="settle-info">
          <span class="settle-label">合计：</span>
          <span class="settle-price">¥{{ (cartStore.totalPrice || 0).toLocaleString() }}</span>
        </div>
        <van-button
          type="primary"
          round
          :disabled="cartStore.checkedItems.length === 0"
          @click="goCheckout"
        >
          去结算{{ cartStore.checkedItems.length > 0 ? `(${cartStore.checkedItems.length})` : '' }}
        </van-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { useCartStore } from '../../stores/cart'
import AppNavbar from '../../components/AppNavbar.vue'

const router = useRouter()
const cartStore = useCartStore()

const allChecked = computed(() => {
  return cartStore.items.length > 0 && cartStore.items.every(item => item.checked)
})

function handleDelete(productId: string) {
  showDialog({
    title: '删除商品',
    message: '确定要从购物车中移除该商品吗？',
    showCancelButton: true,
    confirmButtonText: '删除',
    confirmButtonColor: '#ff4d4f'
  }).then(() => {
    cartStore.removeFromCart(productId)
    showToast('已删除')
  }).catch(() => {})
}

function goCheckout() {
  if (cartStore.checkedItems.length === 0) {
    showToast('请选择商品')
    return
  }
  router.push('/order/confirm?from=cart')
}
</script>

<style scoped>
.cart-page {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.empty-wrap {
  padding-top: 80px;
}

.cart-list {
  padding: 8px 16px;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.item-image {
  flex-shrink: 0;
  cursor: pointer;
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 80px;
}

.item-title {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
  cursor: pointer;
}

.item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-price {
  font-size: 16px;
  font-weight: 700;
  color: #ff4d00;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.delete-icon {
  cursor: pointer;
}

/* Settle Bar */
.settle-bar {
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
  gap: 10px;
  z-index: 100;
}

.settle-check {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.check-all-text {
  font-size: 14px;
  color: #333;
}

.settle-info {
  flex: 1;
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  padding-right: 8px;
}

.settle-label {
  font-size: 13px;
  color: #666;
}

.settle-price {
  font-size: 18px;
  font-weight: 700;
  color: #ff4d00;
}

.settle-bar .van-button {
  height: 38px;
  padding: 0 20px;
  font-size: 14px;
}
</style>