<template>
  <div class="order-success-page">
    <div class="success-content">
      <div class="success-icon">
        <van-icon name="checked" size="64" color="#07C160" />
      </div>
      <h2 class="success-title">下单成功</h2>
      <p class="success-desc">商家将尽快与您联系确认订单</p>

      <div class="order-no-card">
        <span class="order-label">订单编号</span>
        <span class="order-no">{{ orderNo }}</span>
      </div>

      <div class="tips-card">
        <h4 class="tips-title">温馨提示</h4>
        <p class="tips-item">
          <van-icon name="info-o" size="14" color="#07C160" />
          商家将在 24 小时内确认订单并与您联系
        </p>
        <p class="tips-item">
          <van-icon name="info-o" size="14" color="#07C160" />
          翡翠为天然宝石，每件存在细微差异属正常现象
        </p>
        <p class="tips-item">
          <van-icon name="info-o" size="14" color="#07C160" />
          支持 7 天无理由退换货，定制商品除外
        </p>
      </div>
    </div>

    <div class="action-bar">
      <van-button round plain block aria-label="查看订单" @click="goOrders">
        查看订单
      </van-button>
      <van-button type="primary" round block aria-label="返回首页" @click="goHome">
        返回首页
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 生成模拟订单号
const orderNo = ref(`ORD${Date.now()}`)

function goOrders() {
  router.push('/profile')
}

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.order-success-page {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.success-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 24px 0;
}

.success-icon {
  margin-bottom: 16px;
}

.success-title {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px;
}

.success-desc {
  font-size: 14px;
  color: #999;
  margin: 0 0 32px;
}

.order-no-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px 20px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

.order-label {
  font-size: 14px;
  color: #999;
}

.order-no {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  font-family: 'Courier New', monospace;
}

.tips-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px 20px;
  width: 100%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.tips-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px;
}

.tips-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 8px;
}

.tips-item:last-child {
  margin-bottom: 0;
}

.action-bar {
  padding: 20px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-bar .van-button {
  height: 44px;
  font-size: 16px;
  border-radius: 20px;
}
</style>