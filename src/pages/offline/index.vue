<template>
  <div class="offline-page">
    <div class="offline-content">
      <van-icon name="wap-nav-o" size="64" color="#999" />
      <h2 class="offline-title">网络连接已断开</h2>
      <p class="offline-subtitle">请检查网络设置后重试</p>
      <van-button type="primary" round @click="retry">重试</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
function retry() {
  window.location.reload()
}
</script>

<style scoped>
.offline-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 16px;
}

.offline-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 430px;
  width: 100%;
  text-align: center;
}

.offline-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.offline-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0;
}
</style>
