<template>
  <div class="section-title">快捷功能</div>
  <div class="quick-actions">
    <div
      v-if="userStore.hasPermission('product:manage')"
      class="action-item card"
      role="button"
      tabindex="0"
      aria-label="发布商品"
      @click="router.push('/merchant/publish')"
    >
      <van-icon name="add-o" size="24" color="#07C160" />
      <span>发布商品</span>
    </div>
    <div
      v-if="userStore.hasPermission('product:manage')"
      class="action-item card"
      role="button"
      tabindex="0"
      aria-label="商品管理"
      @click="router.push('/merchant/products')"
    >
      <van-icon name="goods-collect-o" size="24" color="#07C160" />
      <span>商品管理</span>
    </div>
    <div
      v-if="userStore.hasPermission('customer:view')"
      class="action-item card"
      role="button"
      tabindex="0"
      aria-label="客资管理"
      @click="router.push('/merchant/customers')"
    >
      <van-icon name="friends-o" size="24" color="#07C160" />
      <span>客资管理</span>
    </div>
    <div
      v-if="userStore.hasPermission('order:manage')"
      class="action-item card"
      role="button"
      tabindex="0"
      aria-label="订单管理"
      @click="router.push('/merchant/orders')"
    >
      <van-icon name="orders-o" size="24" color="#07C160" />
      <span>订单管理</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
</script>

<style scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding: 16px 16px 8px;
}

/* 快捷功能 */
.quick-actions {
  display: flex;
  gap: 10px;
  padding: 0 16px;
  flex-wrap: wrap;
}

.action-item {
  flex: 1;
  min-width: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
}

.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
}
</style>
