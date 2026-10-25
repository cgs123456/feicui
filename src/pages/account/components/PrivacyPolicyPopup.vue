<template>
  <van-popup
    v-model:show="show"
    position="bottom"
    round
    :style="{ height: '60vh' }"
    aria-label="隐私政策"
  >
    <div class="popup-header">
      <span class="popup-title">隐私政策</span>
      <van-icon name="cross" size="20" @click="show = false" />
    </div>
    <div class="popup-body">
      <h4>一、信息收集</h4>
      <p>我们收集您的手机号、浏览记录等必要信息，用于提供更好的服务体验。</p>
      <h4>二、信息使用</h4>
      <p>您的信息仅用于订单处理、个性化推荐及平台服务优化，不会用于其他商业用途。</p>
      <h4>三、信息保护</h4>
      <p>我们采用加密传输、访问控制等技术手段保护您的信息安全。</p>
      <h4>四、信息共享</h4>
      <p>未经您的明确同意，我们不会向第三方共享您的个人信息，法律法规另有规定的除外。</p>
      <h4>五、Cookie 使用</h4>
      <p>我们使用 Cookie 改善您的浏览体验，您可以在浏览器设置中管理 Cookie 偏好。</p>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
const show = defineModel<boolean>('show', { default: false })
</script>

<style scoped>
/* Popup */
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.popup-body {
  padding: 16px;
  max-height: calc(60vh - 53px);
  overflow-y: auto;
}

.popup-body h4 {
  font-size: 14px;
  color: #333;
  margin: 14px 0 6px;
}

.popup-body h4:first-child {
  margin-top: 0;
}

.popup-body p {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
  margin: 0;
}
</style>
